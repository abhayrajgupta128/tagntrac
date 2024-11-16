import winston from 'winston';
import { DateTime } from 'luxon';
import * as httpContext from 'express-http-context';

const logger: winston.Logger = winston.createLogger({
  level: 'http',
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.printf((log) => {
      const correlationID = httpContext.get('correlationID');

      if (log.level != 'http') {
        return `${DateTime.now().toUTC().toString()} - ${log.level} - [${correlationID}] - ${
          log.message
        }`;
      }

      return `${DateTime.now().toUTC().toString()} - ${log.level} - ${log.message}`;
    }),
  ),
  exitOnError: false,
});

const logStream = {
  write: (message: string) => {
    logger.http(message);
  },
};

export { logStream };

export default logger;
