
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var fmt = require('util').format;
var parse = require('ms');
var amp = require('amp');

/**
 * Slice ref.
 */

var slice = [].slice;

/**
 * Actor ids.
 */

var ids = 0;

/**
 * Expose `Actor`.
 */

module.exports = Actor;

/**
 * Initialize an actor for the given `Stream`.
 *
 * @param {Stream} stream
 * @api public
 */

function Actor(stream) {
  if (!(this instanceof Actor)) return new Actor(stream);
  this.parser = new amp.Stream;
  this.parser.on('data', this.onmessage.bind(this));
  stream.pipe(this.parser);
  this.stream = stream;
  this.callbacks = {};
  this.ids = 0;
  this.id = ++ids;
  Actor.emit('actor', this);
}

/**
 * Inherit from `Emitter.prototype`.
 */

Actor.prototype.__proto__ = Emitter.prototype;
Actor.__proto__ = Emitter.prototype;

/**
 * Inspect implementation.
 */

Actor.prototype.inspect = function(){
  var cbs = Object.keys(this.callbacks).length;
  return fmt('<Actor id=%d callbacks=%d>', this.id, cbs);
};

/**
 * Handle message.
 */

Actor.prototype.onmessage = function(args){
  var args = args.map(unpack);
  var self = this;

  // reply message, invoke
  // the given callback
  if ('_reply_' == args[0]) {
    args.shift();
    var id = args.shift().toString();
    var fn = this.callbacks[id];
    fn.apply(null, args);
    return;
  }

  // request method, pass
  // a trailing callback
  if (isId(args[0])) {
    var id = args.shift();
    args.push(function(){
      var args = ['_reply_', id].concat(slice.call(arguments));
      self.send.apply(self, args);
    });
  }

  this.emit.apply(this, args);
};

/**
 * Send message.
 *
 * TODO: clean up... return a Message etc
 *
 * @param {String} msg
 * @param {Mixed} ...
 * @return {Object}
 * @api public
 */

Actor.prototype.send = function(){
  if ('string' != typeof arguments[0]) throw new Error('missing message name');
  var args = slice.call(arguments);
  var last = args[args.length - 1];
  var timer;

  if ('function' == typeof last) {
    var id = 'i:' + this.ids++;
    var fn = args.pop();
    
    function callback(){
      callback = function(){};
      clearTimeout(timer);
      fn.apply(this, arguments);
    }

    this.callbacks[id] = callback;
    args.unshift(new Buffer(id));
  }

  for (var i = 0; i < args.length; i++) {
    args[i] = pack(args[i]);
  }

  var buf = amp.encode(args);
  this.stream.write(buf);

  return {
    timeout: function(ms){
      if ('string' == typeof ms) ms = parse(ms);
      timer = setTimeout(function(){
        var err = new Error('message response timeout exceeded');
        err.timeout = ms;
        callback(err);
      }, ms);
    }
  }
};

/**
 * Pack `arg`.
 *
 * @param {Mixed} arg
 * @return {Buffer}
 * @api private
 */

function pack(arg) {
  // string
  if ('string' == typeof arg) return new Buffer('s:' + arg);

  // blob
  if (Buffer.isBuffer(arg)) return arg;

  // json
  arg = 'j:' + JSON.stringify(arg);
  return new Buffer(arg);
}

/**
 * Unpack `arg`.
 *
 * @param {Buffer} arg
 * @return {Mixed}
 * @api public
 */

function unpack(arg) {
  // json
  if (isJSON(arg)) return JSON.parse(arg.slice(2));

  // string
  if (isString(arg)) return arg.slice(2).toString();
 
  // blob
  return arg;
}

/**
 * String argument.
 */

function isString(arg) {
  return 115 == arg[0] && 58 == arg[1];
}

/**
 * JSON argument.
 */

function isJSON(arg) {
  return 106 == arg[0] && 58 == arg[1];
}

/**
 * ID argument.
 */

function isId(arg) {
  return 105 == arg[0] && 58 == arg[1];
}
