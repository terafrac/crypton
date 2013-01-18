var app = process.app;

app.post('/account', function (req, res) {
  console.log(req.body);
  res.send('hello');
});

app.post('/account/:username', function (req, res) {
});

app.post('/account/:username/password', function (req, res) {
});

