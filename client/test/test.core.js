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
      });
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
