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
    return CryptoJS.lib.WordArray.random(nbytes);
  }
  crypton.randomBytes = randomBytes;

  crypton.generateAccount = function (username, passphrase, step, callback, options) {
    options = options || {};

    var defaults = {
      keypairBits: 2048,
      save: true,
      debug: false
    };

    for (var param in defaults) {
      options[param] = options[param] || defaults[param];
    }

    var account = new crypton.Account();
    account.username = username;
    account.saltKey = randomBytes(32);
    account.saltChallenge = randomBytes(32);
    console.log(account);

    var containerNameHmacKey = randomBytes(32);
    var symkey = randomBytes(32);
    var hmacKey = randomBytes(32);

    if (options.debug) { 
        console.log("generateAccount 2"); 
    }

    step();

    var keypairBits = options.keypairBits;
    var start = +new Date();
    var keypair = new RSAKey();
    if (options.debug) {
      console.log("generateAccount 3");
    }

    keypair.generateAsync(keypairBits, '03', step, function done () {
      if (options.debug) {
          console.log("generateAccount 4");
      }

      account.pubKey = hex2b64(keypair.n.toString(16));
      account.symkeyCiphertext = keypair.encrypt(symkey);

      step();

      account.challengeKey = CryptoJS.PBKDF2(passphrase, account.saltChallenge, { 
        keySize: 256 / 32,
        // iterations: 1000
      }).toString();

      step();

      if (options.debug) {
        console.log("generateAccount 5");
      }

      var keypairKey = CryptoJS.PBKDF2(passphrase, account.saltKey, {
        keySize: 256 / 32,
        // iterations: 1000
      });

      step();

      if (options.debug) {
        console.log("generateAccount 6");
      }

      account.keypairIv = randomBytes(16);
      account.keypairSerializedCiphertext = CryptoJS.AES.encrypt(
        keypair.serialize(), keypairKey, {
          iv: account.keypairIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.NoPadding
        }
      ).ciphertext.toString();

      if (options.debug) {
        console.log("generateAccount 7");
      }

      step();

      account.containerNameHmacKeyIv = randomBytes(16);
      account.containerNameHmacKeyCiphertext = CryptoJS.AES.encrypt(
        containerNameHmacKey, symkey, {
          iv: account.containerNameHmacKeyIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.NoPadding
        }
      ).ciphertext.toString();

      if (options.debug) {
        console.log("generateAccount 8");
      }

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

      if (options.debug) {
        console.log("generateAccount 9");
      }

      if (options.save) {
        account.save(function (err) {
          callback(err, account);
        });
        return;
      }

      callback(null, account);
    });

    if (options.debug) {
      console.log("generateAccount end");
    }
  };

  crypton.authorize = function (username, passphrase, callback) {
    superagent.post(crypton.url() + '/account/' + username)
      .end(function (res) {
        if (!res.body || res.body.success !== true) {
          callback(res.body.error);
          return;
        }

        var body = res.body;
        var iv = CryptoJS.enc.Hex.parse(body.iv);
        var saltChallenge = CryptoJS.enc.Hex.parse(body.saltChallenge);
        var challengeKey = CryptoJS.PBKDF2(passphrase, saltChallenge, { 
          keySize: 256 / 32,
          // iterations: 1000
        });

        var encrypted = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Hex.parse(body.challenge),
          salt: saltChallenge,
          iv: iv
        });

        var challenge = CryptoJS.AES.decrypt(
          encrypted, challengeKey, {
            iv: iv,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          }
        );

console.log(challenge.toString(CryptoJS.enc.utf8));

        var timeValueCiphertext = CryptoJS.AES.encrypt(
          body.time, challenge, {
            iv: iv,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          }
        ).ciphertext.toString();

        var timeValueCiphertextDigest = CryptoJS.SHA256(timeValueCiphertext).toString();

        var response = {
          challengeId: body.challengeId,
          answer: timeValueCiphertextDigest
        };

        superagent.post(crypton.url() + '/account/' + username + '/answer')
          .send(response)
          .end(function (res) {
            console.log(res.body);
            if (!res.body || res.body.success !== true) {
              callback(res.body.error);
              return;
            }

            // TODO set cookie
            var session = new crypton.Session();
            session.account = new crypton.Account();
            for (var i in res.body.account) {
              session.account[i] = res.body.account[i];
            }

            callback(null, session);
          });
      }
    );
  };

  crypton.resurrect = function () {

  };
})();

