var datastore = require('./');
var connect = datastore.connect;

datastore.createTransaction = function (account, callback) {
  callback();
};

datastore.getTransaction = function (token, callback) {
  callback();
};

datastore.deleteTransaction = function (token, callback) {
  callback();
};

datastore.updateTransaction = function (token, account, data, callback) {
  callback();
};
