'use strict';

var Q = require('q');
var pg = require('pg');


function DatabaseError(err) {
  if (err) {
    this.message = err.toString();
    this.dbError = err;
    this.code = err.code;
  } else {
    this.message = 'Database error.';
  }
}
DatabaseError.prototype = new Error();
DatabaseError.prototype.constructor = DatabaseError;
exports.DatabaseError = DatabaseError;


function HandledDatabaseError(err, message) {
  for (var i in err) { this[i] = err[i]; }
  this.message = message;
}
HandledDatabaseError.prototype = new DatabaseError();
HandledDatabaseError.prototype.constructor = HandledDatabaseError;
exports.HandledDatabaseError = HandledDatabaseError;


/* Adapt pg Client object to issue promises instead of using callbacks. */
var makePromising = exports.makePromising = function makePromising(client) {
  var self = Object.create(client);

  ['connect', 'query'].forEach(function (methodName) {
    var clientMethod = client[methodName];
    self[methodName] = function () {
      var d = Q.defer();
      var args = Array.prototype.slice.call(arguments);
      args.push(function callback(err, result) {
        if (err instanceof Error) {
          d.reject(err);
        } else if (err) {
          d.reject(new DatabaseError(err));
        } else {
          d.resolve(result);
        }
      });
      clientMethod.apply(client, args);
      return d.promise;
    };
  });

  /* Regulate queries using promises.
  *
  *  If the transaction argument is true, first we issue a begin statement.
  *  Next, we call doQueries, passing it a promise which will be fulfilled
  *  when the begin statement is finished (or immediately if transaction is
  *  false).  You perform your db queries using .then on the passed promise,
  *  and return a promise for your last query. When that promise is fulfilled,
  *  if transaction is true, we issue a commit or rollback statement
  *  (depending on whether your promise was rejected). Finally, we call the
  *  passed callback.
  *
  *  For success, we pass the callback null as the first argument, and the
  *  value of the final promise as the second argument. For failure, we pass
  *  the callback an error message as the first argument.
  */
  self.queries = function (callback, transaction, doQueries) {
    var self = this;
    var promise = transaction ? self.query('begin') : Q.resolve();
    promise = doQueries(promise);
    if (transaction) {
      promise = promise.then(function () { return self.query('commit'); });
    }
    return promise.done(function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(null);
      callback.apply(undefined, args);
    }, function (err) {
      if (transaction) { self.query('rollback'); }
      if (err instanceof HandledDatabaseError) {
        callback(err.message);
      } else {
        console.log('Unhandled database error: ' + err);
        callback('Database error.');
      }
    });
  };
  return self;
};


// callback with a client. crash the whole app on error.
function connect() {
  var config = process.app.config.database;
  var conString = 'tcp://' +
    config.username + ':' +
    config.password + '@' +
    config.host + ':' +
    config.port + '/' +
    config.database;

  var d = Q.defer();
  pg.connect(conString, function (err, client) {
    if (err) {
      // TODO: retry a few times with delays, so we can survive a quick
      // database hiccup. crash the whole app only if the DB's really
      // unavailable.
      console.log('Could not connect to database:');
      console.log(err);
      process.exit(1);
    }
    client = makePromising(client);
    d.resolve(client);
  });
  return d.promise;
}
exports.connect = connect;
