import { Router } from 'express';
import { ChatBotController } from '../controllers';

const chatRouter = Router();

chatRouter.post('/tenant/:tenantId/ask', ChatBotController.answerQuestion);

export default chatRouter;
