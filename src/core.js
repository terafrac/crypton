var crypton = {};

(function () {
  crypton.version = '0.0.1';
  crypton.host = 'localhost';
  crypton.port = '2013';

  crypton.url = function () {
    // TODO HTTPS
    return 'http://' + crypton.host + ':' + crypton.port;
  }

  function randomBytes (nbytes) {
    return CryptoJS.lib.WordArray.random(nbytes) //.toString(CryptoJS.enc.Latin1);
  }

  crypton.generateAccount = function (username, passphrase, step, callback) {
    var account = new crypton.Account();
    account.username = username;
    account.saltKey = randomBytes(32);
    account.saltChallenge = randomBytes(32);
    console.log(account);

    var containerNameHmacKey = randomBytes(32);
    var symkey = randomBytes(32);
    var hmacKey = randomBytes(32);

    step();

    var keypairBits = 2048;
    var start = +new Date();
    var keypair = new RSAKey();
    keypair.generateAsync(keypairBits, '03', step, function done () {
      account.pubKey = hex2b64(keypair.n.toString(16));
      account.symkeyCiphertext = keypair.encrypt(symkey);

      step();

      account.challengeKey = CryptoJS.PBKDF2(passphrase, account.saltChallenge, { 
        keySize: 256 / 32,
        // iterations: 1000
      }).toString();

      step();

      var keypairKey = CryptoJS.PBKDF2(passphrase, account.saltKey, {
        keySize: 256 / 32,
        // iterations: 1000
      });

      step();

      account.keypairIv = randomBytes(16);
      account.keypairSerializedCiphertext = CryptoJS.AES.encrypt(
        keypair.serialize(), keypairKey, {
          iv: account.keypairIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.NoPadding
        }
      ).ciphertext.toString();

      step();

      account.containerNameHmacKeyIv = randomBytes(16);
      account.containerNameHmacKeyCiphertext = CryptoJS.AES.encrypt(
        containerNameHmacKey, symkey, {
          iv: account.containerNameHmacKeyIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.NoPadding
        }
      ).ciphertext.toString();

      step();

      account.hmacKeyIv = randomBytes(16);
      account.hmacKeyCiphertext = CryptoJS.AES.encrypt(
        hmacKey, symkey, {
          iv: account.hmacKeyIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.NoPadding
        }
      ).ciphertext.toString();

      // convert WordArrays to strings for serialization
      account.saltChallenge = account.saltChallenge.toString();
      account.saltKey = account.saltKey.toString();
      account.keypairIv = account.keypairIv.toString();
      account.containerNameHmacKeyIv = account.containerNameHmacKeyIv.toString();
      account.hmacKeyIv = account.hmacKeyIv.toString();

      account.save(function () {
        callback(null, account);
      });
    });
  };

  crypton.authorize = function () {

  };

  crypton.resurrect = function () {

  };
})();

