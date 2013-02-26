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
describe('core functionality', function () {
  describe('account generation', function () {
    var err;
    var user;
    var step;
    var steps = 0;

    before(function (done) {
      crypton.generateAccount('user', 'pass', function () {
        step = true;
        console.log(++steps);
      }, function () {
        console.log('done');
        err = arguments[0];
        user = arguments[1];
        done();
      }, {keypairBits: 512, debug: true, save: false});
    });

    it('should exist', function () {
      assert(typeof crypton.generateAccount == 'function');
    });
    
    it('should emit step callbacks', function (done) {
      done();
    });

    it('should generate the correct data', function () {
      assert(err == null, 'error is null');
      assert(user != undefined, 'user object is returned');
    });
  });

  describe('account authorization', function () {
    it('should exist', function () {
      assert(typeof crypton.authorize == 'function');
    });
  });
});
