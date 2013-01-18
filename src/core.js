var crypton = {};

(function () {
  crypton.version = '0.0.1';
  crypton.host = 'localhost';
  crypton.port = '2013';

  crypton.url = function () {
    // TODO HTTPS
    return 'http://' + crypton.host + ':' + crypton.port;
  }

  function randomString (nbytes) {
    return CryptoJS.lib.WordArray.random(nbytes).toString();
  }

  crypton.uuid = (function () {
    var privateCounter = 1;
    var initialTimestamp = +new Date();
    return function () {
      privateCounter += 1;
      return CryptoJS.SHA256(randomString(32) + initialTimestamp + privateCounter).toString();
    }
  })();

  crypton.generateAccount = function (username, passphrase, step, callback) {
    var account = new crypton.Account();
    account.username = username;
    account.hmacKey = randomString(32);
    account.saltKey = randomString(32);
    account.saltChallenge = randomString(32);

    var containerNameHmacKey = randomString(32);
    var symkey = randomString(32);

    step();

    var keypairBits = 2048;
    var start = +new Date();
    var keypair = new RSAKey();
    keypair.generateAsync(keypairBits, '03', step, function done () {
      account.pubKey = hex2b64(keypair.n.toString(16));
      account.symkeyCiphertext = keypair.encrypt(symkey);

      step();

      account.challengeKey = CryptoJS.PBKDF2(passphrase, account.saltChallenge, { 
        keySize: 128 / 32,
        // iterations: 1000
      }).toString();

      step();

      var keypairKey = CryptoJS.PBKDF2(passphrase, account.saltKey, {
        keySize: 128 / 32,
        // iterations: 1000
      });

      step();

      account.keypairIv = CryptoJS.SHA256(crypton.uuid()).toString().slice(0, 16);
      account.keypairSerializedCiphertext = CryptoJS.AES.encrypt(
        JSON.stringify(keypair), keypairKey.toString(), {
          iv: account.keypairIv,
          mode: CryptoJS.mode.CFB,
          // padding: TODO (must be length of multiple of 16)
        }
      ).ciphertext.toString();

      step();

      account.containerNameHmacKeyIv = CryptoJS.SHA256(crypton.uuid()).toString().slice(0, 16);
      account.containerNameHmacKeyCiphertext = CryptoJS.AES.encrypt(
        containerNameHmacKey, symkey, {
          iv: account.containerNameHmacKeyIv,
          mode: CryptoJS.mode.CFB,
          // padding: TODO (must be length of multiple of 16)
        }
      ).ciphertext.toString();

      step();

      account.hmacKeyIv = CryptoJS.SHA256(crypton.uuid()).toString().slice(0, 16);
      account.hmacKeyCiphertext = CryptoJS.AES.encrypt(
        account.hmacKey, symkey, {
          iv: account.hmacKeyIv,
          mode: CryptoJS.mode.CFB,
          // padding: TODO (must be length of multiple of 16)
        }
      ).ciphertext.toString();

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

