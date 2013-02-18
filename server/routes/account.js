'use strict';

var app = process.app;
var db = app.datastore;
var middleware = require('../lib/middleware');
var challenge = require('../lib/challenge');
var crypto = require('crypto');

/*
 * Save account to server
 * Create session cookie
 */
app.post('/account', function (req, res) {
  // TODO sanitize
  var account = req.body;
  db.saveAccount(account, function (err) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }
    // TODO set session cookie here
    res.send({
      success: true
    });
  });
});

/*
* Authorize with server
*/
app.post('/account/:username', function (req, res) {
  db.getAccount(req.params.username, function (err, account) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    var newChallenge = challenge.makeChallenge(account);
    db.saveChallengeAnswer(
      account, newChallenge.answerDigest,
      function (err, challengeId) {
        if (err) {
          res.send({
            success: false,
            error: err
          });
          return;
        }

        var response = {
          success: true,
          challengeId: challengeId // TODO public_id(challengeId)
        };

        for (var i in newChallenge.challenge) {
          response[i] = newChallenge.challenge[i];
        }

        res.send(response);
      }
    );
  });
});

/*
* Authorize with server
*/
app.post('/account/:username/answer', function (req, res) {
  var challengeId = req.body.challengeId;
  var answer = req.body.answer;

  if (!challengeId || !answer) {
    res.send({
      success: false,
      error: 'Missing required fields'
    });
    return;  
  }

  var answerDigest = crypto.createHash('sha256').update(answer).digest('hex');

  db.getChallengeAnswer(challengeId, function (err, challenge) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;  
    }

    db.getAccount(req.params.username, function (err, user) {
      if (err) {
        res.send({
          success: false,
          error: err
        });
        return;
      }

      if (challenge.accountId != user.accountId) {
        res.send({
          success: false,
          error: 'Incorrect username'
        });
        return;
      }

      // TODO: use constant time compare here to avoid timing attack
      if (challenge.expectedAnswerDigest != answerDigest) {
        res.send({
          success: false,
          error: 'Incorrect password'
        });
        return;
      }

      req.session.accountId = user.accountId;

      res.send({
        success: true,
        account: user,
        sessionIdentifier: req.sessionID
      });
    });
  });
});

/*
* Change the password for account
*/
app.post('/account/:username/keyring',
  middleware.verifySession,
  function (req, res) {
    res.send({
      success: true
    });
  }
);
