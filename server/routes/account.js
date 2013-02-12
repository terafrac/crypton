'use strict';

var app = process.app;
var db = app.datastore;
var crypto = require('crypto');
var uuid = require('node-uuid');
var middleware = require('../lib/middleware');

/*
 * Save account to server
 * Check if username is taken
 * Create session cookie
 */
app.post('/account', function (req, res) {
  // TODO sanitize
  var body = req.body;

  db.isUsernameTaken(req.body.username, function (taken) {
    if (taken) {
      console.log('dupe username: ' + req.body.username);
      res.send({
        success: false,
        error: 'Username taken'
      });
      return;
    }

    db.saveUser(body, function (err) {
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
});

/*
* Authorize with server
*/
app.post('/account/:username', function (req, res) {
  db.getUser(req.params.username, function (err, user) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    // create a challenge
    var randomString = crypto.randomBytes(32);
    var ivRaw = crypto.createHash('sha256').update(uuid.v1()).digest().substr(0, 16);
    var iv = new Buffer(ivRaw, 'binary');
    var key = new Buffer(user.challengeKey, 'hex');
    var challengeCipher = crypto.createCipheriv('aes-256-cfb', key, iv);
    var challenge = challengeCipher.update(randomString, 'binary', 'hex');

    // compute the expected answer to the challenge
    var time = +new Date() + ''; // must be cast to string for cipher
    var answerCipher = crypto.createCipheriv('aes-256-cfb', randomString, iv);
    var expectedAnswer = answerCipher.update(time, 'binary', 'hex');
    var expectedAnswerDigest = crypto.createHash('sha256').update(expectedAnswer).digest('hex');

    // store it
    db.saveChallenge(user, expectedAnswerDigest, function (err, challengeId) {
      if (err) {
        res.send({
          success: false,
          error: err
        });
        return;
      }

      res.send({
        success: true,
        challengeId: challengeId, // TODO public_id(challengeId)
        challenge: challenge,
        saltChallenge: user.saltChallenge,
        iv: iv.toString('hex'),
        time: time
      });
    });
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

  db.getChallenge(challengeId, function (err, challenge) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;  
    }

    db.getUser(req.params.username, function (err, user) {
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

      if (challenge.expectedAnswerDigest != answer) {
        res.send({
          success: false,
          error: 'Incorrect password'
        });
        return;
      }

      req.session.account = user;

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
app.post('/account/:username/password',
  middleware.verifySession,
  function (req, res) {
    res.send({
      success: true
    });
  }
);
