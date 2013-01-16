var crypton = {};

(function () {
  crypton.version = '0.0.1';
  crypton.host = 'localhost';
  crypton.post = '2013';

  function randomString (nbytes) {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  function uuid () {
    return 'foo';
  }

  crypton.generateAccount = function (username, passphrase, step, callback) {
/*
cipher = aes256cfb(key=keypair_key, iv=keypair_iv)
# XXX padding (must be length of multiple of 16)
keypair_serialized_ciphertext = cipher.encrypt(keypair_as_string) 

symkey_ciphertext = rsa_keypair_obj.encrypt_to_private(symkey)
container_name_hmac_key_iv = sha256(uuid()).digest()[:16]
cipher = aes256cfb(key=symkey, iv=container_name_hmac_key_iv)
container_name_hmac_key_ciphertext = cipher.encrypt(container_name_hmac_key)
hmac_key_iv = sha256(uuid()).digest()[:16]
cipher = aes256cfb(key=symkey, iv=hmac_key_iv)
hmac_key_ciphertext = cipher.encrypt(hmac_key)
*/
    var account = {};
    var containerNameHmacKey = randomString();
    var hmacKey = randomString();
    var symkey = randomString();
    account.saltKey = randomString();
    account.saltChallenge = randomString();

    step();

    var keypairBits = 2048;
    var start = +new Date();
    var keypair = new RSAKey();
    keypair.generateAsync(keypairBits, '03', step, function done () {
      account.pubKey = hex2b64(keypair.n.toString(16));
      console.log(keypair, account);

      var challengeKey = CryptoJS.PBKDF2(passphrase, account.saltChallenge, { 
        keySize: 128 / 32,
        // iterations: 1000
      });

      step();

      var keypairKey = CryptoJS.PBKDF2(passphrase, account.saltKey, {
        keySize: 128 / 32,
        // iterations: 1000
      });

      step();

      var keypairIv = CryptoJS.SHA256(uuid()).toString().slice(0, 16);

      /*
      var cipher = CryptoJS.AES.encrypt(JSON.stringify(keypair), keypairKey, {
        iv: keypairIv,
        //mode: CryptoJS.mode.CFB,
        //padding: CryptoJS.pad.AnsiX923
      });
      */

      step();

      callback(null, account);
    });
  };

  crypton.authorize = function () {

  };

  crypton.resurrect = function () {

  };
})();

