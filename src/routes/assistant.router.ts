import { Router } from 'express';
import { AssistantController } from '../controllers';

const chatRouter = Router();

chatRouter.post('/tenant/:tenantId/assistant', AssistantController.answerQuestion);

export default chatRouter;
