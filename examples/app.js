/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */
'use strict';

var cipolla = require('../')
  , logentries = require('coolog-appender-logentries')(process.env.LOGENTRIES_APIKEY)
  , coolog = require('coolog')
  , logger
  ;

// Add a logging configuration for the 'cipolla' channel
// all logs by cipolla module will go there
cipolla.coolog.addChannel({ name: 'cipolla', level: 'debug', appenders: ['console', logentries] });

// Logging configuration for this example
// i.e. the root logger
coolog.addChannel({ name: 'root', level: 'debug', appenders: ['console', logentries] });
logger = coolog.logger('app.js', 'root');


if (process.env.NODE_ENV === 'production' && !process.env.CIPOLLA_FOREVER) {
  // If we are in a production env the app will be handled by
  // forever-monitor, watching for changes and restarting on app crash
  cipolla.forever('app.js', __dirname);
  
} else {
  // Instantiate the cipolla router
  var router = new cipolla.Dispatcher(__dirname);
  
  cipolla({
    name: 'cipolla',
    port: process.env.PORT || 3000,
    cwd: __dirname,
    dispatcher: router
  });
  
  // Routes configuration, the method, if not provided, defaults to GET
  // api.index will load the "index" function from the "api.js" module;
  // module paths are relative to the __dirname provided above.
  // 
  // The router module is part of https://github.com/fengmk2/urlrouter
  // and Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
  // 
  router.route('/', { get: 'api.index' });
  router.route('/:pippo', { get: 'api.foo' });
  router.route('/fail', 'api.fail');
}
