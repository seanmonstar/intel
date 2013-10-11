/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path');
const util = require('util');

const stack = require('stack-trace');

const intel = require('./');

const ALIASES = [
  'debug',
  'info',
  'warn',
  'error'
];

function copyProperties(source, target, props) {
  props.forEach(function(prop) {
    target[prop] = source[prop];
  });
}

const ORIGINAL_METHODS = {};
copyProperties(console, ORIGINAL_METHODS, [
  'debug',
  'dir',
  'error',
  'info',
  'log',
  'warn'
]);

var root;
var ignore;

function getLogger() {
  var trace = stack.get();
  // walk up the stack until we find a function that isn't from this
  // module. that's the calling module.
  // ALSO: 'console.js' could be on the stack if console.trace() or
  // something similar was called, cause we don't modify those, since
  // they internally call console.log(), which is us!
  var filename;
  for (var i = 0, len = trace.length; i < len; i++) {
    filename = trace[i].getFileName();
    if (filename !== __filename && filename !== 'console.js') {
      break;
    }
  }
  var topName = path.basename(root);
  topName = topName.replace(path.extname(topName), '');

  var moduleName = path.join(topName, path.relative(root, filename));
  moduleName = moduleName.replace(path.extname(moduleName), '');

  return intel.getLogger(moduleName);
}

function setRoot(r) {
  root = r;
}

function setIgnore(i) {
  ignore = i;
}

function deliver(method, args) {
  var logger = getLogger();
  var i = ignore.length;
  while (i--) {
    if (logger._name.indexOf(ignore[i]) === 0) {
      ORIGINAL_METHODS[method].apply(console, args);
      return;
    }
  }
  var level = ALIASES.indexOf(method) !== -1 ? method : 'debug';
  logger[level].apply(logger, args);
}

function overrideConsole(options) {
  options = options || {};
  setRoot(options.root || path.join(stack.get()[1].getFileName(), '..'));
  setIgnore(options.ignore || []);
  
  ALIASES.forEach(function(method) {
    console[method] = function alias(){
      deliver(method, arguments);
    };
  });

  console.log = function log() {
    deliver('log', arguments);
  };

  console.dir = function dir(obj) {
    deliver('dir', [util.inspect(obj)]);
  };
}

function restoreConsole() {
  for (var name in ORIGINAL_METHODS) {
    if (ORIGINAL_METHODS.hasOwnProperty(name)) {
      console[name] = ORIGINAL_METHODS[name];
    }
  }
}

module.exports = exports = overrideConsole;
exports.restore = restoreConsole;
