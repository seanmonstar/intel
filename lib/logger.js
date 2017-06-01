/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const dbug = require('dbug')('intel:logger');

const klass = require('./utils/klass');
const LEVELS = require('./levels');
const Filterer = require('./filterer');
const Record = require('./record');
const Trace = Record._Trace;

var __loggers = {};
var __levelCache = {};
const ROOT = 'root';
const DIVIDER = '.';
const OTHER_DIVIDERS = /[\/\\]/g;

function emptyStr() { return ''; }
function traceStr() { return 'Trace'; }

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

function logNoop() {}

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
    this.critical(err);
    if (exits) {
      this._exit();
    }
  },

  _exit: function _exit() {
    this._process.exit(1);
  },

  makeRecord: function makeRecord(name, level, msg) {
    return new Record(name, level, msg);
  },

  handle: function handle(record) {
    if (this.filter(record)) {

      var i = this._handlers.length;
      while (i--) {
        if (record.level >= this._handlers[i].level) {
          this._handlers[i].handle(record);
        }
      }

      // if this.propagate, tell our parent
      if (this.propagate) {
        var par = getEffectiveParent(this._name);
        if (par) {
          par.handle(record);
        }
      }

    } else {
      dbug('%s filtered message [%s]', this._name, record.message);
    }
  },

  _log: function _log(_level, msg /*, args...*/) {
    var level = LEVELS.getLevel(_level);
    var args;
    if (arguments.length < 3) {
      args = [msg];
    } else {
      args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i + 1];
      }
    }
    var record = this.makeRecord(this._name, level, args);
    this.handle(record);
  },

  log: function log(_level /* msg, messageArs... */) {
    var level = LEVELS.getLevel(_level);
    // if level >= this.getEffectiveLevel(), tell our handlers
    if (this.isEnabledFor(level)) {
      this._log.apply(this, arguments);
    }
  },

  trace: function trace(_msg) {
    var obj = new Trace(trace);

    var slice = 0;
    var message = _msg;
    if (typeof message === 'string') {
      // [TRACE, msg, obj, ...arguments]
      slice = 1;
      message = '%s' + message;
      obj.toString = emptyStr;
    } else {
      message = '%s';
      obj.toString = traceStr;
    }

    var args = new Array(3 + arguments.length - slice);
    args[0] = LEVELS.TRACE;
    args[1] = message;
    args[2] = obj;
    for (var i = 3; i < args.length; i++) {
      args[i] = arguments[i - 3 + slice];
    }
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
