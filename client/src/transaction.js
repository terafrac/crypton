(function () {
  var Transaction = crypton.Transaction = function () {
    this.chunks = [];
  }

  // create diffs of container and add to chunks array
  Transaction.prototype.save = function () {
    for (var i in arguments) {
      this.chunks.push();
    }
  }

  // push chunks to the server
  Transaction.prototype.commit = function () {
  }
})();

