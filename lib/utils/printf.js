/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const json = require('./json');

const RE = /%(-?\d+)?(\.-?\d+)?(:\d+)?(%|(\([^\)]+\))?([sdOj\?]))/g;

const toString = Object.prototype.toString;
function type(x) {
  return toString.call(x).slice(8, -1).toLowerCase();
}

function pad(str, value) {
  var isRight = false;

  if(value < 0) {
    isRight = true;
    value = -value;
  }

  if(str.length < value) {
    var padding = new Array(value - str.length + 1).join(' ');
    return isRight ? str + padding : padding + str;
  } else{
    return str;
  }
}

function truncate(str, value) {
  if(value > 0) {// truncate from begining
    return str.slice(-value);
  } else {// truncate from end
    return str.slice(0, -value);
  }
}

function defaultFmt(x) {
  switch (type(x)) {
    case 'arguments':
    case 'object':
      return json(x);
    default:
      return String(x);
  }
}

function printfNextValue(format, nextValFn) {
  var str = String(format).replace(RE,
    function(match, padding, trunc, indent, kind, name, type) {

      if (kind === '%') {
        return '%';
      }

      var val = nextValFn(name);


      var fmt = '';

      switch (type) {
      case 's':
        fmt = String(val);
        break;
      case 'd':
        fmt = String(Number(val));
        break;
      case 'O':
      case 'j':
        fmt = json(val, indent && parseInt(indent.slice(1), 10));
        break;
      case '?':
        fmt = defaultFmt(val);
        break;
      }

      if (trunc !== undefined) {
        fmt = truncate(fmt, trunc.slice(1));
      }

      if (padding !== undefined) {
        fmt = pad(fmt, padding);
      }

      return fmt;
    });
  return str;
}

function printfObj(format, obj) {
  return printfNextValue(format, function(name) {
    name = name && name.slice(1, -1);
    return obj[name];
  });
}

function printfArgs(format, args) {
  var i = 0;
  var len = args.length;
  var str = printfNextValue(format, function() {
    return args[i++];
  });
  if (len > 0) {
    for (var x = args[i]; i < len; x = args[++i]) {
      str += ' ' + defaultFmt(x);
    }
  }

  return str;
}

// Usage:
//   printf('I am %d %s old', 4, 'years');
//   printf('%(name)s: %:2(message)j', { name: 'foo', message: { foo: 'bar' }});
const OBJECT_FMT = /%([:\-]?\d+)?\([^\)]+\)[sdjO\?]/;
module.exports = function printf(format, obj/*, ..args*/) {
  if (!OBJECT_FMT.test(format)) {
    var args = new Array(arguments.length - 1);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i + 1];
    }
    return printfArgs(format, args);
  } else {
    return printfObj(format, obj);
  }
};
