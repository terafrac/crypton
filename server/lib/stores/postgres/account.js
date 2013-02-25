'use strict';

var db = require('./db');
var connect = db.connect;


function AccountError() {
  db.HandledDatabaseError.apply(this, arguments);
}
AccountError.prototype = new db.HandledDatabaseError();
AccountError.prototype.constructor = AccountError;
exports.AccountError = AccountError;


/* Save a new account
 * Add keyring info to it */
exports.saveAccount = function saveAccount(account, callback) {
  connect().then(function (client) {

    function insertAccount() {
      return client.query({
        text: "insert into account (username, base_keyring_id) "
            + "values ($1, nextval('version_identifier')) "
            + "returning account_id, base_keyring_id",
        values: [account.username]
      });
    }

    function insertKeyring(result) {
      var baseKeyringId = result.rows[0].base_keyring_id;
      var accountId = result.rows[0].account_id;
      return client.query({
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

    client.queries(callback, true, function (begin) {
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
    });
  });
};


/* Get an account and its keyring */
exports.getAccount = function getAccount(username, callback) {
  connect().then(function (client) {

    client.queries(callback, false, function (begin) {
      return begin

      .then(function () {
        return client.query({
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
  connect().then(function (client) {

    function deleteKeyring() {
      return client.query({
        text: "delete from base_keyring where account_id in"
            + "  (select account_id from account where username=$1)",
        values: [username]
      });
    }

    function deleteAccount() {
      return client.query({
        text: "delete from account where username=$1",
        values: [username]
      });
    }

    client.queries(callback, true, function (begin) {
      return begin
      .then(deleteKeyring)
      .then(deleteAccount).then(function (result) {
        if (!result.rowCount) {
          throw new AccountError(null, 'Account not found.');
        }
      });
    });
  });
};
