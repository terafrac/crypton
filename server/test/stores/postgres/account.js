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
    challengeKey: 'deadbeef',
    challengeKeySalt: 'deadbeef',
    keypairSalt: 'deadbeef',
    keypairIv: 'deadbeef',
    keypair: 'deadbeef',
    pubkey: 'deadbeef',
    symkey: 'deadbeef',
    containerNameHmacKeyIv: 'deadbeef',
    containerNameHmacKey: 'deadbeef',
    hmacKeyIv: 'deadbeef',
    hmacKey: 'deadbeef'
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

    it("returns an error if username is taken", function (done) {
      client.callbackArgs = [
        undefined,
        [{ code: '23505' }]
      ];
      account.saveAccount(newAccount, function (err) {
        assert.equal(err, 'Username already taken.');
        var expected = [
          /^begin$/,
          { text: /^insert into account /, values: [newAccount.username] },
          /^rollback$/
        ];
        assertQueryListMatches(client.queries, expected);
        done();
      });
    });

    it("returns an error if keyring is invalid", function (done) {
      client.callbackArgs = [
        undefined,
        [null, { rows: [{
          account_id: accountId,
          base_keyring_id: baseKeyringId
        }] }],
        [{ code: '23514' }]
      ];
      account.saveAccount(newAccount, function (err) {
        assert.equal(err, 'Invalid keyring data.');
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
          /^rollback$/
        ];
        assertQueryListMatches(client.queries, expected);
        done();
      });
    });
  });

  describe("getAccount", function () {
    it("returns account info and keyring", function (done) {
      client.callbackArgs = [
        [null, { rows: [{
          username: newAccount.username,
          challenge_key: newAccount.challengeKey,
          challenge_key_salt: newAccount.challengeKeySalt,
          keypair_salt: newAccount.keypairSalt,
          keypair_iv: newAccount.keypairIv,
          keypair: newAccount.keypair,
          pubkey: newAccount.pubkey,
          symkey: newAccount.symkey,
          container_name_hmac_key_iv: newAccount.containerNameHmacKeyIv,
          container_name_hmac_key: newAccount.containerNameHmacKey,
          hmac_key_iv: newAccount.hmacKeyIv,
          hmac_key: newAccount.hmacKey
        }] }]
      ];
      account.getAccount(newAccount.username, function (err, theAccount) {
        assert.deepEqual(theAccount, newAccount);
        var expected = [
          {
            text: /^select username,.+ from account join base_keyring /,
            values: [newAccount.username]
          }
        ];
        assertQueryListMatches(client.queries, expected);
        done();
      });
    });
  });

  describe("getChallenge", function () {
    it("generates a login challenge");
  });

  describe("verifyChallenge", function () {
    it("verifies a challenge answer");
  });
});
