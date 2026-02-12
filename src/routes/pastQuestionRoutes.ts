import { Router } from 'express';
import { PastQuestionController } from '../controllers';

const router = Router();
const controller = new PastQuestionController();

// GET /past-questions/:board/:subject - Get past questions
router.get('/:board/:subject', (req, res) => controller.getPastQuestions(req, res));

export default router;