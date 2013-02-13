'use strict';

var fs = require('fs');
var assert = require('assert');

module.exports = {
  readFileSync: function readFileSync(path, encoding, length, position) {
    position = position || 0;
    var descriptor = fs.openSync(path, 'r');
    var contents = new Buffer(length);
    contents.fill(0);
    var bytesRead = fs.readSync(descriptor, contents, 0, length, position);
    assert(bytesRead === length);
    fs.closeSync(descriptor);
    return encoding ? contents.toString(encoding) : contents;
  }
};
