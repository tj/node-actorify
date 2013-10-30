
var Stream = require('stream').PassThrough;
var assert = require('assert');
var actorify = require('..');
var net = require('net');

describe('Actor', function(){
  it('should emit "actor" for visibility', function(done){
    actorify.once('actor', function(actor){
      assert('Actor' == actor.constructor.name);
      done();
    });

    var stream = new Stream;
    var actor = actorify(stream);
  })
})

describe('Actor#inspect()', function(){
  it('should inspect the actor', function(){
    var stream = new Stream;
    var actor = actorify(stream);
    actor.inspect().should.equal('<Actor id=2 callbacks=0>');
  })
})

describe('Actor#send()', function(){
  describe('with no message name', function(){
    it('should throw an error', function(done){
      var stream = new Stream;
      var actor = actorify(stream);

      try {
        actor.send();
      } catch (err) {
        err.message.should.equal('missing message name');
        done();
      }
    })
  })

  describe('with no arguments', function(){
    it('should emit nothing', function(done){
      var stream = new Stream;
      var actor = actorify(stream);

      actor.on('hello', function(){
        done();
      });

      actor.send('hello');
    })
  })

  describe('with many arguments', function(){
    it('should emit all arguments', function(done){
      var stream = new Stream;
      var actor = actorify(stream);

      actor.on('thumb', function(size, img){
        size.should.equal('150x150');
        img.toString().should.equal('data');
        done();
      });

      actor.send('thumb', '150x150', new Buffer('data'));
    })
  })

  describe('with a callback', function(){
    it('should map responses back', function(done){
      // server
      net.createServer(function(sock){
        var actor = actorify(sock);

        actor.on('reverse', function(str, reply){
          reply(null, str.split('').reverse().join(''));
        });
      }).listen(4040);

      // client
      var actor = actorify(net.connect(4040));

      actor.send('reverse', 'hey', function(err, str){
        if (err) throw err;
        str.should.equal('yeh');
        done();
      });
    })

    it('should work with no args', function(done){
      // server
      net.createServer(function(sock){
        var actor = actorify(sock);

        actor.on('ping', function(reply){
          reply(null, 'pong');
        });
      }).listen(4050);

      // client
      var actor = actorify(net.connect(4050));

      actor.send('ping', function(err, str){
        if (err) throw err;
        str.should.equal('pong');
        done();
      });
    })
  })

  describe('with strings', function(){
    it('should pass strings', function(done){
      var stream = new Stream;
      var actor = actorify(stream);

      actor.on('hello', function(str){
        str.should.equal('world');
        done();
      });

      actor.send('hello', 'world');
    })
  })

  describe('with objects', function(){
    it('should pass objects', function(done){
      var stream = new Stream;
      var actor = actorify(stream);

      actor.on('hello', function(obj){
        obj.foo.should.equal('bar');
        obj.bar.should.equal('baz');
        done();
      });

      actor.send('hello', { foo: 'bar', bar: 'baz' });
    })
  })

  describe('with buffers', function(){
    it('should pass buffers', function(done){
      var stream = new Stream;
      var actor = actorify(stream);

      actor.on('hello', function(buf){
        assert(Buffer.isBuffer(buf));
        buf.toString().should.equal('world');
        done();
      });

      actor.send('hello', new Buffer('world'));
    })
  })

  describe('with a timeout', function(){
    describe('when exceeded', function(){
      it('should pass an error', function(done){
        var stream = new Stream;
        var actor = actorify(stream);

        actor.on('hello', function(fn){

        });

        actor.send('hello', function(err){
          err.timeout.should.equal(50);
          err.message.should.equal('message response timeout exceeded');
          done();
        }).timeout(50);
      })

      it('should ignore responses', function(done){
        var stream = new Stream;
        var actor = actorify(stream);

        actor.on('hello', function(fn){
          setTimeout(function(){
            fn(null, 'world');
          }, 100);
        });

        actor.send('hello', function(err){
          err.timeout.should.equal(50);
          err.message.should.equal('message response timeout exceeded');
          done();
        }).timeout(50);
      })
    })

    describe('otherwise', function(){
      it('should cancel the timeout', function(done){
        var stream = new Stream;
        var actor = actorify(stream);

        actor.on('hello', function(fn){
          setTimeout(function(){
            fn(null, 'world');
          }, 10);
        });

        actor.send('hello', function(err, res){
          assert(!err);
          res.should.equal('world');
          done();
        }).timeout(150);
      })
    })
  })

  it('should support multiple messages', function(done){
    var stream = new Stream;
    var actor = actorify(stream);

    var n = 0;

    actor.on('thumb', function(size){
      switch (n++) {
        case 0:
          size.should.equal('150x150');
          break;

        case 1:
          size.should.equal('300x300');
          break;

        case 2:
          size.should.equal('600x600');
          done();
          break;
      }
    });

    actor.send('thumb', '150x150');
    actor.send('thumb', '300x300');
    actor.send('thumb', '600x600');
  })
})