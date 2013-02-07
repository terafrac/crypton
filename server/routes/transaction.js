var app = process.app;

// start a transaction, get a transaction token
app.post('/transaction', function (req, res) {
});

// commit a transaction
app.post('/transaction/:token/commit', function (req, res) {
});

// abort a transaction w/o committing
app.del('/transaction/:token', function (req, res) {
});

