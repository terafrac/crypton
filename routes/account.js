var app = process.app;
var db = app.datastore;
var crypto = require('crypto');
var uuid = require('node-uuid');

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
    var time = +new Date() + ''; // must be cast to string for cipher
    var aesIv = new Buffer(crypto.createHash('sha256').update(uuid.v1()).digest().substr(0, 16), 'ascii');
    var cipher = crypto.createCipheriv('aes-256-cfb', new Buffer(user.challengeKey, 'hex'), aesIv);
    var challenge = cipher.update(randomString);

    // compute the expected answer to the challenge
    var answerCipher = crypto.createCipheriv('aes-256-cfb8', challenge, aesIv);
    var timeValueCiphertext = answerCipher.update(time);
    var expectedAnswerDigest = crypto.createHash('sha256').update(timeValueCiphertext).digest();
    var expectedAnswer = new Buffer(expectedAnswerDigest, 'binary').toString('hex');
console.log(expectedAnswer, expectedAnswer);
    // store it
    db.saveChallenge(user, expectedAnswer, function (err, challengeId) {
      if (err) {
        res.send({
          success: false,
          error: err
        });
        return;
      }

      res.send({
        success: true,
        challengeId: challengeId,
        challenge: new Buffer(challenge, 'binary').toString('hex'),
        saltChallenge: user.saltChallenge,
        iv: aesIv.toString('hex'),
        time: time
      });
    });
  });
});

/*
 * Change the password for account
 */
app.post('/account/:username/password', function (req, res) {
});

