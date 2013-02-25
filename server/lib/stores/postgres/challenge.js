'use strict';

var db = require('./db');
var connect = db.connect;


/* Save a challenge answer
 * Return the challengeId */
exports.saveChallengeAnswer = function saveChallengeAnswer(
  account, answerDigest, callback
) {
  connect().then(function (client) {
    client.queries(callback, true, function (begin) {
      return begin
      .then(function () {
        return client.query({
          text: "insert into challenge ("
              + "  account_id, base_keyring_id, expected_answer_digest"
              + ") values ($1, $2, decode($3, 'hex')) returning challenge_id",
          values: [
            account.accountId,
            account.keyringId,
            answerDigest
          ]
        });
      })
      .fail(function (err) {
        if (err.code === '23514') {
          throw new db.HandledDatabaseError(err, 'Invalid challenge data.');
        }
        throw err;
      })
      .then(function (result) { return result.rows[0].challenge_id; });
    });
  });
};

exports.getChallengeAnswer = function (challengeId, callback) {
  connect().then(function (client) {
    client.queries(callback, false, function (begin) {
      return begin
      .then(function () {
        return client.query({
          text: "select * "
              + "from challenge where challenge_id=$1",
          values: [ challengeId ]
        });
      })
      .then(function (result) {
        if (!result.rows.length) {
          throw new db.HandledDatabaseError(null, 'Challenge not found.');
        }
        var row = result.rows[0];
        return {
          challengeId: row.challenge_id,
          accountId: row.account_id,
          baseKeyringId: row.base_keyring_id,
          creationTime: row.creation_time,
          expectedAnswerDigest: row.expected_answer_digest.toString('hex')
        };
      });
    });
  });
};
