'use strict';

var app = require("../../server/server");

require("should");
var util = require("util");
var path = require("path");
var fs = require("fs");
var _ = require("underscore");
var Q = require("q");
var express = require('express');

var phantom = require('node-phantom');
var phantomOptions = {phantomPath: require('phantomjs').path};

var cryptonHost = "crypton-dev.local";
var cryptonPort = "2013";
var cryptonPage = "/test_static/crypton.html";
var cryptonTestPage = "/test_static/crypton_test.html";
var cryptonUrl = "http://" + cryptonHost + ":" + cryptonPort + cryptonPage;
var cryptonTestUrl = ("http://" + cryptonHost + ":" + cryptonPort +
                      cryptonTestPage);

// module globals that give a configuration for the current test we want the
// browser to run
var testConfig = {};
//  before each test we copy this back over.
var baseTestConfig = {
  "name": null,
  "host": cryptonHost,
  "port": cryptonPort
};
var clientCompleteCallback = null;

var testStaticPath = path.resolve(__dirname, '..', 'test_static');
util.log("/test_static from " + testStaticPath);
app.use('/test_static', express.static(testStaticPath));

// send the configuration for the current test
app.get("/client_test/config.js", function (req, res) {
  var body = (
    "var cryptonTestResult = {};\n" +
      "var cryptonTestConfig = " + JSON.stringify(testConfig)
  );
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

// return the abs path to the js file for a named client test
var clientTestFilepath = function clientTestFilepath(testName) {
  return path.resolve(__dirname, "..", "client_test",
                      testName + ".js");
};

// send the code for the current test
app.get("/client_test/test.js", function (req, res) {
  var filepath = clientTestFilepath(testConfig.name);
  //util.log("scheduling read for filepath: " + filepath);
  var readfileCallback = function readfileCallback(err, data) {
    if (err) {
      util.log("could not read: ", err);
      process.exit(1);
    }
    //util.log("did read filepath " + filepath);
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Length', data.length);
    res.end(data);
  };
  fs.readFile(filepath, null, readfileCallback);
  //util.log("read scheduled");
  return readfileCallback;
});

app.get("/client_test/COMPLETE", function (req, res) {
  res.end("ok");
  if (!clientCompleteCallback) {
    util.log("WARN: COMPLETE called w/o callback");
    return;
  }
  clientCompleteCallback();
});

// create a unique username for tests
var newTestUsername = function newTestUsername() {
  var now = new Date();
  return "user_" + now.getTime();
};

// utility function to run a callback in the context of a browser at URL, then
// run a result callback.  will instead run run done(err) if we fail early.
var browser = function browser(done, url, contextCb, resultCb, options) {
  if (!options) {
    options = {};
  }
  phantom.create(function (err, ph) {
    if (err) { return done(err); }
    ph.createPage(function (err, page) {
      page.onConsoleMessage = function (msg) {
        util.log("page console: " + msg);
      };
      page.open(url, function (err, result) {
        //util.log("page open");
        //util.log(util.inspect(err));
        //util.log(util.inspect(result));
        if (err || result !== 'success') {
          return done([err, result]);
        }

        if (options.completePromise) {
          // wait to evaluate our function in browser context until
          // we are signaled that some action is complete.
          var promiseResolved = function promiseResolved() {
            util.log("page complete promise resolved");
            page.evaluate(contextCb, resultCb);
          };
          var promiseRejected = function promiseRejected() {
            util.log("page complete promise rejected");
            done();
          };
          options.completePromise.then(promiseResolved, promiseRejected);
          return;
        }

        page.evaluate(contextCb, resultCb);
      });
    });

  }, phantomOptions);
};

describe("test a browser interacting with a crypton server", function () {
  this.timeout(1000000);

  before(function () {
    util.log("before");
    app.start();
  });

  after(function () {
    util.log("after");
  });

  beforeEach(function () {
    // reset the test configuration before every test
    testConfig = _.clone(baseTestConfig);
    clientCompleteCallback = null;
  });

  it("examine crypton client object", function (done) {
    // run in the context of the crypton webpage
    var contextCb = function contextCb() {
      //console.log("context starting");
      var properties = [];
      var result = {
        abc: "def",
        cryptonProperties: properties
      };
      result.haveCrypton = !!this.crypton;
      if (result.haveCrypton) {
        for (var prop in crypton) {
          properties.push(prop);
        }
      }
      //console.log("context returning");
      return result;
    };

    // process the result from the contextCb
    var resultCb = function resultCb(err, result) {
      util.log("result starting");
      if (err) { return done(err); }
      util.log(util.inspect(result));
      result.cryptonProperties.should.include("url");
      result.cryptonProperties.should.include("host");
      result.cryptonProperties.should.include("port");
      result.cryptonProperties.should.include("version");
      done();
    };
    browser(done, cryptonUrl, contextCb, resultCb);
  });

  it("loading infrastructure pages for client tests", function (done) {
    testConfig.name = "load_test_config";
    fs.existsSync(clientTestFilepath(testConfig.name)).should.be.true;
    var contextCb = function contextCb() {
      //console.log(JSON.stringify(cryptonTestConfig));
      //return { "done": cryptonTestConfig.name };
      return cryptonTestConfig;
    };
    var resultCb = function resultCb(err, result) {
      //util.log("result starting");
      if (err) { return done(err); }
      //util.log(util.inspect(result));
      result.host.should.equal(cryptonHost);
      result.port.should.equal(cryptonPort);
      result.name.should.equal(testConfig.name);
      done();
    };
    browser(done, cryptonTestUrl, contextCb, resultCb);
  });

  it("round trip data return from browser", function (done) {
    // this tests that we can start a browser instance, get it to load our
    // test URL, load our test javascript code, and from there trigger a
    // GET request to /client_test/COMPLETE to signify that we are done.
    testConfig.name = "browser_round_trip";
    fs.existsSync(clientTestFilepath(testConfig.name)).should.be.true;

    clientCompleteCallback = function clientCompleteCallback() {
      util.log("browser posted back to COMPLETE");
      done();
    };
    var contextCb = function contextCb() {
      //console.log(JSON.stringify(cryptonTestConfig));
      //return { "done": cryptonTestConfig.name };
      return cryptonTestResult;
    };
    var resultCb = function resultCb(err, result) {
      util.log("result starting");
      util.log(util.inspect(result));
      if (err) { return done(err); }
    };
    var completeCb = function completeCb() {
      util.log("COMPLETE signaled");
      done();
    };
    browser(done, cryptonTestUrl, contextCb, resultCb);
  });

  it("wait on COMPLETE signal to collect browser results", function (done) {
    // this tests that we can start a browser instance, get it to load our
    // test URL, load our test javascript code, and from there trigger a
    // GET request to /client_test/COMPLETE to signify that we are done.

    // uses the same test code as above. the difference is we don't call
    // the browser context function until after the browser has signaled
    // complete.
    testConfig.name = "browser_round_trip_wait";
    fs.existsSync(clientTestFilepath(testConfig.name)).should.be.true;

    var completeDefer = Q.defer();

    clientCompleteCallback = function clientCompleteCallback() {
      util.log("browser posted back to COMPLETE");
      completeDefer.resolve();
    };

    // browser won't fire this until completeDefer is resolved
    var contextCb = function contextCb() {
      // retrieve the results object
      return cryptonTestResult;
    };

    var resultCb = function resultCb(err, result) {
      // log the results object
      util.log("result starting");
      util.log(util.inspect(result));
      if (err) { return done(err); }
      done();
    };
    var options = { completePromise: completeDefer.promise };
    browser(done, cryptonTestUrl, contextCb, resultCb, options);
  });

  it.only("generate an account", function (done) {
    testConfig.name = "generate_account";
    testConfig.username = newTestUsername();
    testConfig.passphrase = "password";
    util.log(clientTestFilepath(testConfig.name));
    fs.existsSync(clientTestFilepath(testConfig.name)).should.be.true;

    var completeDefer = Q.defer();

    clientCompleteCallback = function clientCompleteCallback() {
      util.log("browser posted back to COMPLETE");
      completeDefer.resolve();
    };

    var contextCb = function contextCb() {
      //console.log(JSON.stringify(cryptonTestConfig));
      //return { "done": cryptonTestConfig.name };
      return cryptonTestResult;
    };

    var resultCb = function resultCb(err, result) {
      util.log("result starting");
      if (err) { return done(err); }
      util.log(util.inspect(result));
      result.success.should.be.true;
      result.complete.should.equal("finished");
      done();
    };

    var options = { completePromise: completeDefer.promise };
    browser(done, cryptonTestUrl, contextCb, resultCb, options);
  });
});
