import { Router } from 'express';
import { RiskController } from '../controllers';

const dashboardRouter = Router();

dashboardRouter.get('/tenant/:tenantId/risk',
  RiskController.getRiskDataFromBigQuery
);

export default dashboardRouter;
