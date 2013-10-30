
# actorify

  Turn any duplex stream into an actor. Built on the the [AMP](https://github.com/visionmedia/node-amp) protocol
  for opaque binary and javascript argument support.

  Actors are similar to traditional RPC however they are isolated units of communication, an actor receives and sends zero or more messages to and from 
  its peer with bi-directional messaging. Typical RPC is done at the process-level,
  meaning in order to work with data coupled with an identifier such as a user id 
  that the id must be passed each request, whereas an actor may retain this state.

## Features

 - fast
 - clean api
 - json support
 - request timeouts
 - opaque binary support
 - simple flexible protocol
 - bi-directional messaging
 - request/response support

## Installation

```
$ npm install actorify
```

## Guide

### Example

  Simple hello world PING/PONG example:

```js
var net = require('net');
var actorify = require('actorify');

// server

net.createServer(function(sock){
  var actor = actorify(sock);

  actor.on('ping', function(){
    console.log('PING');
    actor.send('pong');
  });
}).listen(3000);

// client

var sock = net.connect(3000);
var actor = actorify(sock);

setInterval(function(){
  actor.send('ping');
  actor.once('pong', function(){
    console.log('PONG');
  });
}, 300);
```

  Sending a single request with multiple async responses,
  also illustrates how arguments may be primitives, json objects,
  or opaque binary such as sending an image over the wire for
  resizing, receiving multiple thumbnail blobs and their 
  respective size:

```js
var net = require('net');
var actorify = require('actorify');

// client

net.createServer(function(sock){
  var actor = actorify(sock);

  var img = new Buffer('faux data');

  actor.on('image thumbnails', function(img, sizes){
    console.log('%s byte image -> %s', img.length, sizes.join(', '));
    sizes.forEach(function(size){
      actor.send('thumb', size, new Buffer('thumb data'));
    });
  });
}).listen(3000);

// client

setInterval(function(){
  var sock = net.connect(3000);
  var actor = actorify(sock);

  console.log('send image for thumbs');
  var img = new Buffer('faux image');
  actor.send('image thumbnails', img, ['150x150', '300x300']);

  actor.on('thumb', function(size, img){
    console.log('thumb: %s', size);
  });
}, 500);
```

  You may also associate callbacks with an actor message, effectively
  turning it into a traditional RPC call:

```js
actor.send('get user', 'tobi', function(err, user){
  
});
```

### Timeouts

  When performing a request you may optionally timeout the response,
  after which an `Error` will be passed to the callback and any subsequent
  response will be ignored.

  The argument may be numeric milliseconds or represented as a string such
  as "5s", "10m", "1 minute", "30 seconds", etc. By default there is __no__
  timeout.

```js
actor.send('hello', function(err, res){
  
}).timeout('5s');
```

## Benchmarks

  Benchmarks on my first generation MBP Retina with node 0.11.x.
  Real results are likely higher since having the 
  producer on the same machine as the consumer makes
  results misleading.

  With __64b__ messages:

```
      min: 56,818 ops/s
     mean: 159,207 ops/s
   median: 138,888 ops/s
    total: 1,376,188 ops in 8.644s
  through: 1.52 mb/s
```

  With __1kb__ messages:

```
      min: 56,179 ops/s
     mean: 153,919 ops/s
   median: 142,857 ops/s
    total: 909,974 ops in 5.912s
  through: 150.31 mb/s
```

  With __10kb__ messages:

```
      min: 11,389 ops/s
     mean: 64,167 ops/s
   median: 64,102 ops/s
    total: 352,025 ops in 5.486s
  through: 626.64 mb/s
```

 With __32kb__ messages:

```
      min: 7,032 ops/s
     mean: 14,269 ops/s
   median: 23,584 ops/s
    total: 86,329 ops in 6.05s
  through: 445.91 mb/s
```


# License

  MIT
  