'use strict';

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


describe("postgres/account", function () {
  var account;
  var client = {
    query: function (query, callback) {
      client.queries.push(query);
      if (!callback) { return; }
      callback.apply(
        undefined,
        client.callbackArgs[client.queries.length - 1]
      );
    }
  };

  var accountId = 100001;
  var baseKeyringId = 2002;
  var newAccount = {
    username: 'testuser',
    challengeKey: 'challengeKey',
    challengeKeySalt: 'challengeKeySalt',
    keypairSalt: 'keypairSalt',
    keypairIv: 'keypairIv',
    keypair: 'keypair',
    pubkey: 'pubkey',
    symkey: 'symkey',
    containerNameHmacKeyIv: 'containerNameHmacKeyIv',
    containerNameHmacKey: 'containerNameHmacKey',
    hmacKeyIv: 'hmacKeyIv',
    hmacKey: 'hmacKey'
  };

  before(function () {
    mockery.enable({ useCleanCache: true });
    mockery.registerMock('./', { connect: function (cb) { cb(client); } });
    mockery.registerAllowable('../../../lib/stores/postgres/account');
    account = require('../../../lib/stores/postgres/account');
  });

  beforeEach(function () {
    client.queries = [];
    client.callbackArgs = [];
  });

  after(function () { mockery.disable(); });

  describe("saveAccount", function () {
    it("inserts rows for account and keyring", function (done) {
      client.callbackArgs = [
        undefined,
        [null, { rows: [{
          account_id: accountId,
          base_keyring_id: baseKeyringId
        }] }]
      ];
      var expected = [
        /^begin$/,
        { text: /^insert into account /, values: [newAccount.username] },
        { text: /^insert into base_keyring /, values: [
          baseKeyringId, accountId,
          newAccount.challengeKey, newAccount.challengeKeySalt,
          newAccount.keypairSalt, newAccount.keypairIv, newAccount.keypair,
          newAccount.pubkey, newAccount.symkey,
          newAccount.containerNameHmacKeyIv, newAccount.containerNameHmacKey,
          newAccount.hmacKeyIv, newAccount.hmacKey
        ] },
        /^commit$/
      ];
      account.saveAccount(newAccount, function (err) {
        if (err) {
          done(err);
          return;
        }
        assertQueryListMatches(client.queries, expected);
        done();
      });
    });

    it("raises an error if username is taken");

    it("raises an error if keyring is invalid");
  });

  describe("getAccount", function () {
    it("returns account info and keyring");
  });

  describe("getChallenge", function () {
    it("generates a login challenge");
  });

  describe("verifyChallenge", function () {
    it("verifies a challenge answer");
  });
});
