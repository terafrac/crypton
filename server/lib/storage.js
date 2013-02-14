var app = process.app || require('../app');

try {
  module.exports = require('./stores/' + app.config.database.type);
} catch (e) {
  console.log('Could not load datastore from config:');
  console.log(e);
  process.exit(1);
}
