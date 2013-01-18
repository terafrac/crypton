#!/usr/bin/env node

var program = require('commander');

program
  .version('0.0.1')
  .option('-p, --port [port]', 'Specify a port number [2013]', 2013)
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

var express = require('express');
var app = process.app = module.exports = express();

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

