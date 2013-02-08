(function() {
  var Account = crypton.Account = function Account () {
    
  }

  Account.prototype.save = function (callback) {
    superagent.post(crypton.url() + '/account')
      .send(this.serialize())
      .end(function (res) {
        if (res.body.success !== true) {
          callback(res.body);
        } else {
          callback();
        }
      }
    );
  }

  Account.prototype.refresh = function () {
  }

  Account.prototype.serialize = function () {
    return {
      challengeKey: this.challengeKey,
      containerNameHmacKeyCiphertext: this.containerNameHmacKeyCiphertext,
      containerNameHmacKeyIv: this.containerNameHmacKeyIv,
      hmacKey: this.hmacKey,
      hmacKeyCiphertext: this.hmacKeyCiphertext,
      hmacKeyIv: this.hmacKeyIv,
      keypairIv: this.keypairIv,
      keypairSerializedCiphertext: this.keypairSerializedCiphertext,
      pubKey: this.pubKey,
      saltChallenge: this.saltChallenge,
      saltKey: this.saltKey,
      symkeyCiphertext: this.symkeyCiphertext,
      username: this.username
    };
  }
})();

