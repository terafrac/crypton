'use strict';

var connect = require('./').connect;


/* Save a challenge answer
 * Return the challengeId */
exports.saveChallengeAnswer = function saveChallengeAnswer(
  account, answerDigest, callback
) {
  connect(function (client) {
    client.query({
      text: "insert into challenge ("
          + "  account_id, base_keyring_id, expected_answer_digest"
          + ") values ($1, $2, decode($3, 'hex')) returning challenge_id",
      values: [
        account.accountId,
        account.keyringId,
        answerDigest
      ]
    }, function (err, result) {
      if (err) {
        console.log('Unhandled database error: ' + err);
        callback('Database error.');
        return;
      }
      callback(null, result.rows[0].challenge_id);
    });
  });
};

exports.getChallengeAnswer = function (challengeId, callback) {
  connect(function (client) {
    client.query({
      text: "select encode(expected_answer_digest, 'hex') "
          + "from challenge where challenge_id=$1",
      values: [ challengeId ]
    }, function (err, result) {
      if (err) {
        console.log('Unhandled database error: ' + err);
        callback('Database error.');
        return;
      }
      if (!result.rows.length) {
        callback('Challenge not found.');
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
