/**
 * Log levels
 * FATAL: Used to represent a catastrophic situation — your application cannot recover. Logging at this level usually signifies the end of the program.
 * ERROR: Represents an error condition in the system that happens to halt a specific operation, but not the overall system. You can log at this level when a third-party API is returning errors.
 * WARN: Indicates runtime conditions that are undesirable or unusual, but not necessarily errors. An example could be using a backup data source when the primary source is unavailable.
 * INFO: Info messages are purely informative. Events that are user-driven or application-specific may be logged at this level. A common use of this level is to log interesting runtime events, such as the startup or shutdown of a service.
 * DEBUG: Used to represent diagnostic information that may be needed for troubleshooting.
 * TRACE: Captures every possible detail about an application's behavior during development.
 */
import 'winston-daily-rotate-file';
import {
  createLogger as createWinstonLogger,
  format,
  transports,
} from 'winston';
import type { LeveledLogMethod, Logger } from 'winston';

type CustomLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
type CustomLogger = Logger & Record<CustomLevel, LeveledLogMethod>;

/**
 * Creates a custom logger instance, that basically do the following:
 * - Customize log content.
 * - Print logs to console.
 * - Write daily rotating files for a specific range of levels.
 * @returns custom logger instance.
 */
function createLogger() {
  const levels: Record<CustomLevel, number> = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  };

  const addColors = format.colorize();
  const addTimestamp = format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });
  const formatLog = format.printf(
    ({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`,
  );

  const createTransports = () => {
    const defaultTransports = [
      // console
      new transports.Console({
        level: 'trace',
        format: format.combine(addTimestamp, addColors, formatLog),
      }),
    ];

    if (process.env.NODE_ENV === 'production') {
      return [
        ...defaultTransports,
        // file: error logs
        new transports.DailyRotateFile({
          level: 'error',
          dirname: './logs/error',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
        }),
        // file: all logs
        new transports.DailyRotateFile({
          dirname: './logs/all',
          filename: 'all-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
        }),
      ];
    }

    return defaultTransports;
  };

  const logger = createWinstonLogger({
    levels,
    format: format.combine(addTimestamp, formatLog),
    transports: createTransports(),
  }) as CustomLogger;

  return logger;
}

const logger = createLogger();

export default logger;
export { logger };
