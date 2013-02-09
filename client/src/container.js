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
    callback(null, createDiff(old, this.keys));

    function createDiff (o, n) {
      var diff = {};
      for (var i in n) {
        if (typeof n[i] == 'object' || typeof n[i] == 'array') {
          diff[i] = createDiff(o[i], n[i]);
          continue;
        }

        if (n[i] != o[i]) {
          diff[i] = [n[i]];
        }
      }

      for (var j in o) {
        if (!diff[j]) {
          diff[j] = undefined;
        }
      }

      return diff;
    }
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

