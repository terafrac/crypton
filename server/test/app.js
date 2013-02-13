"use strict";
/*jslint expr: true*/

describe("POST /account", function () {
  it("saves account");
  it("sets session cookie");
});

describe("GET /account/:username", function () {
  it("generates login challenge");
  it("returns bogus challenge for unknown users");
});

describe("POST /account/:username", function () {
  it("verifies login challenge answer");
  it("rejects incorrect answers");
  it("rejects answers for unknown users");
});

describe("POST /account/:username/keyring", function () {
  it("requires login");
  it("updates keyring");
});
