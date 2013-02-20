(function () {
  var Session = crypton.Session = function (id) {
    this.id = id;
    this.containers = [];
  };

  Session.prototype.serialize = function (callback) {
  };

  Session.prototype.ping = function (callback) {
  };

  Session.prototype.load = function (containerName, callback) {
    // check for a locally stored container
    for (var i in this.containers) {
      if (this.containers[i].name == containerName) {
        callback(null, this.containers[i]);
        return;
      }
    }

    // check for a container on the server
    this.getContainer(containerName, function (err, container) {
      if (err) {
        callback(err);
        return;
      }

      this.containers.push(container);
      callback(null, container);
    }.bind(this));
  };

  Session.prototype.create = function (containerName, callback) {
    for (var i in this.containers) {
      if (this.containers[i].name == containerName) {
        callback('Container already exists');
        return;
      }
    }

    var sessionKey = crypton.randomBytes(32);
    var hmacKey = crypton.randomBytes(32);
    var signature = 'hello'; // TODO sign with private key
    var sessionKeyCiphertext = this.account.keypair.encrypt(sessionKey.toString());
    var hmacKeyCiphertext = this.account.keypair.encrypt(hmacKey.toString());
    var containerNameHmac = CryptoJS.HmacSHA256(
      containerName,
      this.account.containerNameHmacKey
    ).toString();
    var payloadIv = crypton.randomBytes(16);
    var payloadCiphertext = CryptoJS.AES.encrypt(
      JSON.stringify({}), hmacKey, {
        iv: payloadIv,
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.Pkcs7
      }
    ).ciphertext.toString();
    var payloadHmac = CryptoJS.HmacSHA256(payloadCiphertext, hmacKey);

    var that = this;
    new crypton.Transaction(this, function (err, tx) {
      var chunks = [
        {
          type: 'addContainer',
          containerNameHmac: containerNameHmac
        }, {
          type: 'addContainerSessionKey',
          containerNameHmac: containerNameHmac,
          signature: signature
        }, {
          type: 'addContainerSessionKeyShare',
          containerNameHmac: containerNameHmac,
          sessionKeyCiphertext: sessionKeyCiphertext,
          hmacKeyCiphertext: hmacKeyCiphertext
        }, {
          type: 'addContainerRecord',
          containerNameHmac: containerNameHmac,
          hmac: payloadHmac.toString(),
          payloadIv: payloadIv.toString(),
          payloadCiphertext: payloadCiphertext
        }
      ];

      async.each(chunks, function (chunk, callback) {
        tx.save(chunk, callback);
      }.bind(this), function (err) {
        // TODO handle err
        if (err) {
          console.log(err);
          return;
        }

        tx.commit(function () {
          var container = new crypton.Container(that);
          container.name = containerName;
          container.sessionKey = sessionKey;
          container.hmacKey = hmacKey;
          that.containers.push(container);
          callback(null, container);
        });
      });
    });
  };

  Session.prototype.getContainer = function (containerName, callback) {
    var container = new crypton.Container(this);
    container.name = containerName;
    container.sync(function (err) {
      callback(err, container);
    });
  };
})();

