/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const P = require('bluebird');

const Formatter = require('../formatter');
const Filterer = require('../filterer');
const LEVELS = require('../levels');

const _defaultFormatter = new Formatter();

function Handler(options) {
  if (typeof options !== 'object') {
    options = { level: options };
  }
  var level = options.level;
  this.setLevel((level !== undefined) ? LEVELS.getLevel(level) : LEVELS.NOTSET);
  this.setFormatter(options.formatter);
  if ('timeout' in options) {
    this._timeout = options.timeout;
  }
  this._emit = P.promisify(function() {
    return this.emit.apply(this, arguments);
  }, this);
  Filterer.call(this, options);
}
util.inherits(Handler, Filterer);

var proto = {

  level: null,

  _formatter: null,

  _timeout: 1000 * 5, // 5second default timeout?

  handle: function(record) {
    if (!this.filter(record)) {
      return P.fulfilled();
    }
    if (this.emit.length < 2) {
      throw new Error('Handler.emit requires a callback argument');
    }

    //return this._emit(record);
    var promise = this._emit(record);
    if (this._timeout) {
      promise = promise.timeout(this._timeout);
    }
    return promise;
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

for (var key in proto) {
  if (proto.hasOwnProperty(key)) {
    Handler.prototype[key] = proto[key];
  }
}

module.exports = Handler;
