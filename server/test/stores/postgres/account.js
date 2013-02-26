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
          newAccount.keypairSalt, newAccount.keypairIv,
          newAccount.keypairCiphertext,
          newAccount.pubkey, newAccount.symkeyCiphertext,
          newAccount.containerNameHmacKeyIv,
          newAccount.containerNameHmacKeyCiphertext,
          newAccount.hmacKeyIv, newAccount.hmacKeyCiphertext
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
            newAccount.keypairSalt, newAccount.keypairIv,
            newAccount.keypairCiphertext,
            newAccount.pubkey, newAccount.symkeyCiphertext,
            newAccount.containerNameHmacKeyIv,
            newAccount.containerNameHmacKeyCiphertext,
            newAccount.hmacKeyIv, newAccount.hmacKeyCiphertext
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
          account_id: accountId,
          base_keyring_id: baseKeyringId,
          challenge_key: newAccount.challengeKey,
          challenge_key_salt: newAccount.challengeKeySalt,
          keypair_salt: newAccount.keypairSalt,
          keypair_iv: newAccount.keypairIv,
          keypair: newAccount.keypairCiphertext,
          pubkey: newAccount.pubkey,
          symkey: newAccount.symkeyCiphertext,
          container_name_hmac_key_iv: newAccount.containerNameHmacKeyIv,
          container_name_hmac_key: newAccount.containerNameHmacKeyCiphertext,
          hmac_key_iv: newAccount.hmacKeyIv,
          hmac_key: newAccount.hmacKeyCiphertext
        }] }]
      ];
      account.getAccount(newAccount.username, function (err, theAccount) {
        var expectedAccount = {
          accountId: accountId,
          keyringId: baseKeyringId
        };
        for (var i in newAccount) {
          expectedAccount[i] = newAccount[i];
        }
        assert.deepEqual(theAccount, expectedAccount);
        var expected = [
          {
            text: /^select username,.+ from account left join base_keyring /,
            values: [newAccount.username]
          }
        ];
        assertQueryListMatches(client.queries, expected);
        done();
      });
    });

    it("returns an error if account not found", function (done) {
      client.callbackArgs = [
        [null, { rows: [] }]
      ];
      account.getAccount(newAccount.username, function (err) {
        assert.equal(err, 'Account not found.');
        done();
      });
    });
  });
});
