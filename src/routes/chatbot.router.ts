import { Router } from 'express';
import { QuestionController } from '../controllers';
import { AuthMiddleware } from '../middlewares';

const chatRouter = Router();

chatRouter.use('/tenant', AuthMiddleware.authenticateApiKey);
chatRouter.get('/tenant/:tenantId/ask', QuestionController.answerQuestion);

export default chatRouter;
