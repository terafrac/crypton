// this is intended to be an abstract api for storing
// things in the database selected in the config file.
// for now, I am just using Postgres and will expand later

var pg = require('pg');
var conString = "tcp://username:password@localhost:5432/crypton";

var datastore = module.exports = {};

datastore.client = new pg.Client(conString);

datastore.client.connect(function (err) {
  if (err) {
    console.log('Could not connect to database:');
    console.log(err);
    process.exit(1);
  }

  console.log('querying');
  datastore.client.query('SELECT NOW() AS "theTime"', function (err, result) {
    console.log(result.rows[0].theTime + ' Connected to database');
  });
});
