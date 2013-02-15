var datastore = require('./');
var connect = datastore.connect;

datastore.createTransaction = function (accountId, callback) {
  connect(function (client) {
    var query = {
      text: 'insert into transaction ("account_id") values ($1) returning transaction_id',
      values: [ accountId ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      callback(null, result.rows[0].transaction_id);
    });
  });
};

datastore.getTransaction = function (token, callback) {
  connect(function (client) {
    var query = {
      text: 'select * from transaction where transaction_id = $1',
      values: [ token ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      // massage
      callback(null, result.rows[0]);
    });
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
