/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const stacktrace = require('stack-trace');
const Symbol = require('symbol');

const LEVELS = require('./levels');
const printf = require('./utils/printf');

const STACK_SYMBOL = Symbol();
const UNCAUGHT_SYMBOL = Symbol();
const LOG_VERSION = 1; // increment when log format changes
const HOSTNAME = require('os').hostname();

const SLICE = function slice(arr, index) {
  return Array.prototype.slice.call(arr, index);
};

const HAS = function has(obj, name) {
  return Object.prototype.hasOwnProperty.call(obj, name);
};

// stack formatter helper
function stack(e) {
  return {
    toString: function() {
      // first line is err.message, which we already show, so start from
      // second line
      return e.stack.substr(e.stack.indexOf('\n'));
    },
    toJSON: function() {
      return stacktrace.parse(e);
    }
  };
}

function lazy(proto, name, fn) {
  Object.defineProperty(proto, name, {
    configure: true,
    enumerable: true,
    get: function lazyGetter() {
      var val = fn.call(this);
      return this[name] = val;
    }
  });
}

function Record(name, level, args) {
  this.name = name;
  this.level = level;
  this.levelname = LEVELS.getLevelName(level);
  this.__date = Date.now();
  this.args = args;
  this.pid = process.pid;
  this.host = HOSTNAME;
  this.v = LOG_VERSION;

  var i = args.length;
  var trace;
  var isErr = false;
  while (i--) {
    if (args[i] && ((isErr = util.isError(args[i])) ||
        (HAS(args[i], STACK_SYMBOL) && args[i][STACK_SYMBOL]))) {
      trace = args[i];
      break;
    }
  }
  this.exception = isErr;
  this.uncaughtException = isErr ? trace[UNCAUGHT_SYMBOL] : undefined;
  this.stack = trace ? stack(trace) : undefined;
}

lazy(Record.prototype, 'timestamp', function() {
  return new Date(this.__date);
});

lazy(Record.prototype, 'message', function() {
  var args = this.args;
  var message = args[0];
  var isString = typeof message === 'string';
  if (!isString || args.length > 1) {
    if (!isString) {
      args = SLICE(args);
      args.unshift('%?');
    }
    message = printf.apply(null, args);
  }
  return message;
});


Record.prototype.toJSON = function toJSON() {
  var json = {};
  for (var key in this) {
    if (key === 'message' || key.indexOf('__') === 0) {
      continue;
    } else if (key === 'args') {
      json.message = this[key];
    } else {
      json[key] = this[key];
    }
  }
  return json;
};

Record._STACK_SYMBOL = STACK_SYMBOL;
Record._UNCAUGHT_SYMBOL = UNCAUGHT_SYMBOL;
module.exports = Record;
