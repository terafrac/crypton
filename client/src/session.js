(function () {
  var Session = crypton.Session = function (id) {
    this.id = id;
    this.containers = [];
  }

  Session.prototype.serialize = function (callback) {
  }

  Session.prototype.ping = function (callback) {
  }

  Session.prototype.load = function (containerName, callback) {
    for (var i in this.containers) {
      if (this.containers[i].name == containerName) {
        callback(null, this.containers[i]);
        return;
      }
    }

    // TODO else load from server

    callback('Container does not exist');
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
    );

    new crypton.Transaction(this, function (err, tx) {
console.log(arguments);
      tx.save({
        type: 'addContainer',
        containerNameHmac: containerNameHmac
      });

      tx.save({
        type: 'addContainerSessionKey'
        // ??
      });

      tx.save({
        type: 'addContainerSessionKeyShare',
        containerNameHmac: containerNameHmac,
        sessionKeyCiphertext: sessionKeyCiphertext,
        hmacKeyCiphertext: hmacKeyCiphertext
      });

      tx.commit(function () {
        var container = new crypton.Container();
        container.name = containerName;
        container.sessionKey = sessionKey;
        container.hmacKey = hmacKey;
        container.session = this;
        this.containers.push(container);
        callback(null, container);
      }.bind(this));
    });
  };
})();

