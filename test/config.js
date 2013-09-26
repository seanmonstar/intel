/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const os = require('os');
const path = require('path');
const util = require('util');

const intel = require('../');

const NOW = Date.now();
var counter = 1;
function tmp() {
  return path.join(os.tmpDir(),
      'intel-' + NOW + '-' + process.pid + '-' + (counter++));
}

function spy() {
  var args = [];
  var fn = function() {
    args.push(arguments);
  };
  fn.getCallCount = function() { return args.length; };
  fn.getLastArgs = function() { return args[args.length - 1]; };
  return fn;
}

function SpyHandler() {
  intel.Handler.apply(this, arguments);
  this.spy = spy();
}
util.inherits(SpyHandler, intel.Handler);
SpyHandler.prototype.emit = function spyEmit(record, callback) {
  this.spy.apply(this, arguments);
  callback();
};

var oldBasic;
var oldLevel;
module.exports = {
  'basicConfig': {
    'before': function() {
      oldBasic = intel.basicConfig;
      oldLevel = intel._level;
    },
    'root logger calls basicConfig': function(done) {
      var val;
      var stream = {
        write: function(out, cb) {
          val = out;
          cb();
        }
      };

      intel.basicConfig = function() {
        oldBasic({ stream: stream });
      };

      intel.info('danger').then(function() {
        assert.equal(val, 'root.INFO: danger\n');
        assert.equal(intel._level, oldLevel);
      }).done(done);

    },
    'only works once': function() {
      intel.basicConfig();
      assert.equal(intel._level, oldLevel);

      intel.basicConfig({ level: 'critical' });
      assert.equal(intel._handlers.length, 1);
      assert.equal(intel._level, oldLevel);
    },
    'works with file option': function() {
      var name = tmp();
      intel.basicConfig({ file: name });
      assert.equal(intel._handlers.length, 1);
      assert.equal(intel._handlers[0]._file, name);
    },
    'works with level': function() {
      intel.basicConfig({ level: 'error' });
      assert.equal(intel._level, intel.ERROR);
    },
    'works with format': function() {
      intel.basicConfig({ format: '%(foo)s'});
      assert.equal(intel._handlers[0]._formatter._format, '%(foo)s');
    },
    'afterEach': function() {
      intel.basicConfig = oldBasic;
      intel.setLevel(oldLevel);
      intel._handlers = [];
    }
  },
  'config': {
    'should be able to configure logging': function(done) {
      intel.config({
        formatters: {
          'basic': {
            'format': '%(message)s'
          },
          'foo': {
            'format': 'foo! %(levelname)s: %(message)s'
          }
        },
        handlers: {
          'null': {
            'class': SpyHandler,
            'formatter': 'foo'
          }
        },
        loggers: {
          'qqq.zzz': {
            'level': 'INFO',
            'propagate': false,
            'handlers': ['null']
          }
        }
      });

      var log = intel.getLogger('qqq.zzz');
      //TODO: not touch _private property
      var handler = log._handlers[0];
      assert.equal(log._handlers.length, 1);
      assert(!log.propagate);

      var msg = handler.format({ message: 'hi', levelname: 'BAR'});
      assert.equal(msg, 'foo! BAR: hi');

      log.debug('asdf').then(function() {
        assert.equal(handler.spy.getCallCount(), 0);

        return log.info('qwer');
      }).then(function() {
        assert.equal(handler.spy.getCallCount(), 1);
        assert.equal(handler.spy.getLastArgs()[0].message, 'qwer');
      }).done(done);
    }
  }
};
