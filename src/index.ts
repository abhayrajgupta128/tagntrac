import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import * as httpContext from 'express-http-context';

import { correlationID, loggerMiddleware } from './middlewares';
import service from './services';
import { BaseRouter, QuestionRouter, DashboardRouter } from './routes';
import { logStream } from './utilities/logger';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();

  await service({ app });

  /**
   * Handle JSON in request body
   */
  app.use(express.json());

  /**
   * CORS Configuration
   */
  app.use(cors());

  /**
   * Security Configuration
   */
  app.use(helmet());

  /**
   * Configure Morgan for Logging
   */
  // app.use(httpContext.middleware);
  app.use(correlationID);
  app.use(loggerMiddleware);

  morgan.token('correlationID', function getCorrelationID(req: Request) {
    return req.correlationID;
  });

  app.use(
    morgan(
      '[:correlationID] - :method :url HTTP/:http-version :status :res[content-length] :response-time ms',
      { stream: logStream },
    ),
  );

  /**
   * Mount Routes
   */
  app.use('/v1', [BaseRouter, QuestionRouter, DashboardRouter]);

  /**
   * Internal Error Response (This should be defined after all routes are defined)
   */
  app.use((err: Error, _req: Request, res: Response, next: NextFunction): any => {
    if (!err) {
      return next();
    }

    switch (err.name) {
      case 'BadRequestError':
        return res.status(400).json({ status: 400, message: err.message });
      case 'UnauthorizedError':
        return res.status(401).json({ status: 401, message: err.message });
      case 'ForbiddenError':
        return res.status(403).json({ status: 403, message: err.message });
      case 'NotFoundError':
        return res.status(404).json({ status: 404, message: err.message });
      case 'ConflictError':
        return res.status(409).json({ status: 409, message: err.message });
      default:
        return res.status(500).json({ status: 500, message: 'Internal server error', err });
    }
  });

  /**
   * 404 Not Found Response (This should be defined after defining internal server handler)
   */
  app.use((_req, res) => {
    res.status(404).json({
      status: 404,
      message: 'Requested resource not found!',
    });
  });

  const server = createServer(app);

  /**
   * Load sequelize & start HTTP Server
   */
  server
    .on('error', () => {
      console.log('Something wrong, could not initialize the server');
      process.exit(1);
    })
    .listen({ port: 4000 }, () => {
      console.log(`🚀 Server ready at http://localhost:4000`);
    });
}

startServer();