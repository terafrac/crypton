(function () {
  var Container = crypton.Container = function (session) {
    this.keys = {};
    this.session = session;
    this.versions = {};
    this.version = +new Date();
    this.name = null;
  };

  Container.prototype.add = function (key, callback) {
    if (this.keys[key]) {
      callback('Key already exists');
      return;
    }

    this.keys[key] = {};
    callback();
  };

  Container.prototype.get = function (key, callback) {
    if (!this.keys[key]) {
      callback('Key does not exist');
      return;
    }

    callback(null, this.keys[key]);
  };

  Container.prototype.save = function (callback) {
    this.getDiff(function (err, diff) {
      var now = +new Date();
      this.versions[now] = JSON.parse(JSON.stringify(this.keys));
      this.version = now;

      var payloadIv = crypton.randomBytes(16);
      var payloadCiphertext = CryptoJS.AES.encrypt(
        JSON.stringify(diff), this.hmacKey, {
          iv: payloadIv,
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.Pkcs7
        }
      ).ciphertext.toString();
      var payloadHmac = CryptoJS.HmacSHA256(payloadCiphertext, this.hmacKey);

      var chunk = {
        type: 'addContainerRecord',
        containerNameHmac: this.getPublicName(),
        hmac: payloadHmac.toString(),
        payloadIv: payloadIv.toString(),
        payloadCiphertext: payloadCiphertext
      };

      // TODO handle errs
      var tx = new crypton.Transaction(this.session, function (err) {
        tx.save(chunk, function (err) {
          tx.commit(function (err) {
            callback();
          });
        });
      });
    }.bind(this));
  };

  Container.prototype.getDiff = function (callback) {
    var last = this.latestVersion();
    var old = this.versions[last] || {};
    callback(null, crypton.diff.create(old, this.keys));
  };

  Container.prototype.getVersions = function () {
    return Object.keys(this.versions);
  };

  Container.prototype.getVersion = function (version) {
    return this.versions[version];
  };

  Container.prototype.latestVersion = function () {
    var versions = this.getVersions();

    if (!versions.length) {
      return this.version;
    } else {
      return Math.max.apply(Math, versions);
    }
  };

  Container.prototype.getPublicName = function () {
    var containerNameHmac = CryptoJS.HmacSHA256(
      this.name,
      this.session.account.containerNameHmacKey
    );
    return containerNameHmac.toString();
  };

  Container.prototype.getHistory = function (callback) {
    var containerNameHmac = this.getPublicName();
    superagent.get(crypton.url() + '/container/' + containerNameHmac)
      .set('session-identifier', this.session.id)
      .end(function (res) {
        if (!res.body || res.body.success !== true) {
          callback(res.body.error);
          return;
        }

        callback(null, res.body.records);
      });
  };

  Container.prototype.parseHistory = function (records, callback) {
    var keys = {};
    var versions = {};

    for (var i in records) {
      var record = this.decryptRecord(records[i]);
      // TODO apply diff to keys object
      keys = crypton.diff.apply(record.delta, keys);
      versions[record.time] = JSON.parse(JSON.stringify(keys));
    }

    callback(null, keys, versions);
  };

  Container.prototype.decryptRecord = function (record) {
    var hp = CryptoJS.enc.Hex.parse;

    var sessionKeyCiphertext = hp(record.sessionKeyCiphertext).toString(CryptoJS.enc.Utf8);
    var sessionKey = hp(this.session.account.keypair.decrypt(sessionKeyCiphertext));

    var hmacKeyCiphertext = hp(record.hmacKeyCiphertext).toString(CryptoJS.enc.Utf8);
    var hmacKey = hp(this.session.account.keypair.decrypt(hmacKeyCiphertext));

    // XXX is this the correct way to store these?
    // do they need to come with ever record?
    this.sessionKey = sessionKey;
    this.hmacKey = hmacKey;

    // TODO authenticate payload
    var payloadHmac = CryptoJS.HmacSHA256(record.payloadCiphertext, hmacKey);

    var payloadIv = hp(record.payloadIv);
    var encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: hp(record.payloadCiphertext),
      iv: payloadIv
    });
    var payloadRaw = CryptoJS.AES.decrypt(
      encrypted, hmacKey, {
        iv: payloadIv,
        mode: CryptoJS.mode.CFB,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    var payload = JSON.parse(payloadRaw.toString(CryptoJS.enc.Utf8));

    return {
      time: +new Date(record.creationTime),
      delta: payload
    };
  };

  Container.prototype.sync = function (callback) {
    var that = this;
    this.getHistory(function (err, records) {
      if (err) {
        callback(err);
        return;
      }

      that.parseHistory(records, function (err, keys, versions) {
        that.keys = keys;
        that.versions = versions;
        that.version = Math.max.apply(Math, Object.keys(versions));
        callback(err);
      });
    });
  };
})();

