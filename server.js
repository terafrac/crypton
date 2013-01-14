#!/usr/bin/env node

var program = require('commander');

program
  .version('0.0.1')
  .option('-p, --port [port]', 'Specify a port number [2013]', 2013)
  .option('-v, --verbose', 'Enable verbose logging')
  .parse(process.argv);

console.log(program);

var express = require('express');
var app = express();

app.post('/account', function (req, res) {
});

app.post('/account/:username', function (req, res) {
});

app.post('/account/:username/password', function (req, res) {
});

app.get('/session', function (req, res) {
});

app.post('/transaction', function (req, res) {
});

app.post('/transaction/:token/commit', function (req, res) {
});

app.del('/transaction/:token', function (req, res) {
});

app.get('/container/:containerNameCiphertext', function (req, res) {
});

app.post('/container/:containerNameCiphertext', function (req, res) {
});

app.get('/container/:containerNameCiphertext/:recordVersionIdentifier', function (req, res) {
});

app.get('/inbox', function (req, res) {
});

app.get('/inbox/:messageIdentifier', function (req, res) {
});

app.del('/inbox/:messageIdentifier', function (req, res) {
});

app.post('/outbox', function (req, res) {
});

module.exports = app;

if (!module.parent) {
  app.listen(program.port);
}

