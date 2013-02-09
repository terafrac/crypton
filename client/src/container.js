(function () {
  var Container = crypton.Container = function () {
    this.keys = {};
    this.versions = {};
    this.version = 0;
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
    callback();
  }

  Container.prototype.getHistory = function (callback) {

  }

  Container.prototype.getDiff = function (callback) {
    for (var i in this.keys) {

    }
  }
})();

