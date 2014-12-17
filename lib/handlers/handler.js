/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Formatter = require('../formatter');
const Filterer = require('../filterer');
const klass = require('../utils/klass');
const LEVELS = require('../levels');

const _defaultFormatter = new Formatter();

function emit(record) {
  return this._emit(record);
}

function handleFilter(record) {
  if (this.filter(record)) {
    this.__emit(record);
  }
}

function Handler(options) {
  if (typeof options !== 'object') {
    options = { level: options };
  }
  var level = options.level;
  this.setLevel((level !== undefined) ? LEVELS.getLevel(level) : LEVELS.NOTSET);
  this.setFormatter(options.formatter || _defaultFormatter);
  this.handle = this.__emit;
  Filterer.call(this, options);
}

klass(Handler).inherit(Filterer).mixin({

  level: null,

  _formatter: null,

  __toggleFilter: function handlerToggleFilter() {
    Filterer.prototype.__toggleFilter.call(this);
    this.handle = this.handle === this.__emit ? handleFilter : this.__emit;
  },

  // sub-classes should override emit, not handle
  _emit: function emit(/*record*/) {
    throw new Error('Handler.emit must be implemented by sub-classes');
  },

  __emit: emit,

  format: function format(record) {
    return this._formatter.format(record);
  },

  setFormatter: function setFormatter(formatter) {
    this._formatter = formatter;
    return this;
  },

  setLevel: function setLevel(level) {
    this.level = LEVELS.getLevel(level);
    return this;
  }

});

Object.defineProperty(Handler.prototype, 'emit', {
  get: function() {
    return this._emit;
  },
  set: function(val) {
    if (typeof val !== 'function') {
      throw new TypeError('emit must be a function');
    }
    this._emit = val;
  }
});

module.exports = Handler;
