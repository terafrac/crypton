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

var datastore = require('./');
var connect = datastore.connect;
var fs = require('fs');
var transactionQuery = fs.readFileSync(__dirname + '/sql/transaction.sql').toString();

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
    callback('Invalid transaction type');
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
        callback(err);
      });
    });
  });
};

datastore.requestTransactionCommit = function (token, account, callback) {
  connect(function (client) {
    datastore.getTransaction(token, function (err, transaction) {
      if (account != transaction.accountId) {
        res.send({
          success: false,
          error: 'Transaction does not belong to account'
        });
      }

      commit.request(transaction.transactionId, function (err) {
        // TODO handle err
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

datastore.transaction.addContainerRecord = function (data, transaction, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: "\
        insert into transaction_add_container_record \
        (transaction_id, name_hmac, latest_record_id, \
        hmac, payload_iv, payload_ciphertext) \
        values ($1, $2, $3, decode($4, 'hex'), \
        decode($5, 'hex'), decode($6, 'hex'))",
      /*jslint multistr: false*/
      values: [
        transaction.transactionId,
        data.containerNameHmac,
        data.latestRecordId,
        data.hmac,
        data.payloadIv,
        data.payloadCiphertext
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

var commit = {};

commit.request = function (transactionId, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: '\
        update transaction \
          set commit_request_time = current_timestamp \
          where transaction_id=$1;',
      /*jslint multistr: false*/
      values: [
        transactionId
      ]
    };

    client.query(query, callback);
  });
};

commit.troll = function () {
  connect(function (client) {
    /*jslint multistr: true*/
    var query = '\
      select * from transaction \
      where commit_request_time is not null \
      and commit_start_time is null \
      order by commit_start_time asc';
      /*jslint multistr: false*/

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        process.exit(1);
        return;
      }

      if (result.rows.length) {
        console.log(result.rows.length + ' transactions to commit');
        // TODO queue
        for (var i in result.rows) {
          commit.finish(result.rows[i].transaction_id);
        }
      }
    });
  });
};
setInterval(commit.troll, 100);

commit.finish = function (transactionId) {
  connect(function (client) {
    var tq = transactionQuery
      .replace(/\{\{hostname\}\}/gi, 'hostname')
      .replace(/\{\{transactionId\}\}/gi, transactionId);

    client.query(tq, function (err, result) {
      if (err) {
        client.query('rollback');
        console.log(err);
      }
    });
  });
};
