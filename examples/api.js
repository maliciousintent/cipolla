
var httboom = require('httboom');


module.exports.index = function (req, res) {
  res.end('Index');
};


module.exports.fail = function (req, res, next) {
  next(new httboom.AppError(500, 'E_SERVER_ERROR', 'Boom', 'Application error'));
};
