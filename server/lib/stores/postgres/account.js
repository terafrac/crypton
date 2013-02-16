'use strict';

var connect = require('./').connect;


/* Save a new account
 * Add keyring info to it */
exports.saveAccount = function saveAccount(account, callback) {
  connect(function (client) {
    client.query('begin');
    client.query({
      text: "insert into account (username, base_keyring_id) "
          + "values ($1, nextval('version_identifier')) "
          + "returning account_id, base_keyring_id",
      values: [account.username]
    }, function (err, result) {

      if (err) {
        client.query('rollback');
        if (err.code === '23505') {
          callback('Username already taken.');
        } else {
          console.log('Unhandled database error: ' + err);
          callback('Database error.');
        }
        return;
      }
      client.query({
        text: "insert into base_keyring ("
            + "  base_keyring_id, account_id,"
            + "  challenge_key, challenge_key_salt,"
            + "  keypair_salt, keypair_iv, keypair, pubkey, symkey,"
            + "  container_name_hmac_key_iv, container_name_hmac_key,"
            + "  hmac_key_iv, hmac_key"
            + ") values ("
            + "  $1, $2,"
            + "  decode($3, 'hex'), decode($4, 'hex'), decode($5, 'hex'),"
            + "  decode($6, 'hex'), decode($7, 'hex'), decode($8, 'hex'),"
            + "  decode($9, 'hex'), decode($10, 'hex'), decode($11, 'hex'),"
            + "  decode($12, 'hex'), decode($13, 'hex')"
            + ")",
        values: [
          result.rows[0].base_keyring_id,
          result.rows[0].account_id,
          account.challengeKey, account.challengeKeySalt,
          account.keypairSalt, account.keypairIv, account.keypair,
          account.pubkey, account.symkey,
          account.containerNameHmacKeyIv, account.containerNameHmacKey,
          account.hmacKeyIv, account.hmacKey
        ]
      }, function (err) {

        if (err) {
          client.query('rollback');
          if (err.code === '23514') {
            callback('Invalid keyring data.');
          } else {
            console.log('Unhandled database error: ' + err);
            callback('Database error.');
          }
          return;
        }
        client.query('commit', function () { callback(); });
      });
    });
  });
};


/* Get an account and its keyring */
exports.getAccount = function getAccount(username, callback) {
  connect(function (client) {
    client.query({
      text: "select username,"
          + "  account.account_id, base_keyring_id,"
          + "  encode(challenge_key, 'hex') as challenge_key,"
          + "  encode(challenge_key_salt, 'hex') as challenge_key_salt,"
          + "  encode(keypair_salt, 'hex') as keypair_salt,"
          + "  encode(keypair_iv, 'hex') as keypair_iv,"
          + "  encode(keypair, 'hex') as keypair,"
          + "  encode(pubkey, 'hex') as pubkey,"
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
    }, function (err, result) {
      if (err) {
        console.log('Unhandled database error: ' + err);
        callback('Database error.');
        return;
      }
      if (!result.rows.length) {
        callback('Account not found.');
        return;
      }

      callback(null, {
        username: result.rows[0].username,
        accountId: result.rows[0].account_id,
        keyringId: result.rows[0].base_keyring_id,
        challengeKey: result.rows[0].challenge_key,
        challengeKeySalt: result.rows[0].challenge_key_salt,
        keypairSalt: result.rows[0].keypair_salt,
        keypairIv: result.rows[0].keypair_iv,
        keypair: result.rows[0].keypair,
        pubkey: result.rows[0].pubkey,
        symkey: result.rows[0].symkey,
        containerNameHmacKeyIv: result.rows[0].container_name_hmac_key_iv,
        containerNameHmacKey: result.rows[0].container_name_hmac_key,
        hmacKeyIv: result.rows[0].hmac_key_iv,
        hmacKey: result.rows[0].hmac_key
      });
    });
  });
};
