var crypton = {};

(function () {
  crypton.version = '0.0.1';
  crypton.host = 'localhost';
  crypton.port = '2013';

  crypton.url = function () {
    // TODO HTTPS
    return 'http://' + crypton.host + ':' + crypton.port;
  };

  function randomBytes (nbytes) {
    return CryptoJS.lib.WordArray.random(nbytes);
  };
  crypton.randomBytes = randomBytes;

  crypton.generateAccount = function (username, passphrase, step, callback, options) {
    options = options || {};

    var defaults = {
      keypairBits: 2048,
      save: true,
      debug: false
    };

    for (var param in defaults) {
      options[param] = options.hasOwnProperty(param) ? options[param] : defaults[param];
    }

    var account = new crypton.Account();
    account.username = username;
    account.keypairSalt = randomBytes(32);
    account.challengeKeySalt = randomBytes(32);

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
      account.symkeyCiphertext = keypair.encrypt(symkey.toString());

      step();

      account.challengeKey = CryptoJS.PBKDF2(passphrase, account.challengeKeySalt, { 
        keySize: 256 / 32,
        // iterations: 1000
      }).toString();

      step();

      if (options.debug) {
        console.log("generateAccount 5");
      }

      var keypairKey = CryptoJS.PBKDF2(passphrase, account.keypairSalt, {
        keySize: 256 / 32,
        // iterations: 1000
      });

      step();

      if (options.debug) {
        console.log("generateAccount 6");
      }

      account.keypairIv = randomBytes(16);
      account.keypairCiphertext = CryptoJS.AES.encrypt(
        keypair.serialize(), keypairKey, {
          iv: account.keypairIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.Pkcs7
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
      account.challengeKeySalt = account.challengeKeySalt.toString();
      account.keypairSalt = account.keypairSalt.toString();
      account.keypairIv = account.keypairIv.toString();
      account.keypairCiphertext = account.keypairCiphertext;
      account.containerNameHmacKeyIv = account.containerNameHmacKeyIv.toString();
      account.containerNameHmacKeyCiphertext = account.containerNameHmacKeyCiphertext;
      account.hmacKeyIv = account.hmacKeyIv.toString();
      account.hmacKeyCiphertext = account.hmacKeyCiphertext;

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
        var challengeKeySalt = CryptoJS.enc.Hex.parse(body.challengeKeySalt);
        var challengeKey = CryptoJS.PBKDF2(passphrase, challengeKeySalt, {
          keySize: 256 / 32,
          // iterations: 1000
        });

        var encrypted = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Hex.parse(body.challenge),
          salt: challengeKeySalt,
          iv: iv
        });

        var challenge = CryptoJS.AES.decrypt(
          encrypted, challengeKey, {
            iv: iv,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          }
        );

        var timeValueDigest = CryptoJS.SHA256(body.time).toString();
        var timeValueCiphertext = CryptoJS.AES.encrypt(
          timeValueDigest, challenge, {
            iv: iv,
            mode: CryptoJS.mode.CFB,
            padding: CryptoJS.pad.NoPadding
          }
        ).ciphertext.toString();

        var response = {
          challengeId: body.challengeId,
          answer: timeValueCiphertext
        };

        superagent.post(crypton.url() + '/account/' + username + '/answer')
          .send(response)
          .end(function (res) {
            if (!res.body || res.body.success !== true) {
              callback(res.body.error);
              return;
            }

            var sessionIdentifier = res.body.sessionIdentifier;
            var session = new crypton.Session(sessionIdentifier);
            session.account = new crypton.Account();
            session.account.passphrase = passphrase;
            for (var i in res.body.account) {
              session.account[i] = res.body.account[i];
            }

            session.account.unravel(function () {
              callback(null, session);
            });
          });
      }
    );
  };

  crypton.resurrect = function () {

  };
})();

