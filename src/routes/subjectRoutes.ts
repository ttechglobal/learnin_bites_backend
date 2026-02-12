import { Router } from 'express';
import { SubjectController } from '../controllers';

const router = Router();
const controller = new SubjectController();

/**
 * Subject Routes
 * 
 * These map URLs to controller methods
 */

// GET /subjects - Get all subjects
router.get('/', (req, res) => controller.getAllSubjects(req, res));

// GET /subjects/:code - Get specific subject
router.get('/:code', (req, res) => controller.getSubjectByCode(req, res));

// GET /subjects/:code/topics - Get topics for a subject
router.get('/:code/topics', (req, res) => controller.getTopicsBySubject(req, res));

export default router;