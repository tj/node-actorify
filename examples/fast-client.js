
var net = require('net');
var actorify = require('..');

var sock = net.connect(3000, 'localhost');
var actor = actorify(sock);
var msg = new Buffer(Array(64).join('a'));

function next() {
  var n = 50;
  while (n--) actor.send('msg', msg);
  setImmediate(next);
}

next();