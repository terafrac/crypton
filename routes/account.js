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
    var randomString = crypto.randomBytes(32).toString('hex');
    var time = +new Date();
    var aesIv = crypto.createHash('sha256').update(uuid.v1()).digest().substr(0, 16);
    var cipher = crypto.createCipheriv('aes-256-cfb', user.challengeKey, aesIv);
    var challenge = cipher.update(randomString);
    console.log(randomString, time, aesIv, challenge);

    // compute the expected answer to the challenge
    var answerCipher = crypto.createCipheriv('aes-256-cfb8', challenge, aesIv);
    var timeValueCiphertext = answerCipher.update(time);
    var expectedAnswerDigest = crypto.createHash('sha256').update(timeValueCiphertext).digest();
    console.log(answerCipher, timeValueCiphertext, expectedAnswerDigest);

    // store it
  });
});

/*
 * Change the password for account
 */
app.post('/account/:username/password', function (req, res) {
});

