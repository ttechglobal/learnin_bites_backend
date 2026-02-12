import { Request, Response } from 'express';
import { Topic, Concept } from '../models';

export class TopicController {
  
  /**
   * GET /topics/:topicId/concepts
   * Returns all concepts for a specific topic
   * 
   * Example: GET /topics/507f1f77bcf86cd799439011/concepts
   */
  async getConceptsByTopic(req: Request, res: Response) {
    try {
      const { topicId } = req.params;

      // Verify topic exists
      const topic = await Topic.findById(topicId);

      if (!topic) {
        return res.status(404).json({
          success: false,
          error: `Topic with ID "${topicId}" not found`,
        });
      }

      // Find all concepts for this topic
      const concepts = await Concept.find({ topicId })
        .select('-__v')
        .sort({ orderIndex: 1 });

      res.json({
        success: true,
        topicId,
        topicName: topic.name,
        count: concepts.length,
        data: concepts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch concepts',
        message: error.message,
      });
    }
  }
}