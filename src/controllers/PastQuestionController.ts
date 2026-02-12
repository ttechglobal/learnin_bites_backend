import { Request, Response } from 'express';
import { PastQuestion } from '../models';

export class PastQuestionController {
  
  /**
   * GET /past-questions/:board/:subject
   * Returns past questions for a specific exam board and subject
   * 
   * Example: GET /past-questions/WAEC/MATH001?year=2023&limit=20
   * 
   * Query params:
   * - year: filter by year
   * - topic: filter by topic code
   * - limit: max number of questions
   */
  async getPastQuestions(req: Request, res: Response) {
    try {
      const { board, subject } = req.params;
      const { year, topic, limit } = req.query;

      // Build query
      let query: any = {
        examBoard: board,
        subjectCode: subject,
      };

      if (year) {
        query.year = Number(year);
      }

      if (topic) {
        query.topicCode = topic;
      }

      // Fetch questions
      let questionsQuery = PastQuestion.find(query)
        .select('-__v')
        .sort({ year: -1, questionNumber: 1 });  // Latest first, then by question number

      if (limit) {
        questionsQuery = questionsQuery.limit(Number(limit));
      }

      const questions = await questionsQuery;

      res.json({
        success: true,
        examBoard: board,
        subjectCode: subject,
        filters: {
          year: year || 'all',
          topic: topic || 'all',
          limit: limit || 'none',
        },
        count: questions.length,
        data: questions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch past questions',
        message: error.message,
      });
    }
  }
}