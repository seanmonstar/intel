/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    return datetime.format(record.timestamp, this._datefmt);
  }

};

module.exports = Formatter;
