'use strict';

var connect = require('./db').connect;


// turns under_scores into camelCase
function camelize(str) {
  return str.replace(/\_(.)/g, function (x, chr) {
    return chr.toUpperCase();
  });
}
exports.camelize = camelize;

exports.camelizeObject = function camelizeObject(obj) {
  var newObj = {};
  for (var i in obj) {
    newObj[camelize(i)] = obj[i];
  }
  return newObj;
};


// callback with (error, listOfTables) from database
exports.listTables = function listTables(callback) {
  connect().then(function (client) {
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
