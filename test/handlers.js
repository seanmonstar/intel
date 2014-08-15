/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('insist');

const intel = require('../');

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

        assert.throws(function() {
          h.emit = 1;
        }, function(err) {
          return err.message === 'emit must be a function';
        });

        h = new intel.Handler();
        assert.doesNotThrow(function() {
          h.emit = function() {};
        });
      },
      'should use filters on record': function() {
        var h = new intel.Handler();
        var lastRecord;
        h.emit = function(record){
          lastRecord = record;
        };

        var filter = new intel.Filter('foo');
        h.addFilter(filter);
        h.handle({ name: 'foo' });
        assert.equal(lastRecord.name, 'foo');
        h.handle({ name: 'foobar' });
        assert.notEqual(lastRecord.name, 'foobar');

        h.removeFilter(filter);
        h.handle({ name: 'foobar' });
        assert.equal(lastRecord.name, 'foobar');
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

        assert.equal(handler.level, intel.ALL);
        assert.equal(handler._stream, stream);
      }
    },
    'emit': {
      'should write message to stream': function() {
        var out;
        var stream = {
          write: function(msg) {
            out = msg;
          }
        };

        var handler = new intel.handlers.Stream(stream);
        handler.handle({ message: 'foo' });
        assert.equal(out, 'foo\n');
      }
    }
  },
  'File': {
    'before': function() {
      intel.handlers.File.prototype._open = function() {
        return {
          write: function(val) {
            this._val = val;
          }
        };
      };
    },
    'constructor': {
      'should accept options': function() {
        var filename = 'foo';
        var handler = new intel.handlers.File({
          level: intel.WARN,
          file: filename
        });

        assert.equal(handler.level, intel.WARN);
        assert.equal(handler._file, filename);
      },
      'should accept a filename': function() {
        var filename = 'bar';
        var handler = new intel.handlers.File(filename);

        assert.equal(handler._file, filename);
      }
    },
    'handle': {
      'should write to the file': function() {
        var filename = 'baz';
        var handler = new intel.handlers.File(filename);
        handler.handle({ message: 'recon' });
        assert.equal(handler._stream._val, 'recon\n');
      }
    }
  },
  'Console': {
    'is just a wrapper for stderr StreamHandler': function() {
      var h = new intel.handlers.Console();
      assert.equal(h._stream, process.stderr);
    }
  }
};
