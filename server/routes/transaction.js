var app = process.app;
var db = app.datastore;
var verifySession = require('../lib/middleware').verifySession;

// start a transaction, get a transaction token
app.post('/transaction/create', verifySession, function (req, res) {
  var accountId = req.session.accountId;

  db.createTransaction(accountId, function (err, token) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    res.send({
      success: true,
      token: token
    });
  });
});

// start a transaction, get a transaction token
app.post('/transaction/:token', verifySession, function (req, res) {
  var data = req.body;
  var token = req.params.token;
  var account = req.session.accountId;

  db.updateTransaction(token, account, data, function (err) {
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
app.post('/transaction/:token/commit', verifySession, function (req, res) {
  var token = req.params.token;
  res.send({
    success: true
  });
});

// abort a transaction w/o committing
app.del('/transaction/:token', verifySession, function (req, res) {
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
