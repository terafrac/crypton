var middleware = module.exports = {};

middleware.verifySession = function (req, res, next) {
  var id = req.headers['session-identifier'];

  req.sessionStore.get(id, function (err, session) {
    if (!err && session.accountId) {
      // TODO this may be a leak but it's the only
      // way to get around CORS without implementing our
      // own sessionStore
      Object.keys(session).forEach(function (i) {
        if (i == 'cookie') return;
        req.session[i] = session[i];
      });
      next();
    } else {
      res.send({
        success: false,
        error: 'Invalid session'
      });
    }
  });
};
