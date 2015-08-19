/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


function filter(record) {
  var i = this._filters.length;
  while (i--) {
    if (!this._filters[i].filter(record)) {
      return false;
    }
  }
  return true;
}

function noop() { return true; }

function Filterer() {
  this._filters = [];
  this.filter = noop;
}

Filterer.prototype = {

  __toggleFilter: function toggleFilter() {
    this.filter = this.filter === noop ? filter : noop;
  },

  addFilter: function addFilter(_filter) {
    if (this._filters.length === 0) {
      this.__toggleFilter();
    }
    this._filters.push(_filter);
    return this;
  },

  removeFilter: function removeFilter(_filter) {
    var index = this._filters.indexOf(_filter);
    if (index !== -1) {
      this._filters.splice(index, 1);
    }
    if (this._filters.length === 0) {
      this.__toggleFilter();
    }
    return this;
  }

};

module.exports = Filterer;
