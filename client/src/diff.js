(function () {
  var Diff = crypton.diff = {};

  Diff.create = function (o, n) {
    var diff = {};
    for (var i in n) {
      if (typeof n[i] == 'object' || typeof n[i] == 'array') {
        diff[i] = Diff.create(o[i], n[i]);
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

  Diff.apply = function (diff, o, callback) {

  }

  Diff.string = function () {

  }

  Diff.object = function () {

  }
})();

