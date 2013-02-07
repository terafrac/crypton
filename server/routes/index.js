var fs = require('fs');
var files = fs.readdirSync(__dirname);

files.splice(
  files.indexOf('index.js'), 1
);

for (var i in files) {
  require('./' + files[i]);
}
