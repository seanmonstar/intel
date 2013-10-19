/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Logger = require('./logger');
const Handler = require('./handlers/handler');
const handlers = require('./handlers');
const Formatter = require('./formatter');

const root = new Logger();

root.setLevel(Logger.DEBUG);
var oldHandle = root.handle;
root.handle = function handle() {
  if (this._handlers.length === 0) {
    root.basicConfig();
  }
  return oldHandle.apply(this, arguments);
};

const DEFAULT_FORMAT = '%(name)s.%(levelname)s: %(message)s%(n)s';
root.basicConfig = function basicConfig(options) {
  if (root._handlers.length) {
    return;
  }

  // available options:
  //  level, format, filename, stream
  options = options || {};

  var hdlr;
  if (options.file) {
    hdlr = new handlers.File({ file: options.file });
  } else if (options.stream) {
    hdlr = new handlers.Stream({ stream: options.stream });
  } else {
    hdlr = new handlers.Console();
  }
  hdlr.setFormatter(new Formatter(options.format || DEFAULT_FORMAT));
  root.addHandler(hdlr);

  if (options.level) {
    root.setLevel(options.level);
  }
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


module.exports = root;
