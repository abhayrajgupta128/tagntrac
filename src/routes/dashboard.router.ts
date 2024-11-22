import {Router} from 'express';
import { DashboardController } from '../controllers';
import { AuthMiddleware } from '../middlewares';

const dashBoardRouter = Router();

dashBoardRouter.use('/devices', AuthMiddleware.authenticateApiKey);

dashBoardRouter.get(
  "/tenant/:tenantId/dashboard",
  DashboardController.getDataFromBigQuery
);

export default dashBoardRouter;