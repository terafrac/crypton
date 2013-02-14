var middleware = module.exports = {};

middleware.verifySession = function (req, res, next) {
  var id = req.headers['session-identifier'];
  req.session = req.sessionStore.sessions[id]; // can we exploit this?

  if (req.session.accountId) {
    next();
    return;
  }

  res.send({
    success: false,
    error: 'Invalid session'
  });
};
