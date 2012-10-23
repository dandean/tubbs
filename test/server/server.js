var express = require('express');
var app = express();
var exec = require('child_process').exec;
var fs = require('fs');

var file = function(path) {
  return fs.readFileSync(path, 'utf8');
};

app.all('*', function(req, res, next) {
  // Do not cache any resources from this server.
  res.header('Cache-Control', 'no-cache');
  next();
});

//
// RESOURCES
//

// CSS
app.get('/mocha.css', function(req, res) {
  res.type('css');
  res.send(file('./node_modules/mocha/mocha.css'));
});

// Mocha
app.get('/mocha.js', function(req, res) {
  res.type('text/javascript');
  res.send(file('./node_modules/mocha/mocha.js'));
});

// Client-side JavaScript
app.get('/index.js', function(req, res) {
  exec('browserify test/index.js -d', function(e, stdout, stderr) {
    if (e) throw e;

    if (stderr) console.log(stderr);

    res.type('text/javascript');
    res.send(stdout);
  });
});

// HTML
app.get('/', function(req, res) {
  res.send(file('./test/server/index.html'))
});

//
// REST ENDPOINTS
//

// Start the server
app.listen(3000);
console.log('Server started at http://localhost:3000/');
