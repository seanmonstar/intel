
const SLICE = Array.prototype.slice;

const RE = /%(%|(\([^\)]+\))?([sdO]))/g;

module.exports = function(format, obj) {
  var args = SLICE.call(arguments, 1);
  var counter = 0;
  return String(format).replace(RE, function(match, kind, name, type) {
    if (kind === '%') {
      return '%';
    }

    var val;
    if (name) {
      val = obj[name.substring(1, name.length - 1)];
    } else {
      val = args[counter++];
    }

    switch (type) {
    case 's':
      return String(val);
    case 'd':
      return Number(val);
    case 'O':
      return JSON.stringify(val);
    default:
      return match;
    }
  });
};
