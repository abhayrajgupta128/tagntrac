declare namespace Express {
  export interface Request {
    correlationID: string;
    logger: winston.Logger;
  }
}

declare namespace API {}
