/*jshint node:true, eqnull:true, laxcomma:true, undef:true, indent:2, camelcase:false */
'use strict';

var EventEmitter = require('events').EventEmitter
  , nodeutil = require('util')
  , path = require('path')
  , routerlib = require('./router')
  ;


module.exports.Dispatcher = Dispatcher;

function Dispatcher(basedir) {
  this.routes = [];
  this.basedir = basedir || __dirname;
}
nodeutil.inherits(Dispatcher, EventEmitter);


Dispatcher.prototype.route = function(path, controllers) {
  if (typeof controllers !== 'string' && typeof controllers !== 'object') {
    throw new Error('Invalid route controller.');
  }
  
  if ('string' === typeof controllers) {
    controllers = { get: controllers };
  }
  
  this.routes.push({
    path: path
  , router: routerlib.createRouter(path)
  , controllers: controllers
  });
};


Dispatcher.prototype.dispatch = function(req, res, next) {
  var matches = null
    , match_route = null
    , ctrlr_s
    , ctrlr
    ;
  
  for (var i = 0; i < this.routes.length; i++) {
    matches = this.routes[i].router.match(req.url);
    
    if (matches !== null) {
      match_route = this.routes[i];
      break;
    }
  }
  
  if (match_route === null) {
    this.emit('404', req, res);
    return;
    
  } else {
    ctrlr_s = match_route.controllers[req.method.toLowerCase()];
    
    try {
      ctrlr = require(path.join(this.basedir, ctrlr_s.split('.')[0] + '.js'));
    } catch (e) {
      throw new Error('Controller module not found: ' + path.join(this.basedir, ctrlr_s.split('.')[0] + '.js'));
    }
    
    ctrlr = ctrlr[ctrlr_s.split('.')[1]];
    
    if (typeof ctrlr !== 'function') {
      this.emit('404', req, res);
      return;
    }
    
    ctrlr.call(null, req, res, next);
    return;
  }
  
};

