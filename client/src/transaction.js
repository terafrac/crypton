(function () {
  var Transaction = crypton.Transaction = function (session, callback) {
    this.session = session;
    this.chunks = [];

    // temporary
    this.types = [
      'addAccount',
      'setBaseKeyring',
      'addContainer',
      'deleteContainer',
      'addContainerSessionKey',
      'addContainerSessionKeyShare',
      'addContainerRecord',
      'addMessage',
      'deleteMessage'
    ];

    this.create(function (err, token) {
      if (err) {
        console.log(err);
        callback(err);
        return;
      }

      this.token = token;

      callback(null, this);
    }.bind(this));
  };

  Transaction.prototype.create = function (callback) {
    var url = crypton.url() + '/transaction/create';
    superagent.post(url)
      .set('session-identifier', this.session.id)
      .end(function (res) {
      if (!res.body || res.body.success !== true) {
        callback(res.body.error);
        return;
      }

      callback(null, res.body.token);
    });
  };

  // create diffs of container and add to chunks array
  Transaction.prototype.save = function () {
    this.verify();
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();
    if (typeof callback != 'function') {
      args.push(callback);
      callback = function () {};
    }

    async.each(args, function (chunk, callback) {
      // TODO check the type of the object
      if (typeof chunk == 'function') {
        callback();
        return;
      }

      this.saveChunk(chunk, callback);
    }.bind(this), function (err) {
      callback(err);
    });
  };

  Transaction.prototype.saveChunk = function (chunk, callback) {
    this.verify();
    var url = crypton.url() + '/transaction/' + this.token;
    superagent.post(url)
      .set('session-identifier', this.session.id)
      .send(chunk)
      .end(function (res) {
        if (!res.body || res.body.success !== true) {
          callback(res.body.error);
          return;
        }

        callback();
      });
  };

  // push chunks to the server
  Transaction.prototype.commit = function (callback) {
    this.verify();
    var url = crypton.url() + '/transaction/' + this.token + '/commit';
    superagent.post(url)
      .set('session-identifier', this.session.id)
      .end(function (res) {
        if (!res.body || res.body.success !== true) {
          callback(res.body.error);
          return;
        }

        callback();
      });
  };

  Transaction.prototype.cancel = function (callback) {
    this.verify();
    var url = crypton.url() + '/transaction/' + this.token;
    superagent.del(url).end(function (res) {
      if (!res.body || res.body.success !== true) {
        callback(res.body.error);
        return;
      }

      callback();
    });
  };

  Transaction.prototype.verify = function () {
    if (!this.token) {
      throw new Error('Invalid transaction');
    }
  };
})();

