
var httboom = require('httboom');
var cipolla = require('../');


if (process.env.NODE_ENV === 'production' && !process.env.CIPOLLA_FOREVER) {
  // in production & if not already forever-d
  cipolla.forever('app.js', __dirname);
  
} else {
  
  cipolla({
    name: 'sweetheart',
    port: process.env.PORT || 3000,
    logentriesAPIKey: 'xxx',
    cwd: __dirname
  }, function (app) {
    
    app.get('/', function (req, res, next) { 
      res.render('index', {});
    });
    
    app.get('/fail', function (req, res, next) {
      // oops, an error occurred!
      next(new httboom.AppError(500, 'E_SERVER_ERROR', 'Unknown server error', 'Well, actually, there is a bug right here...'));
    });
    
  });

}
