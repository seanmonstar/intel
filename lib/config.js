/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const intel = require('./');
const Formatter = require('./formatter');
const Filter = require('./filter');

function configureFormatter(formatter/*, options*/) {
  var FormatterClass = formatter['class'] || Formatter;
  return new FormatterClass(formatter);
}

function configureFilter(filterOptions) {
  return new Filter(filterOptions);
}

function configureHandler(handler, options) {
  var HandlerClass = handler['class'];
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

function configureLogger(name, loggerOptions, options) {
  var logger = intel.getLogger(name);
  if (loggerOptions.level != null) {
    logger.setLevel(loggerOptions.level);
  }

  if (loggerOptions.handlers) {
    loggerOptions.handlers.forEach(function eachHandler(hName) {
      logger.addHandler(options.handlers[hName]);
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

  var handlers = options.handlers || {};
  for (var h in handlers) {
    handlers[h] = configureHandler(handlers[h], options);
  }

  var loggers = options.loggers || {};
  for (var l in loggers) {
    configureLogger(l, loggers[l], options);
  }
};
