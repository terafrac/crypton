/* Crypton Server, Copyright 2013 SpiderOak, Inc.
 *
 * This file is part of Crypton Server.
 *
 * Crypton Server is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton Server is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton Server.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var pg = require('pg');
var datastore = require('./');


datastore.util = {};

// turns under_scores into camelCase
datastore.util.camelize = function (str) {
  return str.replace(/\_(.)/g, function (x, chr) {
     return chr.toUpperCase();
  });
};

datastore.util.camelizeObject = function (obj) {
  var newObj = {};

  for (var i in obj) {
    newObj[datastore.util.camelize(i)] = obj[i];
  }

  return newObj;
};

// callback with a client. crash the whole app on error.
var connect = datastore.connect = function connect(callback) {
  var config = process.app.config.database;
  var conString = 'tcp://' +
    config.username + ':' +
    config.password + '@' +
    config.host + ':' +
    config.port + '/' +
    config.database;

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
datastore.listTables = function listTables(callback) {
  connect(function (client) {
    client.query('select * from pg_tables', function (err, result) {
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
