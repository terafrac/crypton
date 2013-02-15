var datastore = require('./');
var connect = datastore.connect;

datastore.createTransaction = function (accountId, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: 'insert into transaction ("account_id") \
        values ($1) returning transaction_id',
      /*jslint multistr: false*/
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

      var row = datastore.util.camelizeObject(result.rows[0]);
      callback(null, row);
    });
  });
};

datastore.deleteTransaction = function (token, callback) {
  connect(function (client) {
    callback();
  });
};

datastore.updateTransaction = function (token, account, data, callback) {
  var types = Object.keys(datastore.transaction);
  var type = data.type;
  var valid = ~types.indexOf(type);

  if (!valid) {
    callback('Invalid transactiont type');
    return;
  }

  connect(function (client) {
    datastore.getTransaction(token, function (err, transaction) {
      if (account != transaction.accountId) {
        res.send({
          success: false,
          error: 'Transaction does not belong to account'
        });
      }

      datastore.transaction[type](data, transaction, function (err) {
        console.log(arguments);
        callback();
      });
    });
  });
};

datastore.transaction = {};

datastore.transaction.addContainer = function (data, transaction, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: 'insert into transaction_add_container \
        (transaction_id, name_hmac) values ($1, $2)',
      /*jslint multistr: false*/
      values: [
        transaction.transactionId,
        data.containerNameHmac
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      callback();
    });
  });
};

datastore.transaction.addContainerSessionKey = function (data, transaction, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: 'insert into transaction_add_container_session_key \
        (transaction_id, name_hmac, signature) values ($1, $2, $3)',
      /*jslint multistr: false*/
      values: [
        transaction.transactionId,
        data.containerNameHmac,
        data.signature
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      callback();
    });
  });
};

datastore.transaction.addContainerSessionKeyShare = function (data, transaction, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: 'insert into transaction_add_container_session_key_share \
        (transaction_id, name_hmac, to_account_id, session_key_ciphertext, hmac_key_ciphertext) \
        values ($1, $2, $3, $4, $5)',
      /*jslint multistr: false*/
      values: [
        transaction.transactionId,
        data.containerNameHmac,
        transaction.accountId,
        data.sessionKeyCiphertext,
        data.hmacKeyCiphertext
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      callback();
    });
  });
};

