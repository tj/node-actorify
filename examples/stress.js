
var net = require('net');
var actorify = require('..');

// server

net.createServer(function(sock){
  var actor = actorify(sock);

  actor.on('echo', function(str){
    actor.send('result', str);
  });
}).listen(3000);

// client

var actor = actorify(net.connect(3000));

function next() {
  var n = 50;

  while (n--) actor.send('echo', 'hello');

  setImmediate(next);
}

next();
