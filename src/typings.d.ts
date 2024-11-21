declare namespace Express {
  export interface Request {
    correlationID: string;
    logger: winston.Logger;
  }
  
  export interface Application {
    bigQuerry: BigQuery;
    generativeModel: ReturnType<VertexAI['getGenerativeModel']>;
  }
}

declare namespace API {}
