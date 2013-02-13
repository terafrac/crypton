(function() {
  var Account = crypton.Account = function Account () {};

  Account.prototype.save = function (callback) {
    superagent.post(crypton.url() + '/account')
      .send(this.serialize())
      .end(function (res) {
        if (res.body.success !== true) {
          callback(res.body.error);
        } else {
          callback();
        }
      }
    );
  };

  Account.prototype.refresh = function () {
  };

  // decrypts:
  //  containerNameHmacKey
  //  hmacKey
  //  keypair
  //  smykey
  Account.prototype.unravel = function (callback) {
    var keypairKey = CryptoJS.PBKDF2(this.passphrase, this.saltKey, {
      keySize: 256 / 32,
      // iterations: 1000
    });

    var hp = CryptoJS.enc.Hex.parse;
    var keypairIv = hp(this.keypairIv);
    var keypairSerializedCiphertext = hp(this.keypairSerializedCiphertext);
    var encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: keypairSerializedCiphertext,
      iv: keypairIv
    });
console.log(encrypted);
console.log(keypairKey);
    window.keypairSerialized = CryptoJS.AES.decrypt(
      encrypted, keypairKey, {
        iv: keypairIv,
        mode: CryptoJS.mode.CFB,
        //padding: CryptoJS.pad.NoPadding
      }
    );

    console.log('keypairSerialized:');
    console.log(keypairSerialized);
    callback();
  };

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
  };
})();

