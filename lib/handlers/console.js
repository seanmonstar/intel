/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const Handler = require('./handler');
const StreamHandler = require('./stream');
const LEVELS = require('../levels');

function ConsoleHandler(options) {
  options = options || {};
  options.stream = process.stdout;
  this._out = new StreamHandler(options);
  options.stream = process.stderr;
  this._err = new StreamHandler(options);
  Handler.call(this, options);
}

util.inherits(ConsoleHandler, Handler);

ConsoleHandler.prototype.emit = function consoleEmit(record) {
  var handler = (record.level >= LEVELS.WARN) ? this._err : this._out;
  handler.emit(record);
};

ConsoleHandler.prototype.setFormatter = function setFormatter(formatter) {
  Handler.prototype.setFormatter.call(this, formatter);
  this._out.setFormatter(formatter);
  this._err.setFormatter(formatter);
};

module.exports = ConsoleHandler;
