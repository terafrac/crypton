var middleware = module.exports = {};

middleware.verifySession = function (req, res, next) {
  if (req.session.accountId) {
    next();
    return;
  }

  res.send({
    success: false,
    error: 'Invalid session'
  });
};
