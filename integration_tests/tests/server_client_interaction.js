var app = require("../../server/server");

var util = require("util");
var path = require("path");
var should = require("should");
var fs = require("fs");
var _ = require("underscore");
var Q = require("q");
var express = require('express');

var phantom = require('node-phantom');

var crypton_host = "crypton-dev.local";
var crypton_port = "2013";
var crypton_page = "/test_static/crypton.html"; 
var crypton_test_page = "/test_static/crypton_test.html"; 
var crypton_url = "http://" + crypton_host + ":" + crypton_port + crypton_page;
var crypton_test_url = "http://" + crypton_host + ":" + crypton_port + crypton_test_page;

// module globals that give a configuration for the current test we want the
// browser to run
var test_config = {};
//  before each test we copy this back over.
var base_test_config = {
    "name": null,
    "host": crypton_host,
    "port": crypton_port
};
var client_complete_callback = null;

var test_static_path = path.resolve(__dirname, '..', 'test_static');
util.log("/test_static from " + test_static_path);
app.use('/test_static', express.static(test_static_path));

// send the configuration for the current test
app.get("/client_test/config.js", function (req, res) {
    var body = (
        "var crypton_test_result = {};\n" +
        "var crypton_test_config = " + JSON.stringify(test_config)
    );
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});
// send the code for the current test
app.get("/client_test/test.js", function (req, res) {
    var filepath = client_test_filepath(test_config.name);
    //util.log("scheduling read for filepath: " + filepath);
    var readfile_callback = function readfile_callback (err, data) {
        if (err) {
            util.log("could not read: ", err); 
            process.exit(1); 
        }
        //util.log("did read filepath " + filepath);
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Content-Length', data.length);
        res.end(data);
    };
    fs.readFile(filepath, null, readfile_callback);
    //util.log("read scheduled");
    return readfile_callback;
});

app.get("/client_test/COMPLETE", function (req, res) {
    res.end("ok");
    if (!client_complete_callback) {
        util.log("WARN: COMPLETE called w/o callback");
        return;
    }
    client_complete_callback();
});

// return the abs path to the js file for a named client test
var client_test_filepath = function client_test_filepath(test_name) {
    return path.resolve(__dirname, "..", "client_test",
                        test_name + ".js");
};

// create a unique username for tests
var new_test_username = function new_test_username() {
    var now = new Date();
    return "user_" + now.getTime();
};

// utility function to run a callback in the context of a browser at URL, then
// run a result callback.  will instead run run done(err) if we fail early.
var browser = function browser(done, url, context_cb, result_cb, options) {
    if (!options) {
        options = {};
    }
    phantom.create(function(err, ph) { 
        if (err) { return done(err); }
        ph.createPage(function(err, page) {
            page.onConsoleMessage = function (msg) {
                util.log("page console: " + msg);
            };
            page.open(url, function(err, result) {
                //util.log("page open");
                //util.log(util.inspect(err));
                //util.log(util.inspect(result));
                if (err || result !== 'success') {
                    return done([err, result]);
                }

                if (options.complete_promise) {
                    // wait to evaluate our function in browser context until
                    // we are signaled that some action is complete.
                    var promise_resolved = function promise_resolved() {
                        util.log("page complete promise resolved");
                        page.evaluate(context_cb, result_cb);
                    };
                    var promise_rejected = function promise_rejected() {
                        util.log("page complete promise rejected"); 
                        done();
                    };
                    options.complete_promise.then(promise_resolved, promise_rejected);
                    return;
                }

                page.evaluate(context_cb, result_cb);
            });
        });
   
   });
};

