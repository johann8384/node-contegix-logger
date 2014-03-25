/*
 Example Log Usage:

 Invocation:

 logger.log('info', 'Test Log Message', { anything: 'This is metadata' });

 Emits:

 info: Test Log Message anything=This is metadata

 Invocation:

 logger.log('debug', 'Storing ' + bytes + ' as support.ticket_count.high');

 Emits:

 debug: Storing 3 bytes as support.ticket_count.high

 */

/*
 Using in a module:

 var ctxlog = require('../../ctxlog');
 var logger = ctxlog('modulename');

 Using the main instance:

 var ctxlog = require('./lib/ctxlog');
 var logger = ctxlog('main');

 */

var winston = require('winston');
var _ = require('underscore');
var mkdirp = require('mkdirp');
var levels = {
  silly: 0,
  debug: 1,
  verbose: 2,
  help: 3,
  info: 4,
  data: 5,
  warn: 6,
  error: 7,
  hide: 8
};

var colors = {
  silly: 'magenta',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  debug: 'blue',
  info: 'green',
  data: 'cyan',
  help: 'cyan',
  warn: 'yellow',
  error: 'red',
  hide: 'grey'
};

winston.addColors(colors);
createLogger = function createLogger(module, level, logPath, consoleOpts, fileOpts) {
  var logFile =  logPath + '/' + 'main.log';
  var fileDefaults =  { level: 'info', filename: logFile, handleExceptions: true };
  var consoleDefaults = { level: 'info',  colorize: true, handleExceptions: true };

  mkdirp(logPath, function(err) {
    if (err) console.log('could not initialize logging class, could not create logpath: ' + logPath);
  });

  if (level && level != '' && level != {})
  {
    consoleDefaults.level = level;
    fileDefaults.level = level;
  }

  if (!(module || module == ''))
  {
    module = 'main';
  }

  if(!(consoleOpts || consoleOpts == '' || consoleOpts == {}))
  {
    consoleOpts = consoleDefaults;
  } else {
    _.defaults(consoleOpts,consoleDefaults);
  }

  if(!(fileOpts || fileOpts == '' || fileOpts == {}))
  {
    fileOpts = fileDefaults;
  } else {
    _.defaults(fileOpts,fileDefaults);
  }

  fileOpts.filename = logPath + '/' + module + '.log';

  winston.loggers.add(module, {
    console: consoleOpts,
    file: fileOpts
  });

  thisLogger = winston.loggers.get(module);
  thisLogger.setLevels(levels);
  thisLogger.log = function(){
    var args = arguments;

    if (arguments.length == 1) {
      args[1] = 'debug';
      args[2] = { foo: 'foo'};
    }

    if (arguments.length == 2) {
      args[2] = { foo: 'foo'};
    }

    /*
     Every log entry should have these standard metadata entries.
     */
    var eventID = require('uuid').v4();

    if (this.req)
    {
      var sessionID = this.req.sessionID;
      var requestID = this.req.id;

      if (this.req.user)
      {
        var username = this.req.user.username;
      } else {
        var username = 'none';
      }
    } else {
      var sessionID = 'none';
      var requestID = 'none';
      var username = 'none';
    }

    args[2] = _.defaults(args[2], { type: 'applog', username: username, eventID: eventID, requestID: requestID, sessionID: sessionID });

    winston.Logger.prototype.log.apply(this,args);
  }
  thisLogger.trace = function(error){
    var args = arguments;
    var stackTrace = require('stack-trace');
    var trace = stackTrace.parse(error);

    if (arguments.length == 1) {
      args[1] = { foo: 'foo'};
    }

    args[1] = _.defaults(args[1], {error: error, trace: trace, filename: trace[0].getFileName(), line: trace[0].getLineNumber()});
    this.log('debug', 'Caught Error', args[1]);
  }
  return thisLogger;
}

module.exports = createLogger;
