/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const util = require('util');

const dbug = require('dbug')('intel:logger');
const Promise = require('bluebird');
const stacktrace = require('stack-trace');

const LEVELS = require('./levels');
const Filterer = require('./filterer');
const Symbol = require('symbol');

const STACK_SYMBOL = Symbol();
const UNCAUGHT_SYMBOL = Symbol();

const SLICE = function slice(arr, index) {
  return Array.prototype.slice.call(arr, index);
};

var __loggers = {};
var __levelCache = {};
const ROOT = 'root';
const DIVIDER = '.';
const OTHER_DIVIDERS = /[\/\\]/g;


function getEffectiveParent(name) {
  if (name === ROOT) {
    return;
  }

  var parent;
  while (name.indexOf(DIVIDER) !== -1 && !parent) {
    name = name.substring(0, name.lastIndexOf(DIVIDER));
    parent = __loggers[name];
  }
  return parent || __loggers[ROOT];
}

function logAtLevel(level) {
  return function(msg /*, args...*/) {
    switch (arguments.length) {
    //faster cases
    case 0:
    case 1:
      return this.log(level, msg);
    case 2:
      return this.log(level, msg, arguments[1]);
    default:
      //turtles
      var args = SLICE(arguments);
      args.unshift(level);
      return this.log.apply(this, args);
    }
  };
}

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


function Logger(name) {
  if (!name) {
    name = ROOT;
  }
  name = name.replace(OTHER_DIVIDERS, DIVIDER);
  if (name in __loggers) {
    return __loggers[name];
  }
  __loggers[name] = this;
  this._name = name;

  Filterer.call(this);

  this._handlers = [];

  dbug('Logger (%s) created', name);
}
util.inherits(Logger, Filterer);

