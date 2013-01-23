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

pg.connect(conString, function (err, client) {
  if (err) {
    console.log('Could not connect to database:');
    console.log(err);
    process.exit(1);
  }

  client.query('select now() as "theTime"', function (err, result) {
    console.log(result.rows[0].theTime + ' Connected to database');

    datastore.isSetup(function (isSetup) {
      if (!isSetup) {
        datastore.setup();
      } else {
        console.log('Database succifient for use');
      }
    });
  });
});

datastore.isSetup = function (callback) {
  var currentTables = [];
  var neededTables = [
    'account',
    'challenge',
    // TODO refactor this whole thing...
    // I don't think we need to check for every table
  ];

  pg.connect(conString, function (err, client) {
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
}

datastore.setup = function () {
  console.log('Installing necessary tables...');
  var setupQuery = fs.readFileSync(__dirname + '/setup.sql').toString();

  pg.connect(conString, function (err, client) {
    client.query(setupQuery, function (err, result) {
      if (err) {
        console.log(err);
        process.exit(1);
      }

      console.log('Successfully created Crypton tables...');
    });
  });
}

datastore.isUsernameTaken = function (username, callback) {
  pg.connect(conString, function (err, client) {
    var query = {
      text: 'select * from account where username = $1',
      values: [ username ]
    };

    client.query(query, function (err, result) {
      if (err || !result.rows.length) {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
}

/*
 * Saves a generated user object
 * Creates an "account" row
 * Creates a "base_keyring" row
 * Associates them
 */
datastore.saveUser = function (user, callback) {
  console.log(user);
  pg.connect(conString, function (err, client) {
    var query = {
      text: 'insert into account ("username") values ($1) returning account_id',
      values: [ user.username ]
    };

    // create the account row
    client.query(query, function (err, result) {
      if (err) {
        callback(err);
        return;
      }

      var columns = [
        'account_id',
        'salt_key',
        'salt_challenge',
        'challenge_key',
        'keypair_iv',
        'keypair_serialized_ciphertext',
        'pubkey_serialized',
        'symkey_ciphertext',
        'container_name_hmac_key_iv',
        'container_name_hmac_key_ciphertext',
        'hmac_key_iv',
        'hmac_key_ciphertext'
      ];

      query = {
        text: 'insert into base_keyring ("' + columns.join('", "') + '") \
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) \
          returning base_keyring_id',
        values: [
          result.rows[0].account_id,
          user.saltKey,
          user.saltChallenge,
          user.challengeKey,
          user.keypairIv,
          user.keypairSerializedCiphertext,
          user.pubKey,
          user.symkeyCiphertext,
          user.containerNameHmacKeyIv,
          user.containerNameHmacKeyCiphertext,
          user.hmacKeyIv,
          user.hmacKeyCiphertext
        ]
      };

      // create the base_keychain row
      client.query(query, function (err, result) {
        console.log(arguments);
        query = {
          text: '',
          values: []
        };

        // create the association
        client.query(query, function (err, result) {
          console.log(arguments);
        
        });
      }); 
    });
    callback();
  });
}

datastore.getUser = function (username, callback) {
  pg.connect(conString, function (err, client) {
    var query = {
      text: 'select * from account where username = $1',
      values: [ username ]
    };

    client.query(query, function (err, result) {
      if (err) {
        callback(err);
        return;
      }

      if (rows.length) {
        callback(null, rows);
      } else {
        callback('User does not exist');
      }
    });
  });
}

datastore.saveChallenge = function () {
  callback();
}
