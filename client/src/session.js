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

    var containerNameCiphertext = CryptoJS.HmacSHA256(
      containerName,
      this.account.containerNameHmacKey
    );

    var sessionKeyCiphertext = '';

    var hmacKeyCiphertext = '';

    var tx = new crypton.Transaction();

    tx.save({
      type: 'addContainer',
      containerNameCiphertext: containerNameCiphertext
    });

    tx.save({
      type: 'addContainer',
      containerNameCiphertext: containerNameCiphertext
    });

    tx.commit(function () {
      var container = new crypton.Container();
      container.name = containerName;
      container.session = this;
      this.containers.push(container);
      callback(null, container);
    });
  };
})();

