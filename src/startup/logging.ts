import { Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import winston, { createLogger, format } from 'winston';

import { config } from './config';

const { combine, printf } = format;

/**
 * for log
 */
export const logger = (): void => {
  winston.exceptions.handle(new winston.transports.File({ filename: 'uncaughtExceptions.log' }));
  winston.exceptions.handle(new winston.transports.Console());

  const customLogFormat = printf(({ level, message }): string => {
    return `[${level}] : ${message}`;
  });
  const winstonLogger = createLogger({
    level: 'debug',
    format: combine(format.colorize(), customLogFormat),
    transports: [
      new winston.transports.File({ filename: 'logfile.log' }),
      new winston.transports.Console(),
    ],
  });

  winston.add(winstonLogger);
};

export const uncaughtException = (): void => {
  process.on('uncaughtException', (err: Error): void => {
    winston.error(`${err.name}: ${err.message}`);

    if (config.isDevelopment()) {
      let stackTrace = '';
      if (typeof err.stack === 'string' && err.stack.trim() !== '') {
        stackTrace = err.stack;
      } else if (typeof err.message === 'string' && err.message.trim() !== '') {
        stackTrace = err.message;
      } else {
        stackTrace = String(err);
      }
      const stackLines = stackTrace.split('\n');
      let fileRouteLine = '';
      for (const line of stackLines) {
        if (line.includes(path.dirname(fileURLToPath(import.meta.url)))) {
          fileRouteLine = line.trim();
          break;
        }
      }
      winston.error(`File path: ${fileRouteLine}`);
      winston.error('Uncaught exception occurred! Shutting down...');
      process.exit(1);
    } else {
      winston.error('Uncaught exception occurred');
    }
  });
};

export const unhandledRejection = (server: Server): void => {
  process.on('unhandledRejection', (err: Error): void => {
    winston.error(`${err.name}: ${err.message}`);

    if (config.isDevelopment()) {
      let stackTrace = '';
      if (typeof err.stack === 'string' && err.stack !== '') {
        stackTrace = String(err.stack);
      } else if (typeof err.message === 'string' && err.message !== '') {
        stackTrace = String(err.message);
      }
      const stackLines = stackTrace.split('\n');
      let fileRouteLine = '';
      for (const line of stackLines) {
        if (line.includes(path.dirname(fileURLToPath(import.meta.url)))) {
          fileRouteLine = line.trim();
          break;
        }
      }
      winston.error(`File path: ${fileRouteLine}`);
      winston.error('Unhandled rejection occurred! Shutting down...');
      server.close((): void => {
        process.exit(1);
      });
    } else {
      winston.error('Unhandled rejection occurred!');
    }
  });
};