describe("test a browser interacting with a crypton server", function() {
    this.timeout(500000);
    before(function () { 
        util.log("before");
        app.start();     
    });
    after(function () {
        util.log("after");
    });
    beforeEach(function() {
        // reset the test configuration before every test
        test_config = _.clone(base_test_config);
        client_complete_callback = null;
    });
    it("examine crypton client object", function (done) {
        // run in the context of the crypton webpage
        var context_cb = function context_cb() {
            //console.log("context starting");
            var properties = [];
            var result = {
                "abc": "def",
                "crypton_properties": properties 
            };
            result.have_crypton = !!this.crypton;
            if (result.have_crypton) {
                for (var prop in crypton) {
                    properties.push(prop);
                }
            }
            //console.log("context returning");
            return result;
        };
        // process the result from the context_cb
        var result_cb = function result_cb(err, result) {
            util.log("result starting");
            if (err) { return done(err); }
            util.log(util.inspect(result));
            result.crypton_properties.should.include("url");
            result.crypton_properties.should.include("host");
            result.crypton_properties.should.include("port");
            result.crypton_properties.should.include("version");
            done();
        };
        browser(done, crypton_url, context_cb, result_cb);
    });
    it("loading infrastructure pages for client tests", function (done) {
        test_config.name = "load_test_config";
        fs.existsSync(client_test_filepath(test_config.name)).should.be.true;
        var context_cb = function context_cb() {
            //console.log(JSON.stringify(crypton_test_config));
            //return { "done": crypton_test_config.name }; 
            return crypton_test_config;
        };
        var result_cb = function result_cb(err, result) {
            //util.log("result starting");
            if (err) { return done(err); }
            //util.log(util.inspect(result));
            result.host.should.equal(crypton_host);
            result.port.should.equal(crypton_port);
            result.name.should.equal(test_config.name);
            done();
        };
        browser(done, crypton_test_url, context_cb, result_cb);
    });
    it("round trip data return from browser", function (done) {
        // this tests that we can start a browser instance, get it to load our
        // test URL, load our test javascript code, and from there trigger a
        // GET request to /client_test/COMPLETE to signify that we are done.
        test_config.name = "browser_round_trip";
        fs.existsSync(client_test_filepath(test_config.name)).should.be.true;

        client_complete_callback = function client_complete_callback () {
            util.log("browser posted back to COMPLETE");
            done();
        };
        var context_cb = function context_cb() {
            //console.log(JSON.stringify(crypton_test_config));
            //return { "done": crypton_test_config.name }; 
            return crypton_test_result;
        };
        var result_cb = function result_cb(err, result) {
            util.log("result starting");
            util.log(util.inspect(result));
            if (err) { return done(err); }
        };
        var complete_cb = function complete_cb() {
            util.log("COMPLETE signaled");
            done();
        };
        browser(done, crypton_test_url, context_cb, result_cb);
    });
    it("wait on COMPLETE signal to collect browser results", function (done) {
        // this tests that we can start a browser instance, get it to load our
        // test URL, load our test javascript code, and from there trigger a
        // GET request to /client_test/COMPLETE to signify that we are done.

        // uses the same test code as above. the difference is we don't call
        // the browser context function until after the browser has signaled
        // complete.
        test_config.name = "browser_round_trip";
        fs.existsSync(client_test_filepath(test_config.name)).should.be.true;

        var complete_defer = Q.defer();

        client_complete_callback = function client_complete_callback () {
            util.log("browser posted back to COMPLETE");
            complete_defer.resolve();
        };

        // browser won't fire this until complete_defer is resolved
        var context_cb = function context_cb() {
            // retrieve the results object
            return crypton_test_result;
        };

        var result_cb = function result_cb(err, result) {
            // log the results object
            util.log("result starting");
            util.log(util.inspect(result));
            if (err) { return done(err); }
            done();
        };
        var options = { complete_promise: complete_defer.promise };
        browser(done, crypton_test_url, context_cb, result_cb, options);
    });
    it.only("generate an account", function (done) {
        test_config.name = "generate_account";
        test_config.username = new_test_username();
        test_config.passphrase = "password";
        util.log(client_test_filepath(test_config.name));
        fs.existsSync(client_test_filepath(test_config.name)).should.be.true;

        var complete_defer = Q.defer();

        client_complete_callback = function client_complete_callback () {
            util.log("browser posted back to COMPLETE");
            complete_defer.resolve();
        };

        var context_cb = function context_cb() {
            //console.log(JSON.stringify(crypton_test_config));
            //return { "done": crypton_test_config.name }; 
            return crypton_test_result;
        };

        var result_cb = function result_cb(err, result) {
            util.log("result starting");
            if (err) { return done(err); }
            util.log(util.inspect(result));
            done();
        };
        var options = { complete_promise: complete_defer.promise };
        browser(done, crypton_test_url, context_cb, result_cb, options);
    });
});
