var app = process.app;
var config = app.config;

try {
  module.exports = require('./stores/' + config.database.type);
} catch (e) {
  console.log('Could not load datastore from config:');
  console.log(e);
  process.exit(1);
}
