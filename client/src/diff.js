(function () {
  var Diff = crypton.diff = {};

  Diff.create = function (old, current) {
    var diff = {};

    for (var i in current) {
      if (!current.hasOwnProperty(i)) {
        continue;
      }

      // recurse into objects and arrays
      if (typeof current[i] == 'object' || typeof current[i] == 'array') {
        diff[i] = Diff.create(old[i] || {}, current[i]);
        continue;
      }

      // find new keys
      if (!old.hasOwnProperty(i)) {
        diff[i] = [
          undefined,
          current[i]
        ];
        continue;
      }

      // find changed keys
      if (current[i] != old[i]) {
        diff[i] = [
          old[i],
          current[i]
        ];
      }
    }

    // find deleted keys
    for (var i in old) {
      if (!old.hasOwnProperty(i)) {
        continue;
      }

      if (typeof current[i] == 'undefined') {
        diff[i] = [
          old[i],
          undefined
        ];
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

