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

var sinon = require('sinon');
var assert = require('assert');


describe("challenge", function () {
  var challenge;
  var account = {
    challengeKey: 'deadbeefdeadbeefdeadbeefdeadbeef'
                + 'deadbeefdeadbeefdeadbeefdeadbeef',
    challengeKeySalt: 'fadedeedfadedeedfadedeedfadedeed'
                    + 'fadedeedfadedeedfadedeedfadedeed'
  };

  before(function () {
    challenge = require('../lib/challenge');
    this.clock = sinon.useFakeTimers();
  });

  after(function () {
    this.clock.restore();
  });

  describe("makeChallenge", function () {
    it("generates a login challenge", sinon.test(function () {
      var randomIdx = 0, randomVals = [
        'cafefacecafefacecafefacecafefacecafefacecafefacecafefacecafeface',
        'feedbeadfeedbeadfeedbeadfeedbead'
      ];
      function fakeRandom(len) {
        var val = new Buffer(randomVals[randomIdx++], 'hex');
        assert.strictEqual(
          len, val.length,
          'requested ' + len + ' bytes, but randomVals had ' + val.length
        );
        return val;
      }
      this.stub(challenge.__crypto, 'randomBytes', fakeRandom);
      assert.deepEqual(challenge.makeChallenge(account), {
        challenge: {
          challengeKeySalt: account.challengeKeySalt,
          iv: randomVals[1],
          time: '0',
          challenge: '576ad1186f9edc1f54b9eb5db5a4dc98'
                   + '4bfaf2aa9b3cedbacb6c5752d3b8de9b'
        },
        answerDigest: '34fa6bec8b904d020c819ed0bfda3db7'
                    + 'aa42947e13ae070c6b81503ca4036637'
      });
    }));
  });
});
