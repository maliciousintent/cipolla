/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */
'use strict';

var cipolla = require('../')
  , logentries = require('coolog-appender-logentries')(process.env.LOGENTRIES_APIKEY)
  , coolog = require('coolog')
  , logger
  ;

cipolla.coolog.addChannel({ name: 'cipolla', level: 'debug', appenders: ['console', logentries] });

coolog.addChannel({ name: 'root', level: 'debug', appenders: ['console', logentries] });
logger = coolog.logger('app.js', 'root');

logger.log('fooo');
logger.log('apikey', process.env.LOGENTRIES_APIKEY);


if (process.env.NODE_ENV === 'production' && !process.env.CIPOLLA_FOREVER) {
  // in production & if not already forever-d
  cipolla.forever('app.js', __dirname);
  
} else {
  
  var router = new cipolla.Dispatcher(__dirname);
  
  cipolla({
    name: 'allenatori',
    port: process.env.PORT || 3000,
    cwd: __dirname,
    dispatcher: router
  });
  
  router.route('/', { get: 'api.index' });
  router.route('/:pippo', { get: 'api.foo' });
  router.route('/fail', 'api.fail');
}
