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
      callback();
    });
  }

  Container.prototype.getHistory = function (callback) {

  }

  Container.prototype.getDiff = function (callback) {
    var last = this.latestVersion();
    var old = this.versions[last] || this.keys;
    callback(null, crypton.diff.create(old, this.keys));
  }

  Container.prototype.latestVersion = function () {
    var versions = Object.keys(this.versions);

    if (!versions.length) {
      return this.version;
    } else {
      return Math.max.apply(Math, versions);
    }
  }
})();

