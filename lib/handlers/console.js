const util = require('util');

const Handler = require('./handler');
const StreamHandler = require('./stream');
const LEVELS = require('../levels');

function ConsoleHandler() {
  this._out = new StreamHandler(process.stdout);
  this._err = new StreamHandler(process.stderr);
  Handler.apply(this, arguments);
}

util.inherits(ConsoleHandler, Handler);

ConsoleHandler.prototype.emit = function consoleEmit(record, callback) {
  var handler = (record.level >= LEVELS.WARNING) ? this._err : this._out;
  handler.emit(record, callback);
};

ConsoleHandler.prototype.setFormatter = function setFormatter(formatter) {
  Handler.prototype.setFormatter.call(this, formatter);
  this._out.setFormatter(formatter);
  this._err.setFormatter(formatter);
};

module.exports = ConsoleHandler;
