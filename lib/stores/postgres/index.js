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

var client = datastore.client = new pg.Client(conString);

client.connect(function (err) {
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
}

datastore.setup = function () {
  console.log('Installing necessary tables...');
  var setupQuery = fs.readFileSync(__dirname + '/setup.sql').toString();
  client.query(setupQuery, function (err, result) {
    if (!err) {
      console.log('Successfully created Crypton tables...');
    } else {
      console.log(err);
      process.exit(1);
    }
  });
}

datastore.isUsernameTaken = function (username, callback) {
  var query = client.query('select * from account where username = $1', [ username ]);
  var rows = [];

  query.on('row', function (row) {
    rows.push(row);
  });

  query.on('end', function () {
    if (rows.length) {
      callback(true);
    } else {
      callback(false);
    }
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
  var query = 'insert into account ("username") values ($1) returning account_id';
  var data = [
    user.username
  ];

  // create the account row
  client.query(query, data, function (err, result) {
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

    query = 'insert into base_keyring ("' + columns.join('", "') + '") \
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) \
      returning base_keyring_id';

    data = [
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
    ];

    // create the base_keychain row
    client.query(query, data, function (err, result) {
      console.log(arguments);
      query = '';
      data = [];

      // create the association
      client.query(query, data, function (err, result) {
        console.log(arguments);
      
      });
    }); 
  });
  callback();
}

datastore.getUser = function (username, callback) {
  var query = client.query('select * from account where username = $1', [ username ]);
  var rows = [];

  query.on('row', function (row) {
    rows.push(row);
  });

  query.on('end', function () {
    if (rows.length) {
      callback(null, rows);
    } else {
      callback('User does not exist');
    }
  });
}

datastore.saveChallenge = function () {
  callback();
}
