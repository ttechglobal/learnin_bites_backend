import { Router } from 'express';
import { TopicController } from '../controllers';

const router = Router();
const controller = new TopicController();

// GET /topics/:topicId/concepts - Get concepts for a topic
router.get('/:topicId/concepts', (req, res) => controller.getConceptsByTopic(req, res));

export default router;