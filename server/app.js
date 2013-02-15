'use strict';

var connect = require('connect');
var express = require('express');
var util = require('./lib/util');

var app = process.app = module.exports = express();
app.config = require('./lib/config');
app.datastore = require('./lib/storage');
/*jslint camelcase: false*/
app.id_translator = require("id_translator")
    .load_id_translator(app.config.id_translator.key_file);
/*jslint camelcase: true*/

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods',
             'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',
             'x-requested-with,content-type,session-identifier');
  next();
};

app.use(express.logger('dev'));
app.use(connect.cookieParser());
app.use(allowCrossDomain);
app.use(express.bodyParser());
app.use(connect.session({
  secret: util.readFileSync(
    // TODO: 'binary' encoding is deprecated
    app.config.cookieSecretFile, 'binary',
    app.config.defaultKeySize
  ),
  store: connect.MemoryStore,
  key: 'crypton.sid',
  cookie: {
    secure: false // TODO true when we add SSL
  }
}));

app.options('/*', function (req, res) {
  res.send('');
});

require('./routes');
