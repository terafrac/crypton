var datastore = require('./');
var connect = datastore.connect;

datastore.createTransaction = function (accountId, callback) {
  connect(function (client) {
    console.log(accountId);
    var query = {
      text: 'insert into transaction ("account_id") values ($1) returning transaction_id',
      values: [ accountId ]
    };

    client.query(query, function (err, result) {
      console.log(arguments);
      callback();
    });
  });
};

datastore.getTransaction = function (token, callback) {
  connect(function (client) {
    callback();
  });
};

datastore.deleteTransaction = function (token, callback) {
  connect(function (client) {
    callback();
  });
};

datastore.updateTransaction = function (token, account, data, callback) {
  connect(function (client) {
    callback();
  });
};
