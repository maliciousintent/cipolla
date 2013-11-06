cipolla
=======

NodeJS stack for resilient web-apps (with forever-clusters-connect-urlrouter-domains-httboom)

> «secondo me è la cipolla» ~Pedro  
> https://www.youtube.com/watch?v=VRvTFWjwuPc

![Imgur](http://i.imgur.com/oeMGr0o.jpg)


## Abstract

Writing solid error-proof nodejs web applications is sometimes hard; we've built this wrapper to simplify our job of running, monitoring and maintaining business-critical applications.  
It's not designed to be flexible but, instead, to fit perfectly with our tools and developing process.  
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

See ```examples/``` for a full working example,

You should create an ```error.jade``` template to display *User and Application Errors* (see ```example/views/templates/error.jade```).

#### Env: production

Then, to start your application in **PRODUCTION** and run it forever, watching for file changes, simply use:
```
NODE_ENV=production nohup node app.js &
```

#### Env: development

When ```NODE_ENV !== 'production'``` only a single worker is started and files are **not watched** for changes (use supervisor or forever yourself).


## License

MIT
