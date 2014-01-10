/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const util = require('util');

const Promise = require('bluebird');
const stacktrace = require('stack-trace');

const LEVELS = require('./levels');
const Filterer = require('./filterer');

const SLICE = Array.prototype.slice;

var __loggers = {};
var ROOT = 'root';
var DIVIDER = '.';
var OTHER_DIVIDERS = /[\/\\]/g;

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
      var args = SLICE.call(arguments);
      args.unshift(level);
      return this.log.apply(this, args);
    }
  };
}

function stack(e) {
  return {
    toString: function() {
      return e.stack.substr(e.stack.indexOf('\n'));
    },
    toJSON: function() {
      var stack = stacktrace.parse(e);
      stack.shift();
      return stack;
    }
  };
}

function Logger(name) {
  Filterer.call(this);
  if (!name) {
    name = ROOT;
  }
  name = name.replace(OTHER_DIVIDERS, DIVIDER);
  if (name in __loggers) {
    return __loggers[name];
  }
  __loggers[name] = this;
  this._name = name;

  this._handlers = [];
}
util.inherits(Logger, Filterer);

var proto = {

  //_handlers: [],

  _name: null,

  _level: null,

  _handlesExceptions: false,

  _exitOnError: true,

  propagate: true,

  setLevel: function setLevel(level) {
    level = LEVELS.getLevel(level);
    assert(level != null, 'Cannot set level with provided value:' + level);
    this._level = level;
    return this;
  },

  getEffectiveLevel: function getEffectiveLevel() {
    if (this._level != null) {
      return this._level;
    } else {
      var parent = getEffectiveParent(this._name);
      if (parent) {
        return parent.getEffectiveLevel();
      } else {
        return LEVELS.NOTSET;
      }
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

    var promise = this.error(err);
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
        argsCopy = SLICE.call(args);
        argsCopy.unshift(util.inspect(argsCopy.shift()));
      }
      message = util.format.apply(null, argsCopy);
    }

    var i = args.length;
    var err;
    while (i--) {
      if (util.isError(args[i])) {
        err = args[i];
        break;
      }
    }

    return {
      name: name,
      level: level,
      levelname: LEVELS.getLevelName(level),
      timestamp: new Date(),
      message: message,
      args: args,
      stack: err ? stack(err) : undefined,
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
    if (arguments.length < 3) {
      args = [msg];
    } else {
      args = SLICE.call(arguments, 1);
    }
    var fn;
    if (typeof args[args.length - 1] === 'function') {
      fn = args.pop();
    }
    // if level >= this.getEffectiveLevel(), tell our handlers
    var promise;
    var record;
    if (this.isEnabledFor(level)) {
      record = this.makeRecord(this._name, level, msg, args);
      promise = this.handle(record);
    } else {
      promise = Promise.fulfilled();
    }


    if (fn) {
      promise = promise.then(function() {
        fn(null);
      }, function(reason) {
        fn(reason);
      });
    }

    return promise;
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
