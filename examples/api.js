
var httboom = require('httboom');


module.exports.index = function (req, res) {
  res.end('Index');
};


module.exports.fail = function (req, res, next) {
  next(new httboom.AppError(500, 'E_SERVER_ERROR', 'Boom', 'Application error'));
};

module.exports.foo = function (req, res) {
  console.log('Querystring "foo" parameter is', req.param('foo'));
  res.end('foo: ' + req.param('pippo'));
};

