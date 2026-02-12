import { Request, Response } from 'express';
import { Subject, Topic, Concept, LessonSection, ConceptQuestion } from '../models';

/**
 * SubjectController: Handles all subject-related API requests
 * 
 * Each method corresponds to an API endpoint
 */

export class SubjectController {
  
  /**
   * GET /subjects
   * Returns all subjects in the system
   */
  async getAllSubjects(req: Request, res: Response) {
    try {
      const subjects = await Subject.find()
        .select('-__v')  // Don't return MongoDB version field
        .sort({ name: 1 });  // Sort alphabetically by name

      res.json({
        success: true,
        count: subjects.length,
        data: subjects,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subjects',
        message: error.message,
      });
    }
  }

  /**
   * GET /subjects/:code
   * Returns a specific subject by its code
   * 
   * Example: GET /subjects/MATH001
   */
  async getSubjectByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const subject = await Subject.findOne({ code })
        .select('-__v');

      if (!subject) {
        return res.status(404).json({
          success: false,
          error: `Subject with code "${code}" not found`,
        });
      }

      res.json({
        success: true,
        data: subject,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject',
        message: error.message,
      });
    }
  }

  /**
   * GET /subjects/:code/topics
   * Returns all topics for a specific subject
   * 
   * Example: GET /subjects/MATH001/topics
   * Returns: [Algebra, Geometry, Trigonometry, ...]
   */
  async getTopicsBySubject(req: Request, res: Response) {
    try {
      const { code } = req.params;

      // First find the subject
      const subject = await Subject.findOne({ code });

      if (!subject) {
        return res.status(404).json({
          success: false,
          error: `Subject with code "${code}" not found`,
        });
      }

      // Find all topics for this subject
      const topics = await Topic.find({ subjectId: subject._id })
        .select('-__v')
        .sort({ orderIndex: 1 });  // Sort by order_index (as specified in requirements)

      res.json({
        success: true,
        subjectCode: code,
        subjectName: subject.name,
        count: topics.length,
        data: topics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch topics',
        message: error.message,
      });
    }
  }
}