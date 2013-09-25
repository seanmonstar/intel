const util = require('util');

const chalk = require('chalk');
const datetime = require('datetime');
const printf = require('printf');

function Formatter(options) {
  if (typeof options === 'object') {
    if ('format' in options) {
      this._format = options.format;
    }
    if ('datefmt' in options) {
      this._datefmt = options.datefmt;
    }
    if ('colorize' in options) {
      this._colorize = options.colorize;
    }
  } else if (typeof options === 'string') {
    this._format = options;
  }
}


const COLORS = {
  'VERBOSE': 'cyan',
  'DEBUG': 'blue',
  'INFO': 'green',
  'WARN': 'yellow',
  'ERROR': 'red',
  'CRITICAL': 'magenta'
};

Formatter.prototype = {

  _format: '%(message)s',

  _datefmt: '%Y-%m-%d %H:%M-%S',

  _colorize: false,

  usesTime: function usesTime() {
    return this._format.indexOf('%(date)s') !== -1;
  },

  format: function format(record) {
    if (this.usesTime()) {
      record.date = this.formatDate(record);
    }
    var levelname = record.levelname;
    if (this._colorize) {
      record.levelname = chalk[COLORS[levelname]](levelname);
    }
    var formatted = printf(this._format, record);
    record.levelname = levelname;

    return formatted;
  },

  formatDate: function formatDate(record) {
    return datetime.format(this._datefmt, record.timestamp);
  }

};

module.exports = Formatter;
