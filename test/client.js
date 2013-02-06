var util = require("util");
var should = require("should");
var app = require("../server");
var fs = require("fs");
var _ = require("underscore");

var phantom = require('node-phantom');

var crypton_host = "crypton-dev.local";
var crypton_port = "2013";
var crypton_page = "/public/crypton.html"; 
var crypton_test_page = "/public/crypton_test.html"; 
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
    util.log("scheduling read for filepath: " + filepath);
    var readfile_callback = function readfile_callback (err, data) {
        if (err) {
            util.log("could not read: ", err); 
            process.exit(1); 
        }
        util.log("did read filepath " + filepath);
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Content-Length', data.length);
        res.end(data);
    };
    fs.readFile(filepath, null, readfile_callback);
    util.log("read scheduled");
    return readfile_callback;
});

app.get("/client_test/COMPLETE", function (req, res) {
    if (!client_complete_callback) {
        util.log("COMPLETE called w/o callback");
    }
});

// return the abs path to the js file for a named client test
var client_test_filepath = function client_test_filepath(test_name) {
    return __dirname + "/../client_test/" + test_name + ".js";
};

// create a unique username for tests
var new_test_username = function new_test_username() {
    var now = new Date();
    return "user_" + now.getTime();
};

// utility function to run a callback in the context of a browser at URL, then
// run a result callback.  will instead run run done(err) if we fail early.
var browser = function browser(done, url, context_cb, result_cb) {
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
                page.evaluate(context_cb, result_cb);
            });
        });
   
   });
};

describe("test a browser interacting with a crypton server", function() {
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
            return crypton_test_config
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
    it.only("generate an account", function (done) {
        test_config.name = "generate_account";
        test_config.username = new_test_username();
        test_config.passphrase = "password";
        fs.existsSync(client_test_filepath(test_config.name)).should.be.true;
        var context_cb = function context_cb() {
            //console.log(JSON.stringify(crypton_test_config));
            //return { "done": crypton_test_config.name }; 
            return crypton_test_config
        };
        var result_cb = function result_cb(err, result) {
            //util.log("result starting");
            if (err) { return done(err); }
            //util.log(util.inspect(result));
            result.host.should.equal(crypton_host);
            result.port.should.equal(crypton_port);
            result.name.should.equal(test_config.name);
            // done();
        };
        var complete_cb = function complete_cb() {
            done();
        };
        browser(done, crypton_test_url, context_cb, result_cb);
    });
});
