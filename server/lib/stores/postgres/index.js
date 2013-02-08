var fs = require('fs');
var pg = require('pg');
var config = process.app.config.database;
var datastore = module.exports = {};

var conString = 'tcp://' +
  config.username + ':' +
  config.password + '@' +
  config.host + ':' +
  config.port + '/' +
  config.database;

// callback with a client. crash the whole app on error.
var connect = datastore.connect = function(callback) {
    pg.connect(conString, function (err, client) {
        if (err) {
            // TODO: retry a few times with delays, so we can survive a quick
            // database hiccup. crash the whole app only if the DB's really
            // unavailable.
            console.log('Could not connect to database:');
            console.log(err);
            process.exit(1);
        }
        callback(client);
   });
};

// callback with (error, list_of_tables) from database
var list_tables = datastore.list_tables = function(callback) {
    connect(function(client) {
        client.query("select * from pg_tables", function (err, result) {
            if (err) { return callback(err); }
            var tables = [];
            var rows = result.rows.length;
            for (var i = 0; i < rows; i++) {
                tables.push(result.rows[i].tablename);
            }
            callback(null, tables);
        });
    });
};

datastore.isSetup = function (callback) {
  var currentTables = [];
  var neededTables = [
    'account',
    'challenge'
    // TODO refactor this whole thing...
    // I don't think we need to check for every table
  ];

  connect(function (client) {
    client.query('select * from pg_tables', function (err, result) {
      for (var i in result.rows) {
        currentTables.push(result.rows[i].tablename);
      }

      for (var j in neededTables) {
        if (!~currentTables.indexOf(neededTables[j])) {
          return callback(false);
        }
      }

      return callback(true);
    });
  });
};

// XXX review: this isn't needed anymore. we always setup the
// schema before running node. this is a race condition anyway,
// because other events could fire before applying the schema
// completes.
datastore.setup = function () {
  console.log('Installing necessary tables...');
  var setupQuery = fs.readFileSync(__dirname + '/setup.sql').toString();

  connect(function (client) {
    client.query(setupQuery, function (err, result) {
      if (err) {
        console.log(err);
        process.exit(1);
      }

      console.log('Successfully created Crypton tables...');
    });
  });
};

// XXX review: we shouldn't check for usernames like this. we
// should just try to insert them, and catch the error when they
// fail by being a duplicate.
datastore.isUsernameTaken = function (username, callback) {
  connect(function (client) {
    var query = {
      text: 'select * from account where username = $1',
      values: [ username ]
    };

    client.query(query, function (err, result) {
      if (err || result.rows.length) {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
};

/*
 * Saves a generated user object
 * Creates an "account" row
 * Creates a "base_keyring" row
 * Associates them
 */
datastore.saveUser = function (user, callback) {
  connect(function (client) {

    client.query('begin');

    var accountQuery = {
      text: 'insert into account ("username") values ($1) returning account_id',
      values: [ user.username ]
    };

    client.query(accountQuery, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        // FIXME: rollback the database transaction
        return;
      }

      var accountId = result.rows[0].account_id;

      var columns = [
        'account_id',
        'pubkey_serialized',
        'salt_key',
        'salt_challenge',
        'challenge_key',
        'keypair_iv',
        'keypair_serialized_ciphertext',
        'symkey_ciphertext',
        'container_name_hmac_key_iv',
        'container_name_hmac_key_ciphertext',
        'hmac_key_iv',
        'hmac_key_ciphertext'
      ];

      var keyringQuery = {
        text: "insert into base_keyring (\"" + columns.join('", "') + "\") \
          values ($1, $2, \
          decode($3, 'hex'), decode($4, 'hex'), decode($5, 'hex'), \
          decode($6, 'hex'), decode($7, 'hex'), decode($8, 'hex'), \
          decode($9, 'hex'), decode($10, 'hex'), decode($11, 'hex'), decode($12, 'hex')) \
          returning base_keyring_id",
        values: [
          accountId,
          user.pubKey,
          user.saltKey,
          user.saltChallenge,
          user.challengeKey,
          user.keypairIv,
          user.keypairSerializedCiphertext,
          user.symkeyCiphertext,
          user.containerNameHmacKeyIv,
          user.containerNameHmacKeyCiphertext,
          user.hmacKeyIv,
          user.hmacKeyCiphertext
        ]
      };

      client.query(keyringQuery, function (err, result) {
        if (err) {
          console.log(err);
          callback('Database error');
          return;
        }

        var associationQuery = {
          text: 'update account set base_keyring_id = $1 where account_id = $2',
          values: [
            result.rows[0].base_keyring_id,
            accountId
          ]
        };

        client.query(associationQuery, function (err, result) {
          if (err) {
            console.log(err);
            callback('Database error');
            return;
          }

          client.query('commit', function (err, result) {
            if (err) {
              console.log(err);
              callback('Database error');
              return;
            }

            callback();
          });
        });
      });
    });
  });
};

datastore.getUser = function (username, callback) {
  connect(function (client) {
    if (err) {
      console.log(err);
      callback('Database error');
      return;
    }

    var query = {
      text: 'select * from account, base_keyring where account.username = $1 \
        and base_keyring.account_id = account.account_id',
      values: [ username ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      if (!result.rows || !result.rows.length) {
        callback('User does not exist');
      } else {
        var row = result.rows[0];
        var user = {
          accountId: row.account_id,
          username: row.username,
          keyringId: row.base_keyring_id,
          saltKey: row.salt_key.toString('hex'),
          saltChallenge: row.salt_challenge.toString('hex'),
          challengeKey: row.challenge_key.toString('hex'),
          keypairIv: row.keypair_iv.toString('hex'),
          keypairSerializedCiphertext: row.keypair_serialized_ciphertext.toString('hex'),
          pubKey: row.pubkey_serialized.toString('hex'),
          symkeyCiphertext: row.symkey_ciphertext.toString('hex'),
          containerNameHmacKeyIv: row.container_name_hmac_key_iv.toString('hex'),
          containerNameHmacKeyCiphertext: row.container_name_hmac_key_ciphertext.toString('hex'),
          hmacKeyIv: row.hmac_key_iv.toString('hex'),
          hmacKeyCiphertext: row.hmac_key_ciphertext.toString('hex')
        };

        callback(null, user);
      }
    });
  });
};

datastore.saveChallenge = function (user, expectedAnswerDigestHex, callback) {
  connect(function (client) {

    var query = {
      text: "insert into challenge (account_id, base_keyring_id, expected_answer_digest) \
        values ($1, $2, decode($3, 'hex')) returning challenge_id",
      values: [
        user.accountId,
        user.keyringId,
        expectedAnswerDigestHex
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      callback(null, result.rows[0].challenge_id);
    });
  });
};

datastore.getChallenge = function (challengeId, callback) {
  pg.connect(function (client) {

    var query = {
      text: "select * from challenge where challenge_id = $1",
      values: [
        challengeId
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      if (!result.rows || !result.rows[0]) {
        console.log(err);
        callback('Unknown challenge id');
        return;
      }

      callback(null, {
        challengeId: result.rows[0].challenge_id,
        accountId: result.rows[0].account_id,
        baseKeyringId: result.rows[0].base_keyring_id,
        creationTime: result.rows[0].creation_time,
        expectedAnswerDigest: result.rows[0].expected_answer_digest.toString('hex')
      });
    });
  });
};
