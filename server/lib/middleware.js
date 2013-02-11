var middleware = module.exports = {};

middleware.verifySession = function (req, res, next) {
  next();
};
