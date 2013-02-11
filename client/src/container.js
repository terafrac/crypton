(function () {
  var Container = crypton.Container = function () {
    this.keys = {};
    this.versions = {};
    this.version = +new Date();
  }

  Container.prototype.add = function (key, value) {
    if (this.keys[key]) {
      callback('Key already exists');
      return;
    }

    this.keys[key] = {};
  }

  Container.prototype.get = function (key, callback) {
    if (!this.keys[key]) {
      callback('Key does not exist');
      return;
    }

    callback(null, this.keys[key]);
  }

  Container.prototype.save = function (callback) {
    this.getDiff(function (err, diff) {
      console.log(diff);
      var now = +new Date();
      this.versions[now] = JSON.parse(JSON.stringify(this.keys));
      this.version = now;

      var tx = new crypton.Transaction();
      tx.save(diff);
      tx.commit(function (err) {
        callback();
      });
    }.bind(this));
  }

  Container.prototype.getHistory = function (callback) {

  }

  Container.prototype.getDiff = function (callback) {
    var last = this.latestVersion();
    var old = this.versions[last] || {};
    callback(null, crypton.diff.create(old, this.keys));
  }

  Container.prototype.getVersions = function () {
    return Object.keys(this.versions);
  }

  Container.prototype.getVersion = function (version) {
    return this.versions[version];
  }

  Container.prototype.latestVersion = function () {
    var versions = this.getVersions();

    if (!versions.length) {
      return this.version;
    } else {
      return Math.max.apply(Math, versions);
    }
  }
})();

