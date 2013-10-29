
var net = require('net');
var actorify = require('..');

// server

net.createServer(function(sock){
  var actor = actorify(sock);

  actor.on('uppercase', function(str, reply){
    reply(null, str.toUpperCase());
  });

  actor.on('reverse', function(str, reply){
    reply(null, str.split('').reverse().join(''));
  });
}).listen(3000);

// client

setInterval(function(){
  var actor = actorify(net.connect(3000));

  actor.send('uppercase', 'hello', function(err, str){
    if (err) throw err;
    console.log('-> %s', str);
  });

  actor.send('uppercase', 'world', function(err, str){
    if (err) throw err;
    console.log('-> %s', str);
  });

  actor.send('reverse', 'hey', function(err, str){
    if (err) throw err;
    console.log('-> %s', str);
  });
}, 200);

