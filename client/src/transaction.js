(function () {
  var Transaction = crypton.Transaction = function () {
    this.chunks = [];
    this.id = null;

    // call the server to get a transaction id
  }

  // create diffs of container and add to chunks array
  Transaction.prototype.save = function () {
    for (var i in arguments) {
      console.log(i + ': ' + arguments[i]);
      this.chunks.push();
    }
  }

  // push chunks to the server
  Transaction.prototype.commit = function () {
  }
})();

