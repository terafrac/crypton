"use strict";

var util = require("util")
  , assert = require('assert');

util.log("lib account tests");

describe("account lib functions", function () {
  it("should not fail", function () { assert(true); });
  it("should suceed in creating a new unique account");
  it("should error creating a dupe account");
  it("return account for lookup of existing account");
  it("return error on lookup a non-existing account");
  it("return an auth challenge an existing account");
  it("verify a valid auth challenge answer");
  it("refuse an invalid auth challenge answer");
  it("return an error for auth to non existing account");
  it("update an existing account with a new password");
  it("mark an existing account as deleted");
  it("error trying to auth to a deleted account");
});
