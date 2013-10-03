const util = require('util');

const intel = require('../../');

function Spy() {
  intel.Handler.apply(this, arguments);
}
util.inherits(Spy, intel.Handler);

Spy.prototype.emit = function(record, callback) {
  callback();
};

module.exports = Spy;
