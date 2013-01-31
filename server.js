#!/usr/bin/env node


var program = require('commander');
var util = require('util');

program
  .version('0.0.1')
  .option('-c, --config [file]', 'Specify a custom configuration file [default config]')
  .option('-p, --port [port]', 'Specify a port number [2013]', 2013)
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

var express = require('express');
var app = process.app = module.exports = express();

if (process.env.NODE_ENV.toLowerCase() === 'test') {
    app.config = require('./lib/config')('config.test.json');
} else {
    util.log(util.inspect(process.env));
    process.exit(1);
    app.config = require('./lib/config')(program.config);
}

app.datastore = require('./lib/storage');
app.id_translator = require("id_translator")
                    .load_id_translator(app.config.id_translator.key_file);

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'x-requested-with,content-type');
  next();
}

app.use(allowCrossDomain);
app.use(express.bodyParser());

require('./routes');

if (!module.parent) {
  app.listen(program.port);
}
