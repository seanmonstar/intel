/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const util = require('util');

const intel = require('../');
const consoleLib = require('./lib/console');

var spy = new intel.handlers.Null();
spy.handle = function(record) {
  this._lastRecord = record;
  return intel.handlers.Null.prototype.handle.call(this, record);
};

var prevLog;

module.exports = {

  'console': {
    'before': function() {
      intel.addHandler(spy);
      prevLog = console.log;
      // not passing root means this file becomes root.
      // which means dirname.basename, or test.console
      intel.console();
    },
    'can inject into global scope': function() {
      console.warn('test');
      
      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.message, 'test');
    },
    'can generate a name': function() {
      console.log('foo');
      assert.equal(spy._lastRecord.name, 'test.console');

      consoleLib('bar');
      assert.equal(spy._lastRecord.name, 'test.lib.console');
    },
    'after': function() {
      intel.console.restore();
      assert.equal(console.log, prevLog);
      intel._handlers = [];
    }
  }

};
