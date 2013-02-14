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
process.configFile = program.config;

var app = require('./app');
var start = function start() { app.listen(program.port); };

if (!module.parent) {
  start();
}
