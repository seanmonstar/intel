# intel ChangeLog

### v1.2.0 - 2017-06-01

- changed handleExceptions exitOnError to exit immediately, instead of
  on a timout.

#### v1.1.2 - 2016-12-02

- fixed error when error does not have a stack property

#### v1.1.1 - 2016-06-22

- fixed error message when handler is undefined in `intel.config()`

### v1.1.0 - 2015-12-14

- added `basename` option to `intel.console()`

#### v1.0.2 - 2015-09-10

- fixed formatting of RegExps by default

#### v1.0.1 - 2015-08-19

- fixed Filter bug when more than 1 filter was added
- fixed debug() interception when using intel.console()

## v1.0.0 - 2014-12-17

- added `intel.console({ logger: str })` to specify a parent logger
- added `record.v` to indicate log record format
- added `record.host` equal the `os.hostname()`
- added `%j` alias to `%O` in printf
- added `%?` default formatting for an argument
- added `:4` flag for indenting JSON in printf. such as `%:2j`.
- fixed `logger.trace()` to no longer set `record.exception=true`
- fixed cirular references in log arguments
- fixed `intel.console(debug)` with uncolored output
- changed `log.info('%s', false)` string interpolation to use internal printf
- changed JSON format of `Record` to not include interpolated `message`, since it already contains `args`
- changed Record.timestamp to use Date.now() instead of new Date()
- removed `Promise`s being returned from log methods. Not useful, slows it down.
- removed `Rotating` handler from core. Use [logrotate-stream](https://npmjs.org/package/logrotate-stream) or similar.
- performance **HUGE BOOST ACROSS THE BOARD**

#### v0.5.2 - 2014-02-19

- added `strip` option to Formatter, which will strip all ANSI code

#### v0.5.1 - 2014-02-12

- added bgBlue to TRACE
- changed uncaught exceptions log level to CRITICAL
- fixed error if null was passed an argument to Logger.log()

### v0.5.0 - 2014-02-10

- added direct integration with `dbug` module
- added `Logger.removeAllHandlers()`
- added `formatFn` for Formatters and `regex`, `flags`, and `function` for Filters to ease `intel.config()`
- added `Logger#trace` and `intel.TRACE` level
- added `exception: boolean` and `uncaughtException: boolean` to LogRecord
- added `Logger.NONE` and `Logger.ALL` levels
- changed `intel.config` to remove default ROOT console handler
- changed `intel.console` to remove "lib" from logger names like "connect.lib.session" to be "connect.session"
- performance improved for `Logger#getEffectiveLevel()`

### v0.4.0 - 2013-12-04

- added intel.console({ debug: 'foo' }) option
- performance gains

#### v0.3.1 - 2013-11-04

- fixed Rotating handler writing lock (thanks @chopachom)

### v0.3.0 - 2013-10-22

- added intel.handlers.Rotating
- added ignore options to intel.console()
- added chalk.enabled when colorize is used
- added padding and truncation to printf
- added Logger#handleExceptions to catch uncaught exceptions
- added stack traces when an exception is logged
- changed datetime to strftime, adds `%L` to output milliseconds
- changed Promises from Q to bluebird, significantly faster
- fixed Console handler from using accepting format options
- optimizations for common cases, big boost

### v0.2.0 - 2013-10-04

- added Filters for Handlers and Loggers
- added Handler timeout option
- added pid to LogRecord
- added configuration using JSON
- changed Promises to LazyPromises
- changed printf to faster, smaller printf
- changed internal forEach to faster while loops
- removed node v0.6 support (it didn't work anyways)

### v0.1.0 - 2013-09-30

- Initial release.
