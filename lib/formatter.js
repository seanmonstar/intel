/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chalk = require('chalk');
const strftime = require('strftime');
const printf = require('./utils/printf');
const json = require('./utils/json');

chalk.enabled = true;

const TO_JSON = '%O';
const MESSAGE_ONLY = '%(message)s';
const BASIC_FORMAT = '%(name)s.%(levelname)s: %(message)s';

function Formatter(options) {
  if (typeof options === 'object') {
    if ('format' in options) {
      this._format = options.format;
    }
    if ('datefmt' in options) {
      this._datefmt = options.datefmt;
    }
    if ('strip' in options) {
      this._strip = options.strip;
    }
    if ('colorize' in options) {
      this._colorize = this._strip ? false : options.colorize;
    }
  } else if (typeof options === 'string') {
    this._format = options;
  }
  this._usesTime = this._format.indexOf('%(date)s') !== -1;
}


const COLORS = {
  'TRACE': chalk.bold.bgBlue,
  'VERBOSE': chalk.bold.magenta,
  'DEBUG': chalk.bold.cyan,
  'INFO': chalk.bold.green,
  'WARN': chalk.bold.yellow,
  'ERROR': chalk.bold.red,
  'CRITICAL': chalk.bold.bgRed
};

Formatter.prototype = {

  _format: MESSAGE_ONLY,

  _datefmt: '%Y-%m-%d %H:%M:%S',

  _colorize: false,

  _strip: false,

  _usesTime: false,

  format: function format(record) {
    if (this._usesTime) {
      record.date = this.formatDate(record);
    }

    var levelname = record.levelname;
    var name = record.name;

    if (this._colorize) {
      var colorize = COLORS[levelname];
      if (colorize) {
        record.levelname = colorize(levelname);
      }
      // else levelname doesnt have a color
      record.name = chalk.bold(name);
    }

    var formatted;
    switch (this._format) {
      // faster shortcuts
      case MESSAGE_ONLY:
        formatted = record.message;
        break;
      case BASIC_FORMAT:
        formatted = record.name + '.' + record.levelname + ': '
          + record.message;
        break;
      case TO_JSON:
        formatted = json(record);
        break;
      // bring on the regexp
      default:
        formatted = printf(this._format, record);
    }

    if (record.stack && this._format !== TO_JSON) {
      formatted += record.stack;
    }

    record.levelname = levelname;
    record.name = name;

    if (this._strip) {
      formatted = chalk.stripColor(formatted);
    }

    return formatted;
  },

  formatDate: function formatDate(record) {
    return strftime(this._datefmt, record.timestamp);
  }

};

module.exports = Formatter;
