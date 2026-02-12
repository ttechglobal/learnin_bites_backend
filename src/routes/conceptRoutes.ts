import { Router } from 'express';
import { ConceptController } from '../controllers';

const router = Router();
const controller = new ConceptController();

// GET /concepts/:id/lesson - Get lesson content
router.get('/:id/lesson', (req, res) => controller.getLessonContent(req, res));

// GET /concepts/:id/questions - Get practice questions
router.get('/:id/questions', (req, res) => controller.getQuestions(req, res));

export default router;