/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const chalk = require('chalk');
const strftime = require('strftime');
const printf = require('./utils/printf');
const json = require('./utils/json');

chalk.enabled = true;

const COLORS = {
  'TRACE': chalk.bold.bgBlue,
  'VERBOSE': chalk.bold.magenta,
  'DEBUG': chalk.bold.cyan,
  'INFO': chalk.bold.green,
  'WARN': chalk.bold.yellow,
  'ERROR': chalk.bold.red,
  'CRITICAL': chalk.bold.bgRed
};
const BOLD = chalk.bold;

const TO_JSON = '%O';
const MESSAGE_ONLY = '%(message)s';
const BASIC_FORMAT = '%(name)s.%(levelname)s: %(message)s';

function messageOnly(record) {
  return record.message;
}
function basicFormat(record) {
  return record.name + '.' + record.levelname + ': ' + record.message;
}
function sprintf(record) {
  return printf(this._format, record);
}

function formatDate(record) {
  record.date = strftime(this._datefmt, new Date(record.timestamp));
}

function noop() {

}

function optimize() {
  switch (this._format) {
    // faster shortcuts
    case MESSAGE_ONLY:
      this.__format = messageOnly;
      break;
    case BASIC_FORMAT:
      this.__format = basicFormat;
      break;
    case TO_JSON:
      this.__format = json;
      break;
    // bring on the regexp
    default:
      this.__format = sprintf;
  }

  this.__time = this._usesTime ? formatDate : noop;
}

function Formatter(options) {
  options = options || {};
  if (typeof options === 'string') {
    options = { format: options };
  }
  this._format = options.format || this._format;
  this._datefmt = options.datefmt || this._datefmt;
  this._strip = options.strip || this._strip;
  this._colorize = this._strip ? false : options.colorize || this._colorize;
  this._usesTime = this._format.indexOf('%(date)s') !== -1;

  optimize.call(this);
}

Formatter.prototype = {

  _format: MESSAGE_ONLY,

  _datefmt: '%Y-%m-%d %H:%M:%S',

  _colorize: false,

  _strip: false,

  _usesTime: false,

  format: function format(record) {
    this.__time(record);

    var levelname = record.levelname;
    var name = record.name;

    if (this._colorize) {
      var colorize = COLORS[levelname];
      if (colorize) {
        record.levelname = colorize(levelname);
      }
      // else levelname doesnt have a color
      record.name = BOLD(name);
    }

    var formatted = this.__format(record);

    if (record.stack && this._format !== TO_JSON) {
      formatted += record.stack;
    }

    record.levelname = levelname;
    record.name = name;
    record.date = undefined;

    if (this._strip) {
      formatted = chalk.stripColor(formatted);
    }

    return formatted;
  }

};

module.exports = Formatter;
