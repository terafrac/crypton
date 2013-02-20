(function () {
  var Diff = crypton.diff = {};

  Diff.create = function (old, current) {
    var delta = jsondiffpatch.diff(old, current);
    return delta;
  };

  Diff.apply = function (delta, old) {
    var current = JSON.parse(JSON.stringify(old));
    jsondiffpatch.patch(current, delta);
    return current;
  };
})();

