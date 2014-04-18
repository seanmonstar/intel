/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const stacktrace = require('stack-trace');
const Symbol = require('symbol');

const LEVELS = require('./levels');

const STACK_SYMBOL = Symbol();
const UNCAUGHT_SYMBOL = Symbol();
const LOG_VERSION = 1; // increment when log format changes
const HOSTNAME = require('os').hostname();

const SLICE = function slice(arr, index) {
  return Array.prototype.slice.call(arr, index);
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

function Message(args) {
  this.args = args;
}

Message.prototype = {
  toString: function toString() {
    if (!this._message) {
      var args = this.args;
      var message = args[0];
      var isString = typeof message === 'string';
      if (!isString || args.length > 1) {
        var argsCopy = args;
        if (!isString) {
          // TODO: remove once nodejs util.format doesn't inspect strings
          // when first arg is non-string lands
          // https://github.com/joyent/node/pull/6393
          argsCopy = SLICE(args);
          argsCopy.unshift(util.inspect(argsCopy.shift()));
        }
        message = util.format.apply(null, argsCopy);
      }
      this._message = message;
    }
    return this._message;
  },
  toJSON: function toJSON() {
    return this.args;
  }
};

function Record(name, level, args) {
  var trace;
  var isErr;
  var i = args.length;
  while (i--) {
    if (args[i] && ((isErr = util.isError(args[i])) || args[i][STACK_SYMBOL])) {
      trace = args[i];
      break;
    }
  }

  this.name = name;
  this.level = level;
  this.levelname = LEVELS.getLevelName(level);
  this.timestamp = new Date();
  this.message = new Message(args);
  this.stack = trace ? stack(trace) : undefined;
  this.exception = isErr;
  this.uncaughtException = isErr ? trace[UNCAUGHT_SYMBOL] : undefined;
  this.pid = process.pid;
  this.host = HOSTNAME;
  this.v = LOG_VERSION;
}

Record._STACK_SYMBOL = STACK_SYMBOL;
Record._UNCAUGHT_SYMBOL = UNCAUGHT_SYMBOL;
module.exports = Record;
