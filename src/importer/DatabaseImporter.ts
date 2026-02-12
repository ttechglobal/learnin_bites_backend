import mongoose from 'mongoose';
import { 
  Subject, 
  Topic, 
  Concept, 
  LessonSection, 
  ConceptQuestion, 
  PastQuestion 
} from '../models';

/**
 * DatabaseImporter: Saves parsed data to MongoDB
 * 
 * Key concept: TRANSACTIONS
 * - All data from one file is saved together
 * - If ANY part fails, EVERYTHING rolls back
 * - This keeps data consistent (no partial imports)
 */

export interface ImportResult {
  success: boolean;
  fileName: string;
  type: string;
  recordsImported: number;
  errors: string[];
  warnings: string[];
}

export class DatabaseImporter {
  
  /**
   * Import a subject spreadsheet
   * 
   * Process:
   * 1. Start a transaction
   * 2. Delete existing subject with same code (if exists)
   * 3. Insert new subject data
   * 4. Insert all related data (topics, concepts, lessons, questions)
   * 5. Commit transaction (save everything)
   * 
   * If anything fails → rollback (nothing is saved)
   */
  async importSubject(data: any, fileName: string): Promise<ImportResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { subjectInfo, topics, concepts, lessonContent, conceptQuestions } = data;

      // STEP 1: Delete existing subject if it exists
      // Why? So we can update content by replacing the file
      await Subject.deleteOne({ code: subjectInfo.subject_code }, { session });
      
      // Also delete all related data (cascade delete)
      const existingSubject = await Subject.findOne({ code: subjectInfo.subject_code });
      if (existingSubject) {
        await Topic.deleteMany({ subjectId: existingSubject._id }, { session });
        // Topics deletion will cascade to concepts, lessons, and questions
      }

      // STEP 2: Create new subject
      const subject = await Subject.create([{
        code: subjectInfo.subject_code,
        name: subjectInfo.subject_name,
        category: subjectInfo.category,
        level: subjectInfo.level,
        description: subjectInfo.description,
        version: subjectInfo.version,
        boardsSupported: subjectInfo.boards_supported,
      }], { session });

      let recordsImported = 1; // Count the subject

      // STEP 3: Create topics and build a code-to-ID map
      // Why? We need MongoDB IDs to link concepts to topics
      const topicMap = new Map<string, mongoose.Types.ObjectId>();

      for (const topicData of topics) {
        const topic = await Topic.create([{
          subjectId: subject[0]._id,
          code: topicData.topic_code,
          name: topicData.name,
          description: topicData.description,
          orderIndex: topicData.order_index,
        }], { session });

        topicMap.set(topicData.topic_code, topic[0]._id);
        recordsImported++;
      }

      // STEP 4: Create concepts and build a code-to-ID map
      const conceptMap = new Map<string, mongoose.Types.ObjectId>();

      for (const conceptData of concepts) {
        const topicId = topicMap.get(conceptData.topic_code);
        
        if (!topicId) {
          throw new Error(`Topic ${conceptData.topic_code} not found for concept ${conceptData.concept_code}`);
        }

        const concept = await Concept.create([{
          topicId: topicId,
          code: conceptData.concept_code,
          title: conceptData.title,
          shortDescription: conceptData.short_description,
          orderIndex: conceptData.order_index,
          estimatedMinutes: conceptData.estimated_minutes,
        }], { session });

        conceptMap.set(conceptData.concept_code, concept[0]._id);
        recordsImported++;
      }

      // STEP 5: Create lesson sections
      for (const lessonData of lessonContent) {
        const conceptId = conceptMap.get(lessonData.concept_code);
        
        if (!conceptId) {
          throw new Error(`Concept ${lessonData.concept_code} not found for lesson`);
        }

        await LessonSection.create([{
          conceptId: conceptId,
          sectionType: lessonData.section_type,
          content: lessonData.content,
          orderIndex: lessonData.order_index,
        }], { session });

        recordsImported++;
      }

      // STEP 6: Create concept questions
      for (const questionData of conceptQuestions) {
        const conceptId = conceptMap.get(questionData.concept_code);
        
        if (!conceptId) {
          throw new Error(`Concept ${questionData.concept_code} not found for question ${questionData.question_code}`);
        }

        await ConceptQuestion.create([{
          conceptId: conceptId,
          code: questionData.question_code,
          questionText: questionData.question_text,
          optionA: questionData.option_a,
          optionB: questionData.option_b,
          optionC: questionData.option_c,
          optionD: questionData.option_d,
          correctAnswer: questionData.correct_answer,
          difficulty: questionData.difficulty,
          hint: questionData.hint,
          explanation: questionData.explanation,
        }], { session });

        recordsImported++;
      }

      // COMMIT: Save everything to database
      await session.commitTransaction();

      return {
        success: true,
        fileName,
        type: 'subject',
        recordsImported,
        errors: [],
        warnings: [],
      };

    } catch (error: any) {
      // ROLLBACK: If anything failed, undo everything
      await session.abortTransaction();
      
      return {
        success: false,
        fileName,
        type: 'subject',
        recordsImported: 0,
        errors: [error.message],
        warnings: [],
      };
    } finally {
      // Always end the session
      session.endSession();
    }
  }

  /**
   * Import past questions spreadsheet
   * 
   * Simpler than subjects - just exam info and questions
   */
  async importPastQuestions(data: any, fileName: string): Promise<ImportResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { examInfo, questions } = data;

      // Delete existing questions for this exam board + subject
      await PastQuestion.deleteMany({
        examBoard: examInfo.exam_board,
        subjectCode: examInfo.subject_code,
      }, { session });

      let recordsImported = 0;

      // Insert all questions
      for (const questionData of questions) {
        await PastQuestion.create([{
          examBoard: examInfo.exam_board,
          subjectCode: examInfo.subject_code,
          year: questionData.year,
          questionNumber: questionData.question_number,
          topicCode: questionData.topic_code,
          conceptCode: questionData.concept_code,
          questionText: questionData.question_text,
          optionA: questionData.option_a,
          optionB: questionData.option_b,
          optionC: questionData.option_c,
          optionD: questionData.option_d,
          correctAnswer: questionData.correct_answer,
          explanation: questionData.explanation,
          difficulty: questionData.difficulty,
        }], { session });

        recordsImported++;
      }

      await session.commitTransaction();

      return {
        success: true,
        fileName,
        type: 'past_questions',
        recordsImported,
        errors: [],
        warnings: [],
      };

    } catch (error: any) {
      await session.abortTransaction();
      
      return {
        success: false,
        fileName,
        type: 'past_questions',
        recordsImported: 0,
        errors: [error.message],
        warnings: [],
      };
    } finally {
      session.endSession();
    }
  }
}