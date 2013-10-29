
var actorify = require('..');
var net = require('net');

// server

net.createServer(function(sock){
  var actor = actorify(sock);

  actor.on('ping', function(){
    actor.send('pong');
  });

  actor.on('marco', function(reply){
    reply(null, 'polo');
  });
}).listen(4000);

// benchmarks

var sock = net.connect(4000);
var actor = actorify(sock);

suite('actorify', function(){
  bench('.send()', function(next){
    actor.send('ping');
    actor.once('pong', next);
  })

  bench('.send() callback', function(next){
    actor.send('marco', next);
  })
})
