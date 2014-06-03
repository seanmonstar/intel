var cov = require('mocha-text-cov');
var dots = require('mocha/lib/reporters/dot');

function intelReporter(runner, opts) {
  this._dots = new dots(runner, opts);
  this._cov = new cov(runner, opts);
}

module.exports = intelReporter;
