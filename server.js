#!/usr/bin/env node

var program = require('commander');

program
  .version('0.0.1')
  .option('-p, --port [port]', 'Specify a port number [2013]', 2013)
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

var express = require('express');
var app = process.app = module.exports = express();
require('./routes');

if (!module.parent) {
  app.listen(program.port);
}

