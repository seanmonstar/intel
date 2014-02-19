# intel ChangeLog

## Current dev

## v0.5.2 - 2014-02-19

- added `strip` option to Formatter, which will strip all ANSI code

## v0.5.1 - 2014-02-12

- added bgBlue to TRACE
- changed uncaught exceptions log level to CRITICAL
- fixed error if null was passed an argument to Logger.log()

## v0.5.0 - 2014-02-10

- added direct integration with `dbug` module
- added `Logger.removeAllHandlers()`
- added `formatFn` for Formatters and `regex`, `flags`, and `function` for Filters to ease `intel.config()`
- added `Logger#trace` and `intel.TRACE` level
- added `exception: boolean` and `uncaughtException: boolean` to LogRecord
- added `Logger.NONE` and `Logger.ALL` levels
- changed `intel.config` to remove default ROOT console handler
- changed `intel.console` to remove "lib" from logger names like "connect.lib.session" to be "connect.session"
- performance improved for `Logger#getEffectiveLevel()`

## v0.4.0 - 2013-12-04

- added intel.console({ debug: 'foo' }) option
- performance gains

## v0.3.1 - 2013-11-04

- fixed Rotating handler writing lock (thanks @chopachom)

## v0.3.0 - 2013-10-22

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

## v0.2.0 - 2013-10-04

- added Filters for Handlers and Loggers
- added Handler timeout option
- added pid to LogRecord
- added configuration using JSON
- changed Promises to LazyPromises
- changed printf to faster, smaller printf
- changed internal forEach to faster while loops
- removed node v0.6 support (it didn't work anyways)

## v0.1.0 - 2013-09-30

- Initial release.
