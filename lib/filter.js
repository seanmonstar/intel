/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

function Filter(filter) {
  // valid filters: regexp, string, function
  var type = typeof filter;
  if (type === 'function') {
    this._filter = filter;
  } else if (type === 'string') {
    this._filter = function(record) {
      if (filter === record.name) {
        return true;
      } else if (record.name.indexOf(filter) === -1) {
        return false;
      } else {
        return record.name[filter.length] === '.';
      }
    };
  } else if (util.isRegExp(filter)) {
    this._filter = function(record) {
      return filter.test(record.message);
    };
  }
}

Filter.prototype = {

  filter: function(record) {
    return this._filter(record);
  }

};

module.exports = Filter;
