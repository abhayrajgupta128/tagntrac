import { Router } from 'express';
import { QuestionController } from '../controllers';

const router = Router();

router.post('/ask', QuestionController.answerQuestion);

export default router;
