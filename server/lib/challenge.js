'use strict';

var crypto = require('crypto');

// export this so tests can mock out randomBytes
if (process.env.NODE_ENV === 'test') { exports.__crypto = crypto; }


exports.makeChallenge = function makeChallenge(account) {
  var randomString = crypto.randomBytes(32);
  var iv = crypto.randomBytes(16);
  var key = new Buffer(account.challengeKey, 'hex');
  var cipher = crypto.createCipheriv('aes-256-cfb', key, iv);
  cipher.setAutoPadding(false);
  var challenge = cipher.update(randomString, 'binary', 'hex');

  var time = +new Date() + ''; // must be cast to string for cipher
  cipher = crypto.createCipheriv('aes-256-cfb', randomString, iv);
  cipher.setAutoPadding(false);
  var timeCiphertext = cipher.update(time, 'binary', 'hex');
  var answerDigest = crypto.createHash('sha256').update(timeCiphertext).digest('hex');

  return {
    challenge: {
      challengeKeySalt: account.challengeKeySalt,
      iv: iv.toString('hex'),
      time: time,
      challenge: challenge
    },
    answerDigest: answerDigest
  };
};
