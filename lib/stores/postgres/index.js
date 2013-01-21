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

  client.query('SELECT NOW() AS "theTime"', function (err, result) {
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

datastore.isUsernameTaken = function (callback) {
  callback(false);
}

datastore.saveUser = function (user, callback) {
  callback();
}

datastore.getUser = function (criteria, callback) {
  callback();
}

datastore.saveChallenge = function () {
  callback();
}
