var datastore = require('./');
var connect = datastore.connect;

/*
* Saves a generated user object
* Creates an "account" row
* Creates a "base_keyring" row
* Associates them
*/
datastore.saveUser = function (user, callback) {
  connect(function (client) {
    client.query('begin');

    var accountQuery = {
      text: 'insert into account ("username") values ($1) returning account_id',
      values: [ user.username ]
    };

    client.query(accountQuery, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        client.query('rollback');
        return;
      }

      var accountId = result.rows[0].account_id;

      var columns = [
        'account_id',
        'pubkey_serialized',
        'salt_key',
        'salt_challenge',
        'challenge_key',
        'keypair_iv',
        'keypair_serialized_ciphertext',
        'symkey_ciphertext',
        'container_name_hmac_key_iv',
        'container_name_hmac_key_ciphertext',
        'hmac_key_iv',
        'hmac_key_ciphertext'
      ];

      var keyringQuery = {
        /*jslint multistr: true*/
        text: "insert into base_keyring (\"" + columns.join('", "') + "\") \
          values ($1, $2, \
          decode($3, 'hex'), decode($4, 'hex'), decode($5, 'hex'), \
          decode($6, 'hex'), decode($7, 'hex'), decode($8, 'hex'), \
          decode($9, 'hex'), decode($10, 'hex'), decode($11, 'hex'), decode($12, 'hex')) \
          returning base_keyring_id",
        /*jslint multistr: false*/
        values: [
          accountId,
          user.pubKey,
          user.saltKey,
          user.saltChallenge,
          user.challengeKey,
          user.keypairIv,
          user.keypairSerializedCiphertext,
          user.symkeyCiphertext,
          user.containerNameHmacKeyIv,
          user.containerNameHmacKeyCiphertext,
          user.hmacKeyIv,
          user.hmacKeyCiphertext
        ]
      };

      client.query(keyringQuery, function (err, result) {
        if (err) {
          console.log(err);
          callback('Database error');
          client.query('rollback');
          return;
        }

        var associationQuery = {
          text: 'update account set base_keyring_id = $1 where account_id = $2',
          values: [
            result.rows[0].base_keyring_id,
            accountId
          ]
        };

        client.query(associationQuery, function (err, result) {
          if (err) {
            console.log(err);
            client.query('rollback');
            callback('Database error');
            return;
          }

          client.query('commit', function (err, result) {
            if (err) {
              console.log(err);
              callback('Database error');
              client.query('rollback');
              return;
            }

            callback();
          });
        });
      });
    });
  });
};

datastore.getUser = function (username, callback) {
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
