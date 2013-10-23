/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const chalk = require('chalk');
const strftime = require('strftime');
const printf = require('./utils/printf');

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
    if ('colorize' in options) {
      this._colorize = options.colorize;
    }
  } else if (typeof options === 'string') {
    this._format = options;
  }
}


const COLORS = {
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

  usesTime: function usesTime() {
    return this._format.indexOf('%(date)s') !== -1;
  },

  format: function format(record) {
    if (this.usesTime()) {
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
    // try some quick cases
    if (this._format === MESSAGE_ONLY) {
      formatted = record.message;
    } else if (this._format === BASIC_FORMAT) {
      formatted = record.name + '.' + record.levelname + ': ' + record.message;
    } else {
      // slower
      formatted = printf(this._format, record);
    }
    if (record.stack && this._format !== TO_JSON) {
      formatted += record.stack;
    }
    record.levelname = levelname;
    record.name = name;

    return formatted;
  },

  formatDate: function formatDate(record) {
    return strftime(this._datefmt, record.timestamp);
  }

};

module.exports = Formatter;
