import { Request, Response } from 'express';

class BaseController {
  async healthCheck(req: Request, res: Response) {
    req.logger.info('Processing #healthCheck');
    res.status(200).json({ message: 'API Service Up & Running!' });
  }
}

export default new BaseController();
