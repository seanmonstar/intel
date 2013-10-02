/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Q = require('q');

function LazyPromise(fn) {
  if (!(this instanceof LazyPromise)) {
    return new LazyPromise(fn);
  }

  this._fn = fn;
  this.callback = this.callback.bind(this);
}

LazyPromise.prototype.now = function now(fn) {
  try {
    fn.call(this);
  } catch (err) {
    this.callback(err);
  }
  return this;
};

LazyPromise.prototype.promise = function promise() {
  this._deferred = Q.defer();
  return this._deferred.promise;
};

LazyPromise.prototype.callback = function callback() {
  if (this._args) {
    return;
  }
  this._args = arguments;
  if (this._deferred) {
    this.complete();
  }
};

LazyPromise.prototype.complete = function() {
  if (!this._args) {
    return;
  }
  if (this._args[0]) {
    this._deferred.reject(this._args[0]);
  } else {
    this._deferred.resolve(this._args[1]);
  }
};

LazyPromise.prototype._run = function _run() {
  if (!this._promise) {
    this._promise = this._fn();
    if (this._deferred) {
      this.complete();
    }
  }
};

Object.defineProperty(LazyPromise.prototype, 'then', {
  get: function getThen() {
    this._run();
    return this._promise.then.bind(this._promise);
  }
});

Object.defineProperty(LazyPromise.prototype, 'done', {
  get: function getDone() {
    this._run();
    return this._promise.done.bind(this._promise);
  }
});

module.exports = LazyPromise;
