/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

function nameFilter(record) {
  var filter = this._filter;
  if (filter === record.name) {
    return true;
  } else if (record.name.indexOf(filter) === -1) {
    return false;
  } else {
    return record.name[filter.length] === '.';
  }
}

function regexpFilter(record) {
  return this._filter.test(record.message);
}

function Filter(filter) {
  // valid filters: regexp, string, function
  var type = typeof filter;
  if (type === 'function') {
    this.filter = filter;
  } else if (type === 'string') {
    this._filter = filter;
    this.filter = nameFilter;
  } else if (util.isRegExp(filter)) {
    this._filter = filter;
    this.filter = regexpFilter;
  }
}

Filter.prototype = {

  filter: function() {
    throw new Error('Filter type was not defined.');
  }

};

module.exports = Filter;
