/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

function klass(ctor) {
  if (!(this instanceof klass)) {
    return new klass(ctor);
  }
  this._ctor = ctor;
}

klass.prototype = {
  inherit: function inherit(par) {
    util.inherits(this._ctor, par);
    return this;
  },
  mixin: function mixin(other) {
    for (var k in other) {
      this._ctor.prototype[k] = other[k];
    }
    return this;
  }
};

module.exports = klass;
