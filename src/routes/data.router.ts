import {Router} from 'express';
import { DataController } from '../controllers';
import { AuthMiddleware } from '../middlewares';

const deviceRouter = Router();

deviceRouter.use('/tenant', AuthMiddleware.authenticateApiKey);

deviceRouter.get(
  "/tenant/:tenantId/dashboard",
  DataController.getDashboardDataFromBigQuery
);

export default deviceRouter;