const Q = require('q');

const Formatter = require('../formatter');
const LEVELS = require('../levels');

const _defaultFormatter = new Formatter();

function Handler(options) {
  if (typeof options !== 'object') {
    options = { level: options };
  }
  var level = options.level;
  this.setLevel((level !== undefined) ? LEVELS.getLevel(level) : LEVELS.NOTSET);
  this.setFormatter(options.formatter);
}

Handler.prototype = {

  level: null,

  _formatter: null,

  handle: function(record) {
    if (this.emit.length < 2) {
      throw new Error('Handler.emit requires a callback argument');
    }
    return Q.ninvoke(this, 'emit', record);
  },

  // sub-classes should override emit, not handle
  emit: function emit(/*record, callback*/) {
    throw new Error('Handler.emit must be implemented by sub-classes');
  },

  format: function format(record) {
    var formatter = this._formatter || _defaultFormatter;
    return formatter.format(record);
  },

  setFormatter: function setFormatter(formatter) {
    this._formatter = formatter;
    return this;
  },

  setLevel: function setLevel(level) {
    this.level = LEVELS.getLevel(level);
    return this;
  }

};

module.exports = Handler;
