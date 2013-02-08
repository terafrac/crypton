describe('core functionality', function () {
  describe('account generation', function () {
    it('should exist', function () {
      assert(typeof crypton.generateAccount == 'function');
    });
    
    it('should emit step callbacks', function (done) {
      crypton.generateAccount('user', 'pass', done);
    });

    it('emit a final callback with user object', function (done) {
      crypton.generateAccount('user', 'pass', function () {
        console.log('step');
      }, function (err, user) {
        assert(err == null, 'error is null');
        assert(user != undefined, 'user object is returned');
        done();
      });
    });
  });

  describe('account authorization', function () {
    it('should exist', function () {
      assert(typeof crypton.authorize == 'function');
    });
  });
});
