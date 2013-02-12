var app = process.app;
var db = app.datastore;
var verifySession = require('../lib/middleware').verifySession;

// start a transaction, get a transaction token
app.post('/transaction/create', verifySession, function (req, res) {
  db.createTransaction(function (err, token) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    res.send({
      success: true,
      transactionToken: token
    });
  });
});

// start a transaction, get a transaction token
app.post('/transaction/:token', verifySession, function (req, res) {
  console.log(req.body);
  var data = req.body.data;
  var token = req.params.token;

  db.updateTransaction(token, data, function (err, token) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    res.send({
      success: true
    });
  });
});

// commit a transaction
app.post('/transaction/:token/commit', function (req, res) {
  var token = req.params.token;
});

// abort a transaction w/o committing
app.del('/transaction/:token', function (req, res) {
  var token = req.params.token;

  // TODO make sure transaction belongs to session
  db.deleteTransaction(token, function (err, token) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    res.send({
      success: true
    });
  });
});
