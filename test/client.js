var util = require("util");
var should = require("should");
var app = require("../server");
var _ = require("underscore");

var phantom = require('node-phantom');

var crypton_host = "crypton-dev.local"
var crypton_port = "2013"
var crypton_page = "/public/crypton.html"; 
var crypton_url = "http://" + crypton_host + ":" + crypton_port + crypton_page;

var new_test_username = function new_test_username() {
    var now = new Date();
    return "user_" + now.getTime();
};

// utility function to run a callback in the context of a browser at URL, then
// run a result callback.  will instead run run done(err) if we fail early.
var browser = function browser(done, url, context_cb, result_cb) {
    phantom.create(function(err, ph) { 
        if (err) { return done(err); };
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
}

describe("test a browser interacting with a crypton server", function() {
    before(function () { 
        util.log("before");
        app.start();     
    });
    after(function () {
        util.log("after");
    });
    it("load a browser and examine crypton client object", function (done) {
        // run in the context of the crypton webpage
        var context_cb = function context_cb() {
            console.log("context starting");
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
            console.log("context returning");
            return result;
        }
        // process the result from the context_cb
        var result_cb = function result_cb(err, result) {
            util.log("result starting");
            if (err) { return done(err); };
            util.log(util.inspect(result));
            result.crypton_properties.should.be.ok;
            result.crypton_properties.should.include("url");
            result.crypton_properties.should.include("host");
            result.crypton_properties.should.include("port");
            result.crypton_properties.should.include("version");
            done();
        }
        browser(done, crypton_url, context_cb, result_cb);
    });
});



