import { Request, Response, NextFunction } from 'express';
import { v4 as uuidV4 } from 'uuid';
import * as httpContext from 'express-http-context';

import logger from '../utilities/logger';

function correlationID(req: Request, _res: Response, next: NextFunction) {
  req.correlationID = uuidV4();
  httpContext.set('correlationID', req.correlationID);
  next();
}

function loggerMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.logger = logger;
  next();
}

export { correlationID, loggerMiddleware };
