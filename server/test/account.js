/* Crypton Server, Copyright 2013 SpiderOak, Inc.
 *
 * This file is part of Crypton Server.
 *
 * Crypton Server is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton Server is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton Server.  If not, see <http://www.gnu.org/licenses/>.
*/

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
