cipolla
=======

NodeJS stack for resilient web-apps (with [forever](https://github.com/nodejitsu/forever)-[clusters](http://nodejs.org/api/cluster.html)-[connect](http://www.senchalabs.org/connect/)-[urlrouter](https://github.com/fengmk2/urlrouter)-[domain](http://nodejs.org/api/domain.html)-[httboom](https://github.com/plasticpanda/httboom))

> «per me è la cipolla» ~Pedro  
> https://www.youtube.com/watch?v=VRvTFWjwuPc

![Imgur](http://i.imgur.com/oeMGr0o.jpg)


## Abstract

Writing **solid error-proof web applications** in nodejs is sometimes hard; we've built this wrapper to simplify our job of running, monitoring and maintaining business-critical applications.  
It's not designed to be flexible but, instead, to fit perfectly our tools and developing process.  
If you need to use library ```b``` instead of ```a``` feel free to fork this repo.


## Stack

* **Forever** to automatically restart the application on crash or code changes
* **Cluster** to handle worker crashes and *take advantage of multi-core systems*
* **Connect** as the HTTP middleware, plus:
    *  [expresssucks](https://gist.github.com/lusentis/7216186)
    *  [urlrouter](https://github.com/fengmk2/urlrouter)
* **Domains** to handle unexpected errors / throws
* **HTTBoom** to handle user and application errors


## Install

    npm -S install cipolla


## Use

```javascript
var cipolla = require('cipolla');

var myapp = cipolla({
  name: 'your-application-name',
  port: process.env.PORT || 3000,
  logentriesAPIKey: 'xxx',
  cwd: __dirname  // directory to watch for changes
                  // (put in .foreverignore patterns that should be ignored)
}, function (app) {

  app.get('/', function (req, res, next) { 
    // ... see examples/app.js for a working example ...
  });
});
```

You should create an ```error.jade``` template to display *User and Application Errors* (see ```examples/views/error.jade```).


#### Env: production

Then, to start your application in production and run it forever, watching for file changes, simply use:
```
NODE_ENV=production nohup node app.js &
```

```nohup``` ensures the process will not be killed when you close the shell.


#### Env: development

When ```NODE_ENV !== 'production'``` only a single worker is started and files are **not watched** for changes (use ```supervisor``` or ```forever``` yourself).


## License

MIT
