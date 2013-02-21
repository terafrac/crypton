'use strict';

var Q = require('q');
var connect = require('./').connect;


function DatabaseError(err) {
  if (err) {
    this.message = err.toString();
    this.dbError = err;
    this.code = err.code;
  } else {
    this.message = 'Database error.';
  }
}
DatabaseError.prototype = new Error();
DatabaseError.prototype.constructor = DatabaseError;

function AccountError(err, message) {
  for (var i in err) { this[i] = err[i]; }
  this.message = message;
}
AccountError.prototype = new DatabaseError();
AccountError.prototype.constructor = AccountError;


/* Run a db query and return a promise.
*
*  If the db returns an error, we reject the promise with a DatabaseError.
*/
function qQuery(client, query) {
  var d = Q.defer();
  client.query(query, function (err, result) {
    if (err) { d.reject(new DatabaseError(err)); }
    else { d.resolve(result); }
  });
  return d.promise;
}


/* Regulate database queries using promises.
*
*  If the transaction argument is true, first we issue a begin statement.
*  Next, we call doQueries, passing it a promise which will be fulfilled when
*  the begin statement is finished (or immediately if transaction is false).
*  You perform your db queries using .then on the passed promise, and return a
*  promise for your last query. When that promise is fulfilled, if transaction
*  is true, we issue a commit or rollback statement (depending on whether your
*  promise was rejected). Finally, we call the passed callback.
*
*  For success, we pass the callback null as the first argument, and the value
*  of the final promise as the second argument. For failure, we pass the
*  callback an error message as the first argument.
*/
function qQueries(client, callback, doQueries, transaction) {
  var promise = transaction ? qQuery(client, 'begin') : Q.resolve();
  promise = doQueries(promise);
  if (transaction) {
    promise = promise.then(function () { return qQuery(client, 'commit'); });
  }
  return promise.done(function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(null);
    callback.apply(undefined, args);
  }, function (err) {
    if (transaction) { client.query('rollback'); }
    if (err instanceof AccountError) {
      callback(err.message);
    } else {
      console.log('Unhandled database error: ' + err);
      callback('Database error.');
    }
  });
}


/* Save a new account
 * Add keyring info to it */
exports.saveAccount = function saveAccount(account, callback) {
  connect(function (client) {

    function insertAccount() {
      return qQuery(client, {
        text: "insert into account (username, base_keyring_id) "
            + "values ($1, nextval('version_identifier')) "
            + "returning account_id, base_keyring_id",
        values: [account.username]
      });
    }

    function insertKeyring(result) {
      var baseKeyringId = result.rows[0].base_keyring_id;
      var accountId = result.rows[0].account_id;
      return qQuery(client, {
        text: "insert into base_keyring ("
            + "  base_keyring_id, account_id,"
            + "  challenge_key, challenge_key_salt,"
            + "  keypair_salt, keypair_iv, keypair, pubkey, symkey,"
            + "  container_name_hmac_key_iv, container_name_hmac_key,"
            + "  hmac_key_iv, hmac_key"
            + ") values ("
            + "  $1, $2,"
            + "  decode($3, 'hex'), decode($4, 'hex'), decode($5, 'hex'),"
            + "  decode($6, 'hex'), decode($7, 'hex'), decode($8, 'base64'),"
            + "  decode($9, 'hex'), decode($10, 'hex'), decode($11, 'hex'),"
            + "  decode($12, 'hex'), decode($13, 'hex')"
            + ")",
        values: [
          baseKeyringId, accountId,
          account.challengeKey, account.challengeKeySalt,
          account.keypairSalt, account.keypairIv, account.keypairCiphertext,
          account.pubkey, account.symkeyCiphertext,
          account.containerNameHmacKeyIv,
          account.containerNameHmacKeyCiphertext,
          account.hmacKeyIv, account.hmacKeyCiphertext
        ]
      });
    }

    qQueries(client, callback, function (begin) {
      return begin

      .then(insertAccount).fail(function (err) {
        if (err.code === '23505') {
          throw new AccountError(err, 'Username already taken.');
        }
        throw err;
      })

      .then(insertKeyring).fail(function (err) {
        if (err.code === '23514') {
          throw new AccountError(err, 'Invalid keyring data.');
        }
        throw err;
      });
    }, true); // we want a transaction
  });
};


/* Get an account and its keyring */
exports.getAccount = function getAccount(username, callback) {
  connect(function (client) {
    qQueries(client, callback, function (begin) {
      return begin

      .then(function () {
        return qQuery(client, {
          text: "select username,"
              + "  account.account_id, base_keyring_id,"
              + "  encode(challenge_key, 'hex') as challenge_key,"
              + "  encode(challenge_key_salt, 'hex') as challenge_key_salt,"
              + "  encode(keypair_salt, 'hex') as keypair_salt,"
              + "  encode(keypair_iv, 'hex') as keypair_iv,"
              + "  encode(keypair, 'hex') as keypair,"
              + "  encode(pubkey, 'base64') as pubkey,"
              + "  encode(symkey, 'hex') as symkey,"
              + "  encode(container_name_hmac_key_iv, 'hex')"
              + "    as container_name_hmac_key_iv,"
              + "  encode(container_name_hmac_key, 'hex')"
              + "    as container_name_hmac_key,"
              + "  encode(hmac_key_iv, 'hex') as hmac_key_iv,"
              + "  encode(hmac_key, 'hex') as hmac_key "
              + "from account left join base_keyring using (base_keyring_id) "
              + "where username=$1",
          values: [username]
        });
      })

      .then(function (result) {
        if (!result.rows.length) {
          throw new AccountError(null, 'Account not found.');
        }

        var row = result.rows[0];
        return {
          username: row.username,
          accountId: row.account_id,
          keyringId: row.base_keyring_id,
          challengeKey: row.challenge_key,
          challengeKeySalt: row.challenge_key_salt,
          keypairSalt: row.keypair_salt,
          keypairIv: row.keypair_iv,
          keypairCiphertext: row.keypair,
          pubkey: row.pubkey,
          symkeyCiphertext: row.symkey,
          containerNameHmacKeyIv: row.container_name_hmac_key_iv,
          containerNameHmacKeyCiphertext: row.container_name_hmac_key,
          hmacKeyIv: row.hmac_key_iv,
          hmacKeyCiphertext: row.hmac_key
        };
      });
    });
  });
};


/* Delete an account and its keyring */
// TODO: remove rows from other tables too
exports.deleteAccount = function deleteAccount(username, callback) {
  connect(function (client) {

    function deleteKeyring() {
      return qQuery(client, {
        text: "delete from base_keyring where account_id in"
            + "  (select account_id from account where username=$1)",
        values: [username]
      });
    }

    function deleteAccount() {
      return qQuery(client, {
        text: "delete from account where username=$1",
        values: [username]
      });
    }

    qQueries(client, callback, function (begin) {
      return begin
      .then(deleteKeyring)
      .then(deleteAccount).then(function (result) {
        if (!result.rowCount) {
          throw new AccountError(null, 'Account not found.');
        }
      });
    }, true); // we want a transaction
  });
};
