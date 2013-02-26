/* Crypton Server, Copyright 2013 SpiderOak, Inc.
 *
 * This file is part of Crypton Server.
 *
 * Crypton Server is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton Server is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton Server.  If not, see <http://www.gnu.org/licenses/>.
*/

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
  var timeDigest = crypto.createHash('sha256').update(time).digest();
  var answerDigest = crypto.createHash('sha256').update(
    cipher.update(timeDigest)).digest('hex');

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
