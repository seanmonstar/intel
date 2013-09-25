const LEVELS = module.exports = exports = {
  'NOTSET': 0,
  'VERBOSE': 10,
  'DEBUG': 20,
  'INFO': 30,
  'WARNING': 40,
  'ERROR': 50,
  'CRITICAL': 60
};

LEVELS.WARN = LEVELS.WARNING;

const NUMBERS = {};
for (var levelname in LEVELS) {
  NUMBERS[LEVELS[levelname]] = levelname;
}

LEVELS.getLevelName = function getLevelName(number) {
  return NUMBERS[number];
};

exports.getLevel = function getLevel(val) {
  var level = parseInt(val, 0);
  if (isNaN(level)) {
    level = LEVELS[String(val).toUpperCase()];
  }
  return level;
};