var proto = {

  //_handlers: [],

  _name: null,

  _level: null,

  _handlesExceptions: false,

  _exitOnError: true,

  propagate: true,

  setLevel: function setLevel(val) {
    var level = LEVELS.getLevel(val);
    assert(level != null, 'Cannot set level with provided value: ' + val);
    this._level = level;
    // clean __levelsCache
    for (var key in __levelCache) {
      if (key.indexOf(this._name) !== -1) {
        delete __levelCache[key];
      }
    }
    return this;
  },

  getEffectiveLevel: function getEffectiveLevel() {
    if (this._level != null) {
      return this._level;
    } else if (this._name in __levelCache) {
      return __levelCache[this._name];
    } else {
      var parent = getEffectiveParent(this._name);
      return __levelCache[this._name] = parent ?
        parent.getEffectiveLevel() :
        LEVELS.NOTSET;
    }
  },

  isEnabledFor: function isEnabledFor(level) {
    return level >= this.getEffectiveLevel();
  },

  addHandler: function addHandler(handler) {
    this._handlers.push(handler);
    return this;
  },

  removeHandler: function removeHandler(handler) {
    var index = this._handlers.indexOf(handler);
    if (index !== -1) {
      this._handlers.splice(index, 1);
    }
    return this;
  },

  removeAllHandlers: function removeAllHandlers() {
    this._handlers = [];
  },

  handleExceptions: function handleExceptions(exitOnError/* = true */) {
    this._exitOnError = exitOnError === false ? false : true;
    if (!this._uncaughtException) {
      this._uncaughtException = this.catchException.bind(this);
      this._process.on('uncaughtException', this._uncaughtException);
    }
  },

  unhandleExceptions: function unhandleExceptions() {
    this._process.removeListener('uncaughtException', this._uncaughtException);
    delete this._uncaughtException;
  },

  catchException: function catchException(err) {
    var exits = this._exitOnError;

    err[UNCAUGHT_SYMBOL] = true;
    var promise = this.critical(err);
    var logger = this;
    if (exits) {
      //XXX: wrap in timeout
      promise.then(function() {
        logger._process.exit(1);
      });
    }
  },

  makeRecord: function makeRecord(name, level, msg, args) {
    var message = msg;
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

    var i = args.length;
    var trace;
    while (i--) {
      if (args[i] && (util.isError(args[i]) || args[i][STACK_SYMBOL])) {
        trace = args[i];
        break;
      }
    }
    var isError = util.isError(trace);

    return {
      name: name,
      level: level,
      levelname: LEVELS.getLevelName(level),
      timestamp: new Date(),
      message: message,
      args: args,
      stack: trace ? stack(trace) : undefined,
      exception: isError,
      uncaughtException: isError ? trace[UNCAUGHT_SYMBOL] : undefined,
      pid: this._process.pid
    };
  },

  handle: function handle(record) {
    var promises = [];

    if (this.filter(record)) {

      var i = this._handlers.length;
      while (i--) {
        if (record.level >= this._handlers[i].level) {
          promises.push(this._handlers[i].handle(record));
        }
      }

      // if this.propagate, tell our parent
      if (this.propagate) {
        var par = getEffectiveParent(this._name);
        if (par) {
          promises.push(par.handle(record));
        }
      }

    } else {
      dbug('%s filtered message [%s]', this._name, record.message);
    }

    if (promises.length > 2) {
      return Promise.all(promises);
    } else if (promises[0]) {
      return promises[0];
    } else {
      return Promise.fulfilled();
    }
  },

  log: function log(level, msg /*, messageArs..., [callback] */) {
    level = LEVELS.getLevel(level);
    var args;
    var promise;
    var record;
    var fn;
    // if level >= this.getEffectiveLevel(), tell our handlers
    if (this.isEnabledFor(level)) {
      if (arguments.length < 3) {
        args = [msg];
      } else {
        args = SLICE(arguments, 1);
      }
      if (typeof args[args.length - 1] === 'function') {
        fn = args.pop();
      }
      record = this.makeRecord(this._name, level, msg, args);
      promise = this.handle(record);
    } else {
      promise = Promise.fulfilled();
    }


    if (fn) {
      promise = promise.done(fn);
    }

    return promise;
  },

  trace: function trace(msg) {
    var args;
    if (this.isEnabledFor(LEVELS.TRACE)) {
      var obj = new Error();
      Error.captureStackTrace(obj, trace);
      obj[STACK_SYMBOL] = true;

      var message = msg;
      if (typeof msg === 'string') {
        // [TRACE, msg, obj, ...arguments]
        args = SLICE(arguments, 1);
        message = '%s' + message;
        obj.toString = function() { return ''; };
      } else {
        args = SLICE(arguments);
        message = '%s';
        obj.toString = function() { return 'Trace'; };
      }

      args.unshift(obj);
      args.unshift(message);
      args.unshift(LEVELS.TRACE);
    } else {
      args = SLICE(arguments);
      args.unshift(LEVELS.TRACE);
    }

    return this.log.apply(this, args);
  },

  verbose: logAtLevel(LEVELS.VERBOSE),
  debug: logAtLevel(LEVELS.DEBUG),
  info: logAtLevel(LEVELS.INFO),
  warn: logAtLevel(LEVELS.WARNING),
  error: logAtLevel(LEVELS.ERROR),
  critical: logAtLevel(LEVELS.CRITICAL),

  // aliases
  warning: function warning() {
    return this.warn.apply(this, arguments);
  },

  /*jshint -W106*/ // ignore camelCase warning for this fun functions
  o_O: function o_O() {
    return this.warn.apply(this, arguments);
  },

  O_O: function O_O() {
    return this.error.apply(this, arguments);
  },

  _process: process

};

for (var prop in proto) {
  if (proto.hasOwnProperty(prop)) {
    Logger.prototype[prop] = proto[prop];
  }
}


for (var k in LEVELS) {
  if (typeof LEVELS[k] === 'number') {
    Logger[k] = Logger.prototype[k] = LEVELS[k];
  }
}

module.exports = Logger;
