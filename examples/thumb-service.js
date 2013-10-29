
var net = require('net');
var actorify = require('..');

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

console.log('server listening on 3000');