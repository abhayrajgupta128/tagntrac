import {Router} from 'express';
import { DashboardController } from '../controllers';

const dashboardRouter = Router();

dashboardRouter.get(
  "/tenant/:tenantId/dashboard",
  DashboardController.getDashboardDataFromBigQuery
);

export default dashboardRouter;