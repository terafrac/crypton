#!/usr/bin/env node
'use strict';

var program = require('commander');
program
  .version('0.0.1')
  .option('-c, --config [file]',
    'Specify a custom configuration file [default config]')
  .option('-p, --port [port]', 'Specify a port number [2013]', 2013)
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

var connect = require('connect');
var express = require('express');
var util = require('./lib/util');

var app = process.app = module.exports = express();
app.config = require('./lib/config')(program.config);
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
             'x-requested-with,content-type');
  next();
};

app.use(express.logger());
app.use(connect.cookieParser());
app.use(allowCrossDomain);
app.use(express.bodyParser());
app.use(connect.session({
  secret: util.readFileSync(
    app.config.cookieSecretFile, null,
    app.config.defaultKeySize
  ),
  store: connect.MemoryStore,
  key: 'crypton.sid',
  cookie: {
    secure: false // TODO true when we add SSL
  }
}));

require('./routes');

var start = app.start = function start() {
  app.listen(program.port);
};

if (!module.parent) {
  start();
}
