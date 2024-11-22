import { Router } from 'express';
import { ChatBotController } from '../controllers';
import { AuthMiddleware } from '../middlewares';

const chatRouter = Router();

chatRouter.use('/tenant', AuthMiddleware.authenticateApiKey);
chatRouter.get('/tenant/:tenantId/ask', ChatBotController.answerQuestion);

export default chatRouter;
