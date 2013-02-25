'use strict';

var Q = require('q');
var mockery = require('mockery');
var assert = require('assert');


function assertQueryMatches(query, expected) {
  if (expected.hasOwnProperty('text')) {
    assert(
      expected.text.test(query.text),
      "got unexpected query: " + query.text
    );
    assert.deepEqual(query.values, expected.values);
  } else {
    assert(expected.test(query), "got unexpected query: " + query);
  }
}

function assertQueryListMatches(queries, expected) {
  assert.equal(queries.length, expected.length);
  for (var i=0; i < expected.length; i++) {
    assertQueryMatches(queries[i], expected[i]);
  }
}


describe("postgres/challenge", function () {
  var challenge;
  var client = {
    query: function (query, callback) {
      client.testQueries.push(query);
      if (!callback) { return; }
      callback.apply(
        undefined,
        client.callbackArgs[client.testQueries.length - 1]
      );
    }
  };

  var account = {
    username: 'testuser',
    accountId: 100001,
    keyringId: 2002,
    challengeKey: 'challenge key',
    challengeKeySalt: 'challenge key salt',
    keypairSalt: 'keypair salt',
    keypairIv: 'keypair iv',
    keypairCiphertext: 'keypair ciphertext',
    pubkey: 'pubkey',
    symkeyCiphertext: 'symkey ciphertext',
    containerNameHmacKeyIv: 'container name hmac key iv',
    containerNameHmacKeyCiphertext: 'container name hmac key ciphertext',
    hmacKeyIv: 'hmac key iv',
    hmacKeyCiphertext: 'hmack key ciphertext'
  };
  var answerDigest = 'deadbeef';
  var challengeId = 30000003;

  before(function () {
    var db = require('../../../lib/stores/postgres/db');
    var mockDb = {};
    for (var i in db) { mockDb[i] = db[i]; }
    mockDb.connect = function () {
      return Q.resolve(db.makePromising(client));
    };

    mockery.enable({ useCleanCache: true });
    mockery.registerMock('./db', mockDb);
    mockery.registerAllowable('../../../lib/stores/postgres/challenge');
    challenge = require('../../../lib/stores/postgres/challenge');
  });

  beforeEach(function () {
    client.testQueries = [];
    client.callbackArgs = [];
  });

  after(function () {
    mockery.disable();
    mockery.deregisterAll();
  });

  describe("saveChallengeAnswer", function () {
    it("inserts row for challenge", function (done) {
      client.callbackArgs = [
        undefined,
        [null, { rows: [{
          challenge_id: challengeId
        }] }]
      ];
      var expected = [
        /^begin$/,
        {
          text: /^insert into challenge /,
          values: [account.accountId, account.keyringId, answerDigest]
        },
        /^commit$/
      ];
      challenge.saveChallengeAnswer(account, answerDigest, function (err) {
        if (err) {
          done(err);
          return;
        }
        assertQueryListMatches(client.testQueries, expected);
        done();
      });
    });

    it("returns an error if challenge is invalid", function (done) {
      client.callbackArgs = [
        undefined,
        [{ code: '23514' }]
      ];
      challenge.saveChallengeAnswer(account, answerDigest, function (err) {
        assert.equal(err, 'Invalid challenge data.');
        var expected = [
          /^begin$/,
          {
            text: /^insert into challenge /,
            values: [account.accountId, account.keyringId, answerDigest]
          },
          /^rollback/
        ];
        assertQueryListMatches(client.testQueries, expected);
        done();
      });
    });
  });

  describe("getChallengeAnswer", function () {
    it("returns challenge answer", function (done) {
      client.callbackArgs = [
        [null, { rows: [{
          challenge_id: challengeId,
          account_id: account.accountId,
          base_keyring_id: account.keyringId,
          creation_time: account.creationTime,
          expected_answer_digest: new Buffer(answerDigest, 'hex')
        }] }]
      ];
      challenge.getChallengeAnswer(challengeId, function (err, theChallenge) {
        var expectedChallenge = {
          challengeId: challengeId,
          accountId: account.accountId,
          baseKeyringId: account.keyringId,
          creationTime: account.creationTime,
          expectedAnswerDigest: answerDigest
        };
        assert.deepEqual(theChallenge, expectedChallenge);
        var expected = [
          {
            text: /^select \* from challenge /,
            values: [challengeId]
          }
        ];
        assertQueryListMatches(client.testQueries, expected);
        done();
      });
    });

    it("returns an error if challenge not found", function (done) {
      client.callbackArgs = [
        [null, { rows: [] }]
      ];
      challenge.getChallengeAnswer(challengeId, function (err) {
        assert.equal(err, 'Challenge not found.');
        done();
      });
    });
  });
});
