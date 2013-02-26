/* Crypton Server, Copyright 2013 SpiderOak, Inc.
 *
 * This file is part of Crypton Server.
 *
 * Crypton Server is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton Server is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton Server.  If not, see <http://www.gnu.org/licenses/>.
*/
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

