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
    // reconstruct keypairKey from passphrase
    var saltKey = CryptoJS.enc.Hex.parse(this.saltKey);
    var keypairKey = CryptoJS.PBKDF2(this.passphrase, saltKey, {
      keySize: 256 / 32,
      // iterations: 1000
    });

    // decrypt keypair
    var encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(this.keypairSerializedCiphertext),
      iv: CryptoJS.enc.Hex.parse(this.keypairIv)
    });

    var keypairSerialized = CryptoJS.AES.decrypt(
      encrypted, keypairKey, {
        iv: CryptoJS.enc.Hex.parse(this.keypairIv),
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.Pkcs7
      }
    ).toString(CryptoJS.enc.Utf8);

    // reconstruct keypair
    var keypairRaw = JSON.parse(keypairSerialized);
    this.keypair = new RSAKey().fromString(keypairSerialized);

    // decrypt symkey
    var symkey = this.keypair.decrypt(this.symkeyCiphertext);
    this.symkey = CryptoJS.enc.Hex.parse(symkey);

    // decrypt containerNameHmacKey
    encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(this.containerNameHmacKeyCiphertext),
      iv: CryptoJS.enc.Hex.parse(this.containerNameHmacKeyIv)
    });

    var containerNameHmacKey = CryptoJS.AES.decrypt(
      encrypted, this.symkey, {
        iv: CryptoJS.enc.Hex.parse(this.containerNameHmacKeyIv),
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.NoPadding
      }
    );

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

