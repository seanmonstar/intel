/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const logging = require('./');
const Formatter = require('./formatter');

function configureFormatter(formatter/*, options*/) {
  var FormatterClass = formatter['class'] || Formatter;
  return new FormatterClass(formatter);
}

function configureHandler(handler, options) {
  var HandlerClass = handler['class'];
  var hndlr = new HandlerClass(handler.level);
  if (handler.formatter) {
    hndlr.setFormatter(options.formatters[handler.formatter]);
  }
  return hndlr;
}

function configureLogger(name, loggerOptions, options) {
  var logger = logging.getLogger(name);
  if (loggerOptions.level != null) {
    logger.setLevel(loggerOptions.level);
  }
  
  if (loggerOptions.handlers) {
    loggerOptions.handlers.forEach(function eachHandler(hName) {
      logger.addHandler(options.handlers[hName]);
    });
  }

  if (loggerOptions.propagate != null) {
    logger.propagate = loggerOptions.propagate;
  }
}

module.exports = function config(options) {
  // lets do formatters first, since they dont depend on anything
  // then handlers, since they can depend on formatters
  // and then loggers, since they can depend on handlers

  var formatters = options.formatters || {};
  for (var f in formatters) {
    formatters[f] = configureFormatter(formatters[f], options);
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
