/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chalk = require('chalk');
const dbug = require('dbug')('intel');

const LEVELS = require('./levels');
const Logger = require('./logger');
const Handler = require('./handlers/handler');
const handlers = require('./handlers');
const Formatter = require('./formatter');
const Trace = require('./record')._Trace;

function emptyStr() { return ''; }
function traceStr() { return 'Trace'; }

function trace(_msg) {
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
  args[0] = exports.TRACE;
  args[1] = message;
  args[2] = obj;
  for (var i = 3; i < args.length; i++) {
    args[i] = arguments[i - 3 + slice];
  }
  return this._log.apply(this, args);
}

const origLevels = Object.freeze({
  levels: {
    trace: {
      level: 10,
      color: chalk.bold.bgBlue,
      fn: trace
    },
    verbose: {
      level: 20,
      color: chalk.bold.magenta
    },
    debug: {
      level: 30,
      color: chalk.bold.cyan
    },
    info: {
      level: 40,
      color: chalk.bold.green
    },
    warn: {
      level: 50,
      color: chalk.bold.yellow,
      aliases: ['warning']
    },
    error: {
      level: 60,
      color: chalk.bold.red
    },
    critical: {
      level: 70,
      color: chalk.bold.bgRed,
      aliases: ['fatal']
    }
  },
  console: {
    trace: 'trace',
    log: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error'
  }
});

LEVELS.setLevels(origLevels);

const root = new Logger();

root.levels = { defaults: origLevels };
root.setLevels = LEVELS.setLevels;

root.setLevel(Logger.TRACE);
var oldHandle = root.handle;
root.handle = function handle() {
  if (this._handlers.length === 0) {
    root.basicConfig();
  }
  return oldHandle.apply(this, arguments);
};

const DEFAULT_FORMAT = '%(name)s.%(levelname)s: %(message)s';
root.basicConfig = function basicConfig(options) {
  if (root._handlers.length) {
    return;
  }
  dbug('basicConfig', options);

  // available options:
  //  level, format, filename, stream
  options = options || {};

  var hdlr;
  if (options.file) {
    hdlr = new handlers.File({ file: options.file });
  } else if (options.stream) {
    hdlr = new handlers.Stream({ stream: options.stream });
  } else if (options.null) {
    hdlr = new handlers.Null();
  } else {
    hdlr = new handlers.Console();
  }
  hdlr.setFormatter(new Formatter(options.format || DEFAULT_FORMAT));
  root.addHandler(hdlr);

  if (options.level) {
    root.setLevel(options.level);
  }
  root.handle = oldHandle;
};

root.Logger = Logger;
root.Handler = Handler;
root.handlers = handlers;
root.Formatter = Formatter;
root.Filter = require('./filter');

root.getLogger = function getLogger(name) {
  return new Logger(name);
};

// lazy load it, since console depends on this module
Object.defineProperty(root, 'config', {
  get: function() {
    return require('./config');
  }
});
Object.defineProperty(root, 'console', {
  get: function() {
    return require('./console');
  }
});


module.exports = exports = root;
