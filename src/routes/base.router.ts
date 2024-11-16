import { Router } from 'express';
import { BaseController } from '../controllers';

const coreRouter: Router = Router();

coreRouter.get('/meta/health', BaseController.healthCheck);

export default coreRouter;
