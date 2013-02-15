'use strict';

var connect = require('./').connect;


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

exports.getUser = function (username, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: 'select * from account, base_keyring where account.username = $1 \
        and base_keyring.account_id = account.account_id',
      /*jslint multistr: false*/
      values: [ username ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      if (!result.rows || !result.rows.length) {
        callback('User does not exist');
      } else {
        var row = result.rows[0];
        var user = {
          accountId: row.account_id,
          username: row.username,
          keyringId: row.base_keyring_id,
          saltKey: row.salt_key.toString('hex'),
          saltChallenge: row.salt_challenge.toString('hex'),
          challengeKey: row.challenge_key.toString('hex'),
          keypairIv: row.keypair_iv.toString('hex'),
          keypairSerializedCiphertext: row.keypair_serialized_ciphertext.toString('hex'),
          pubKey: row.pubkey_serialized.toString('hex'),
          symkeyCiphertext: row.symkey_ciphertext.toString('hex'),
          containerNameHmacKeyIv: row.container_name_hmac_key_iv.toString('hex'),
          containerNameHmacKeyCiphertext: row.container_name_hmac_key_ciphertext.toString('hex'),
          hmacKeyIv: row.hmac_key_iv.toString('hex'),
          hmacKeyCiphertext: row.hmac_key_ciphertext.toString('hex')
        };

        callback(null, user);
      }
    });
  });
};
