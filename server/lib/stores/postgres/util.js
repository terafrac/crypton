var fs = require('fs');
var pg = require('pg');
var config = process.app.config.database;
var datastore = require('./');

var conString = 'tcp://' +
  config.username + ':' +
  config.password + '@' +
  config.host + ':' +
  config.port + '/' +
  config.database;

// callback with a client. crash the whole app on error.
var connect = datastore.connect = function (callback) {
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

// callback with (error, listOfTables) from database
var listTables = datastore.listTables = function(callback) {
  connect(function(client) {
    client.query('select * from pg_tables', function (err, result) {
      if (err) {
        return callback(err);
      }

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
