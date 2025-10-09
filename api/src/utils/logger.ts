import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Формат для файлов (JSON)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Формат для консоли (читаемый)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level}] ${message}`;

    // Добавляем метаданные если есть
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }

    return msg;
  })
);

// Создаём транспорты
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: LOG_LEVEL
  })
];

// File transports (только если не в production Docker без volumes)
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    // Все логи
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Только ошибки
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );
}

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  // Не падаем при ошибках логирования
  exitOnError: false
});

// Обработка необработанных исключений
if (process.env.NODE_ENV !== 'test') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log')
    })
  );

  logger.rejections.handle(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log')
    })
  );
}

// Экспорт типизированного логгера
export default logger;