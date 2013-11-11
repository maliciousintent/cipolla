/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */
'use strict';

require('sugar');
require('colors');

var forever = require('forever-monitor')
  , coolog = require('coolog')
  , boom = require('httboom')
  , swallow = require('node-swallow')
  , asciify = require('asciify')
  , connect = require('connect')
  , flash = require('connect-flash')
  , RedisStore = require('connect-redis')(connect)
  , expressSucks = require('expresssucks').expressSucks
  , nodeutil = require('util')
  , http = require('http')
  , domain = require('domain')
  , cluster = require('cluster')
  , path = require('path')
  , url = require('url')
  , Dispatcher = require('./dispatcher').Dispatcher
  ;

var IS_PRODUCTION = (process.NODE_ENV === 'production')
  , logger = coolog.logger(__filename.from(__filename.lastIndexOf('/') + 1))
  , numCPUs = (IS_PRODUCTION) ? require('os').cpus().length : 1
  ;


module.exports = function (opts_) {
  var config = {
    logentriesAPIKey: opts_.logentriesAPIKey || ''
  , redisURL: opts_.redisURL || undefined
  , middlewarefn: opts_.middlewarefn || function (app) {}
  , cwd: opts_.cwd || __dirname
  , port: opts_.port
  , name: opts_.name
  , dispatcher: opts_.dispatcher
  };
  
  coolog.keychain['coolog-appender-logentries'] = {
    key: config.logentriesAPIKey || ''
  };

  if (cluster.isMaster) {
    
    /* -~- start the workers -~- */
    
    asciify(config.name, swallow('while asciifying', function (logo) { 
    
      // verbose logging
      logger.log('Starting application'.bold.cyan, new Date().toISOString().bold.cyan);
      logger.log(logo);
      logger.debug('Environment'.bold.grey, Object.keys(process.env).join(', '));
      logger.debug('Cipolla config'.bold.grey, nodeutil.inspect(opts_));
      logger.debug('Master PID is'.bold.grey, process.pid);
      
      
      (numCPUs).times(function () {
        var worker = cluster.fork();
        logger.log(('Booting worker #' + worker.id).bold.green);
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
        , dispatcher = config.dispatcher
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
      
      dispatcher.on('404', function (req, res) {
        res.end('Not found.');
      });
      
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
          dispatcher.dispatch(req, res, next);
        });
      });
      
      app.use(connect.static(path.join(config.cwd, 'public'), { maxAge: 1000 * ((IS_PRODUCTION) ? 3600 * 24 : 0) }));
      app.use(boom.middleware(logger, function (req) {
        logger.error('> Current user is', (req.session && req.session.user) ? req.session.user._id + ' (' + req.session.user.email + ')' : '(not logged in)');
        logger.error('> Client IP is', req.ip);
      }));
      
      logger.ok('Worker #', cluster.worker.id, 'started on', new Date().toISOString().cyan);

      /* ~ Start application ~ */
      server = http.createServer(app).listen(config.port, function () {
        logger.debug('Worker #', cluster.worker.id, 'is listening on port', config.port);
      });      
      
    })();
  }
  
};


module.exports.Dispatcher = require('./dispatcher').Dispatcher;

module.exports.forever = function (mainScript, watchDirectory) {
  // wrapper around 'forever-monitor'  
  var forever_logger = coolog.logger('forever');
  
  var child = new (forever.Monitor)(mainScript, {
    max: 10,
    killTree: true,
    spinSleepTime: 10 * 1000,
    silent: false, // no silenced output
    watch: true,
    watchDirectory: watchDirectory || process.cwd(),
    env: { CIPOLLA_FOREVER: 'yes' }
  });
  
  child.on('restart', function () {
    forever_logger.error('Crashing child...');
  });

  child.on('exit', function () {
    forever_logger.error('Forever-monitored script exited after max restarts count.');
  });

  child.on('error', function (err) {
    forever_logger.error('Forever error', nodeutil.inspect(err));
  });

  child.start();
  
  return child;
};
