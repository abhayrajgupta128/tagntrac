import {Router} from 'express';
import { DataController } from '../controllers';
import { AuthMiddleware } from '../middlewares';

const deviceRouter = Router();

deviceRouter.use('/devices', AuthMiddleware.authenticateApiKey);

deviceRouter.get(
  "/devices/:deviceId/data",
  DataController.getDataFromBigQuery
);

export default deviceRouter;