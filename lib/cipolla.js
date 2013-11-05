/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */
'use strict';

require('sugar');
require('colors');

var coolog = require('coolog')
  , logger = require('coolog').logger('worker.js')
  , boom = require('httboom')
  , swallow = require('node-swallow')
  , asciify = require('asciify')
  , cluster = require('cluster')
  , connect = require('connect')
  , flash = require('connect-flash')
  , RedisStore = require('connect-redis')(connect)
  , expressSucks = require('expresssucks').expressSucks
  , urlrouter = require('urlrouter')
  , nodeutil = require('util')
  , http = require('http')
  , domain = require('domain')
  , cluster = require('cluster')
  , path = require('path')
  , url = require('url')
  ;

var IS_PRODUCTION = (process.NODE_ENV === 'production')
  , logger = coolog.logger(__filename.from(__filename.lastIndexOf('/') + 1))
  , numCPUs = (IS_PRODUCTION) ? require('os').cpus().length : 1
  ;


module.exports = function (opts_, routeFn) {
  var config = {
    logentriesAPIKey: opts_.logentriesAPIKey || ''
  , redisURL: opts_.redisURL || undefined
  , middlewarefn: opts_.middlewarefn || function (app) {}
  , cwd: opts_.cwd || __dirname
  , port: opts_.port
  , name: opts_.name
  };
  
  coolog.keychain['coolog-appender-logentries'] = {
    key: config.logentriesAPIKey || ''
  };

  if (cluster.isMaster) {
    
    /* -~- start the workers -~- */
    
    asciify(config.name, swallow('while asciifying', function (logo) { 
    
      // verbose logging
      logger.log('Starting application', new Date().toISOString().cyan);
      logger.log(logo);
      logger.debug('Environment', Object.keys(process.env).join(', ').grey);
      logger.debug('Cipolla config', nodeutil.inspect(opts_).grey);
      logger.debug('Master PID is', (process.pid + '').grey);
      
      
      (numCPUs).times(function () {
        var worker = cluster.fork();
        logger.log('Booting worker #', worker.id);
      });

      cluster.on('disconnect', function (worker) {
        logger.error('Worker #' + worker.id + ' disconnected. Exit mode =', (worker.suicide === true) ? 'suicide' : 'normal exit');
        cluster.fork();
      });

    }));

  } else {
    
    /* -~- the worker -~- */
    
    (function _workr() {
      
      var redisStore
        , rtg
        ;

      if (config.redisURL) {
        logger.debug('RedisStore is using RedisToGo from ENV');
        rtg = url.parse(config.redisURL);
        redisStore = new RedisStore({ 
          port: rtg.port
        , host: rtg.hostname
        , pass: rtg.auth.split(':')[1]
        });
      } else {
        logger.debug('RedisStore is using local redis');
        redisStore = new RedisStore();
      }
        
      
      /* ~ Connect setup ~ */
      
      var server
        , router = urlrouter(routeFn)
        , app = connect()
        .use(connect.query())
        .use(connect.urlencoded())
        .use(connect.json())
        .use(connect.methodOverride())
        .use(connect.cookieParser('alksfdgjklf3R'))
        .use(connect.session({
          secret: 'skl8o4usnf$$lksdfaj',
          store: redisStore
        }))
        .use(flash())
        .use(expressSucks({ basedir: path.join(config.cwd, 'views') }))
        ;
      
      // load additional middlewares
      config.middlewarefn(app);
      
      app.use(function _domainWrapper(req, res, next) {
        var d = domain.create();
        d.id = 'ip' + req.ip + '#worker' + cluster.worker.id;
        
        d.add(req);
        d.add(res);
          
        d.on('error', function (e) {
          logger.error('An error occurred in domain <' + d.id + '>', e.message);
          logger.error('\t--> original message:', e.message_);
          logger.error('\t--> stack:', e.stack);
          
          try {
            var killtimer = setTimeout(function () {
              process.exit(1);
            }, 30000);
            
            logger.warn('Current worker does not accept new connection and will suicide within 30s.');
            server.close();
            cluster.worker.disconnect();
          } catch (er2) {
            logger.error('Error while handling an error. Current worker will suicide.');
            logger.error('\t--> message:', er2.message);
            logger.error('\t--> stack:', er2.stack);
            process.exit(1);
          }
        });
        
        d.run(function () {
          router(req, res, next);
        });
      });
      
      app.use(connect.static(path.join(__dirname, 'public'), { maxAge: 1000 * 3600 * 24 }));
      app.use(boom.middleware(logger, function (req) {
        logger.error('> Current user is', (req.session && req.session.user) ? req.session.user._id + ' (' + req.session.user.email + ')' : '(not logged in)');
        logger.error('> Client IP is', req.ip);
      }));
      
      logger.log('Worker #', cluster.worker.id, 'started on', new Date().toISOString().cyan);

      /* ~ Start application ~ */
      server = http.createServer(app).listen(config.port, function () {
        logger.log('Worker #', cluster.worker.id, 'is listening on port', config.port);
      });      

    })();
  }
  
};
