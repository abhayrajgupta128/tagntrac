import { Router } from 'express';
import { QuestionController } from '../controllers';

const router = Router();

router.get('/ask', QuestionController.answerQuestion);

export default router;
