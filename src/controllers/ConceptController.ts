import { Request, Response } from 'express';
import { Concept, LessonSection, ConceptQuestion } from '../models';

export class ConceptController {
  
  /**
   * GET /concepts/:id/lesson
   * Returns the full lesson content for a concept
   * 
   * Returns sections in order: intro, explanation, example, etc.
   */
  async getLessonContent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verify concept exists
      const concept = await Concept.findById(id);

      if (!concept) {
        return res.status(404).json({
          success: false,
          error: `Concept with ID "${id}" not found`,
        });
      }

      // Get all lesson sections for this concept
      const sections = await LessonSection.find({ conceptId: id })
        .select('-__v')
        .sort({ orderIndex: 1 });  // CRITICAL: Sort by orderIndex

      res.json({
        success: true,
        conceptId: id,
        conceptTitle: concept.title,
        estimatedMinutes: concept.estimatedMinutes,
        sectionsCount: sections.length,
        data: sections,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lesson content',
        message: error.message,
      });
    }
  }

  /**
   * GET /concepts/:id/questions
   * Returns practice questions for a concept
   * 
   * Query params:
   * - difficulty: easy, medium, hard
   * - limit: number of questions to return
   */
  async getQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { difficulty, limit } = req.query;

      // Verify concept exists
      const concept = await Concept.findById(id);

      if (!concept) {
        return res.status(404).json({
          success: false,
          error: `Concept with ID "${id}" not found`,
        });
      }

      // Build query
      let query: any = { conceptId: id };

      if (difficulty) {
        query.difficulty = difficulty;
      }

      // Fetch questions
      let questionsQuery = ConceptQuestion.find(query)
        .select('-__v');

      if (limit) {
        questionsQuery = questionsQuery.limit(Number(limit));
      }

      const questions = await questionsQuery;

      res.json({
        success: true,
        conceptId: id,
        conceptTitle: concept.title,
        filters: {
          difficulty: difficulty || 'all',
          limit: limit || 'none',
        },
        count: questions.length,
        data: questions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch questions',
        message: error.message,
      });
    }
  }
}