/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const path = require('path');
const util = require('util');

const intel = require('./');
const Formatter = require('./formatter');
const Filter = require('./filter');

const INTEL_PREFIX = 'intel/';

function req(str, root) {
  if (str.indexOf(INTEL_PREFIX) === 0) {
    str = str.replace(INTEL_PREFIX, './');
  } else if (str.indexOf('./') === 0 || str.indexOf('../') === 0) {
    str = path.join(root || process.cwd(), str);
  }
  return require(str);
}

function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}


function evalFunction(source) {
  /*jshint evil:true*/
  var fn = Function('return (' + String(source).trim() + ');')();
  if (!(fn instanceof Function)) {
    throw new Error('function parameter did not parse as a function');
  }
  return fn;
}

function configureFormatter(formatter, options) {
  if (formatter.formatFn) {
    var customFormatter = new Formatter();
    if (formatter.formatFn instanceof Function) {
      customFormatter.format = formatter.formatFn;
    } else {
      customFormatter.format = evalFunction(formatter.formatFn);
    }
    return customFormatter;
  }
  var FormatterClass = formatter['class'] || Formatter;
  if (typeof FormatterClass === 'string') {
    FormatterClass = req(FormatterClass, options.root);
  }
  return new FormatterClass(formatter);
}

function configureFilter(filterOptions, options) {
  
  var FilterClass = filterOptions['class'] || Filter;
  if (typeof FilterClass === 'string') {
    FilterClass = req(FilterClass, options.root);
  }
  if (isObject(filterOptions)) {
    var fOpts = filterOptions;
    var re = fOpts.regexp || fOpts.regex || fOpts.re;
    var fn = fOpts.function || fOpts.fn;
    if (re) {
      filterOptions = new RegExp(re, fOpts.flags);
    } else if (fn) {
      filterOptions = evalFunction(fn);
    }
  }
  return new FilterClass(filterOptions);
}

function configureHandler(handler, options) {
  var HandlerClass = handler['class'];
  if (typeof HandlerClass === 'string') {
    HandlerClass = req(HandlerClass, options.root);
  }
  delete handler['class'];
  if (handler.formatter) {
    handler.formatter = options.formatters[handler.formatter];
  }
  var hndlr = new HandlerClass(handler);
  if (handler.filters) {
    handler.filters.forEach(function eachHandler(fname) {
      hndlr.addFilter(options.filters[fname]);
    });
  }
  return hndlr;
}

function getHandler(name, options) {
  var handler = options.handlers && options.handlers[name];
  if (!handler) {
    var errStr = util.format('Handler "%s" is not defined in config', name);
    throw new Error(errStr);
  }
  if (typeof handler.handle !== 'function') {
    handler = options.handlers[name] = configureHandler(handler, options);
  }
  return handler;
}

function configureLogger(name, loggerOptions, options) {
  var logger = intel.getLogger(name);
  if (loggerOptions.level != null) {
    logger.setLevel(loggerOptions.level);
  }

  if (loggerOptions.handlers) {
    loggerOptions.handlers.forEach(function eachHandler(hName) {
      logger.addHandler(getHandler(hName, options));
    });
  }
  if (loggerOptions.filters) {
    loggerOptions.filters.forEach(function eachHandler(fname) {
      logger.addFilter(options.filters[fname]);
    });
  }

  if (loggerOptions.propagate != null) {
    logger.propagate = loggerOptions.propagate;
  }

  if (loggerOptions.handleExceptions) {
    logger.handleExceptions(loggerOptions.exitOnError);
  }
}

module.exports = function config(options) {
  // lets do formatters and filters first, since they dont depend on anything
  // then handlers, since they can depend on formatters
  // and then loggers, since they can depend on handlers

  var formatters = options.formatters || {};
  for (var f in formatters) {
    formatters[f] = configureFormatter(formatters[f], options);
  }

  var filters = options.filters || {};
  for (var fi in filters) {
    filters[fi] = configureFilter(filters[fi], options);
  }

  if (options.handlers) {
    intel.basicConfig({ null: true});
  }

  var loggers = options.loggers || {};
  for (var l in loggers) {
    configureLogger(l, loggers[l], options);
  }

  if (options.console) {
    var consoleOpts = isObject(options.console) ? options.console : {};
    consoleOpts.__trace = config;
    intel.console(consoleOpts);
  }
};
