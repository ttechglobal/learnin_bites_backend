import { Router } from 'express';
import subjectRoutes from './subjectRoutes';
import topicRoutes from './topicRoutes';
import conceptRoutes from './conceptRoutes';
import pastQuestionRoutes from './pastQuestionRoutes';

const router = Router();

/**
 * Mount all routes
 * 
 * This creates the full API structure:
 * - /api/subjects
 * - /api/topics
 * - /api/concepts
 * - /api/past-questions
 */

router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);
router.use('/concepts', conceptRoutes);
router.use('/past-questions', pastQuestionRoutes);

export default router;