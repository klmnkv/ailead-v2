import winston from 'winston';
import path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [WORKER] [${level}] ${message}`;

    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }

    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    level: LOG_LEVEL
  })
];

if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'worker.log'),
      format: fileFormat,
      maxsize: 10485760,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'worker-error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  );
}

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  exitOnError: false
});

if (process.env.NODE_ENV !== 'test') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'worker-exceptions.log')
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'worker-rejections.log')
    })
  );
}

export default logger;