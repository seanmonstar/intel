/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const os = require('os');
const path = require('path');

const intel = require('../');

const NOW = Date.now();
var counter = 1;
function tmp() {
  return path.join(os.tmpDir(),
      'intel-' + NOW + '-' + process.pid + '-' + (counter++));
}

/*
function bytes(x) {
  var b = new Buffer(x);
  b[0] = '<'.charCodeAt(0);
  b[b.length - 1] = '>'.charCodeAt(0);
  b.fill('a', 1, b.length - 1);
  return b.toString();
}*/

module.exports = {
  'Handler': {
    'constructor': {
      'should accept options': function() {
        var h = new intel.Handler({ level: intel.ERROR });
        assert.equal(h.level, intel.ERROR);
      },
      'should accept a level': function() {
        var h = new intel.Handler(intel.WARN);
        assert.equal(h.level, intel.WARN);
      }
    },
    'handle': {
      'requires emit to accept a callback argument': function() {
        var h = new intel.Handler();
        h.emit = function(){};

        assert.throws(h.handle.bind(h), function(err) {
          return err.message === 'Handler.emit requires a callback argument';
        });

        h = new intel.Handler();
        h.emit = function(record, callback){
          record = callback;
        };
        assert.doesNotThrow(h.handle.bind(h));
      }
    },
    'emit': {
      'must be overriden by subclasses': function() {
        var h = new intel.Handler();
        assert.throws(h.emit);
      }
    }
  },
  'Stream': {
    'constructor': {
      'should accept options': function() {
        var stream = {};
        var handler = new intel.handlers.Stream({
          level: intel.INFO,
          stream: stream
        });

        assert.equal(handler.level, intel.INFO);
        assert.equal(handler._stream, stream);
      },
      'should accept just a stream': function() {
        var stream = {};
        var handler = new intel.handlers.Stream(stream);

        assert.equal(handler.level, intel.NOTSET);
        assert.equal(handler._stream, stream);
      }
    },
    'emit': {
      'should write message to stream': function(done) {
        var out;
        var stream = {
          write: function(msg, fn) {
            out = msg;
            fn();
          }
        };

        var handler = new intel.handlers.Stream(stream);
        handler.handle({ message: 'foo' }).then(function() {
          assert.equal(out, 'foo\n');
          done();
        });
      },
      'should wait for flush on slow streams': function(done) {
        var out;
        var stream = new EventEmitter();
        stream.write = function write(data, fn) {
          setTimeout(function() {
            out = data;
            fn();
          }, 1);
        };
        var handler = new intel.handlers.Stream(stream);
        handler.handle({ message: 'secret' }).then(function() {
          assert.equal(out, 'secret\n');
        }).done(done);
      }
    }
  },
  'File': {
    'constructor': {
      'should accept options': function() {
        var filename = tmp();
        var handler = new intel.handlers.File({
          level: intel.WARN,
          file: filename
        });

        assert.equal(handler.level, intel.WARN);
        assert.equal(handler._file, filename);
      },
      'should accept a filename': function() {
        var filename = tmp();
        var handler = new intel.handlers.File(filename);

        assert.equal(handler._file, filename);
      }
    },
    'handle': {
      'should write to the file': function(done) {
        var filename = tmp();
        var handler = new intel.handlers.File(filename);
        handler.handle({ message: 'recon' }).then(function() {
          fs.readFile(filename, function(err, contents) {
            assert.ifError(err);
            assert.equal(contents.toString(), 'recon\n');
            done();
          });
        }).finally(function() {
          handler.close();
        }).done();
      }
    }
  },
  'RotatingFileHandler': {
    'handle': {
      /*skip
      'with maxSize should create new files': function(done) {
        var filename = tmp();
        var handler = new intel.handlers.Rotating({
          file: filename,
          maxSize: 512
        });

        assert.equal(handler._file, filename);
        handler.handle({ message: bytes(500) }).then(function() {
          return handler.handle({ message: bytes(50) });
        }).then(function() {
          assert.equal(handler._file, filename);
        }).done(done);
      }*/
    }
  }
};
