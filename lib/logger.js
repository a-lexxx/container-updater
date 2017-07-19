
const intel = require('intel');

// intel.TRACE // intel.trace()
// intel.VERBOSE // intel.verbose()
// intel.DEBUG // intel.debug()
// intel.INFO // intel.info()
// intel.WARN // intel.warn()
// intel.ERROR // intel.error()
// intel.CRITICAL // intel.critical()

const envLoglevel = process.env.CUPD_LOGLEVEL;
const level = envLoglevel && typeof intel[envLoglevel] === 'number' ? intel[envLoglevel] : intel.INFO;

const logFile = 'run/updater.log';

intel.config({
    formatters: {
        fileFormatter: {
            format: '[%(date)s] %(levelname)s: %(message)s',
            strip: true
        },
        consoleFormatter: {
            format: '[%(date)s] %(levelname)s: %(message)s',
            colorize: true
        }
    },
    handlers: {
        logfile: {
            'class': intel.handlers.File,
            level,
            file: logFile,
            formatter: 'fileFormatter'
        },
        console: {
            'class': intel.handlers.Console,
            formatter: 'consoleFormatter',
            level
        }
    },
    loggers: {
        main: {
          handlers: ['console', 'logfile'],
          level: intel.ALL,
          handleExceptions: true,
          exitOnError: false,
          propagate: false
        }
      }
});

module.exports = intel.getLogger('main');
