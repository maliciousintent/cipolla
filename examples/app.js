
var cipolla = require('../');


if (process.env.NODE_ENV === 'production' && !process.env.CIPOLLA_FOREVER) {
  // in production & if not already forever-d
  cipolla.forever('app.js', __dirname);
  
} else {
  
  
  var router = new cipolla.Dispatcher(__dirname);
  
  cipolla({
    name: 'allenatori',
    port: process.env.PORT || 3000,
    logentriesAPIKey: process.env.LOGENTIES_APIKEY,
    cwd: __dirname,
    dispatcher: router
  });
  
  router.route('/', { get: 'api.index' });
  router.route('/:pippo', { get: 'api.foo' });
  router.route('/fail', 'api.fail');
}
