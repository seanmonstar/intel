/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const dbug = require('dbug')('intel:logger');
const P = require('bluebird');

const klass = require('./utils/klass');
const LEVELS = require('./levels');
const Filterer = require('./filterer');
const Record = require('./record');

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

function getChildren(name) {
  var children = [];
  for (var k in __loggers) {
    if ((name === ROOT || k.indexOf(name) === 0) &&
        k !== name &&
        getEffectiveParent(k) === __loggers[name]) {
      children.push(__loggers[k]);
    }
  }
  return children;
}

function logNoop() {
  return P.fulfilled();
}

function disableLevels(logger) {
  for (var name in LEVELS) {
    if (typeof LEVELS[name] === 'number') {
      var level = LEVELS[name];
      name = name.toLowerCase();
      if (logger[name]) {
        if (logger.isEnabledFor(level)) {
          // delete any noops
          delete logger[name];
        } else {
          Object.defineProperty(logger, name, {
            configurable: true,
            value: logNoop
          });
        }
      }
    }
  }
  var children = getChildren(logger._name);
  children.forEach(function(child) {
    disableLevels(child);
  });
}

function logAtLevel(level) {
  return function(msg /*, args...*/) {
    switch (arguments.length) {
    //faster cases
    case 0:
    case 1:
      return this._log(level, msg);
    case 2:
      return this._log(level, msg, arguments[1]);
    default:
      //turtles
      var args = new Array(arguments.length + 1);
      args[0] = level;
      for (var i = 1; i < args.length; i++) {
        args[i] = arguments[i - 1];
      }
      return this._log.apply(this, args);
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
  disableLevels(this);

  Filterer.call(this);

  this._handlers = [];

  dbug('Logger (%s) created', name);
}

klass(Logger).inherit(Filterer).mixin({

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
    __levelCache = {};
    disableLevels(this);
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

    err[Record._UNCAUGHT_SYMBOL] = true;
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
    return new Record(name, level, msg, args);
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

    if (promises.length > 1) {
      return P.all(promises);
    } else if (promises[0]) {
      return promises[0];
    } else {
      return P.fulfilled();
    }
  },

  _log: function _log(level, msg /*, args...*/) {
    level = LEVELS.getLevel(level);
    var args;
    var promise;
    var record;
    var fn;
    if (arguments.length < 3) {
      args = [msg];
    } else {
      args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i + 1];
      }
    }
    record = this.makeRecord(this._name, level, args);
    promise = this.handle(record);


    if (fn) {
      promise = promise.done(fn);
    }

    return promise;
  },

  log: function log(level /* msg, messageArs... */) {
    level = LEVELS.getLevel(level);
    // if level >= this.getEffectiveLevel(), tell our handlers
    if (this.isEnabledFor(level)) {
      return this._log.apply(this, arguments);
    } else {
      return P.fulfilled();
    }
  },

  trace: function trace(msg) {
    var args;
    var obj = {};
    Error.captureStackTrace(obj, trace);
    obj[Record._STACK_SYMBOL] = true;

    //TODO: don't slice arguments!
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

    return this._log.apply(this, args);
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

});

for (var k in LEVELS) {
  if (typeof LEVELS[k] === 'number') {
    Logger[k] = Logger.prototype[k] = LEVELS[k];
  }
}

module.exports = Logger;
