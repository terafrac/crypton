var datastore = require('./');
var connect = datastore.connect;

datastore.saveChallenge = function (user, expectedAnswerDigestHex, callback) {
  connect(function (client) {
    var query = {
      /*jslint multistr: true*/
      text: "insert into challenge (account_id, base_keyring_id, expected_answer_digest) \
        values ($1, $2, decode($3, 'hex')) returning challenge_id",
      /*jslint multistr: false*/
      values: [
        user.accountId,
        user.keyringId,
        expectedAnswerDigestHex
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      callback(null, result.rows[0].challenge_id);
    });
  });
};

datastore.getChallenge = function (challengeId, callback) {
  connect(function (client) {
    var query = {
      text: 'select * from challenge where challenge_id = $1',
      values: [
        challengeId
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        console.log(err);
        callback('Database error');
        return;
      }

      if (!result.rows || !result.rows[0]) {
        console.log(err);
        callback('Unknown challenge id');
        return;
      }

      callback(null, {
        challengeId: result.rows[0].challenge_id,
        accountId: result.rows[0].account_id,
        baseKeyringId: result.rows[0].base_keyring_id,
        creationTime: result.rows[0].creation_time,
        expectedAnswerDigest: result.rows[0].expected_answer_digest.toString('hex')
      });
    });
  });
};
