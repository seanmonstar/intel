/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LEVELS = module.exports = {};

[
  'NOTSET',
  'TRACE',
  'VERBOSE',
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'CRITICAL'
].forEach(function(name, index) {
  LEVELS[name] = index * 10;
});



const NUMBERS = {};
for (var levelname in LEVELS) {
  NUMBERS[LEVELS[levelname]] = levelname;
}

// additional levels, but not canonical names
LEVELS.WARNING = LEVELS.WARN;
LEVELS.ALL = LEVELS.NOTSET;
LEVELS.NONE = Infinity;

LEVELS.getLevelName = function getLevelName(number) {
  return NUMBERS[number];
};

LEVELS.getLevel = function getLevel(val) {
  // 5 => 5
  // '5' => 5
  // 'five' => undefined
  // 'debug' => 20
  // 'DEBUG' = > 20
  var level = Number(val);
  if (isNaN(level)) {
    level = LEVELS[String(val).toUpperCase()];
  }
  return level;
};
