import mongoose from 'mongoose';
import { 
  Subject, 
  Topic, 
  Concept, 
  LessonSection, 
  ConceptQuestion, 
  PastQuestion 
} from '../models';

export interface ImportResult {
  success: boolean;
  fileName: string;
  type: string;
  recordsImported: number;
  recordsUpdated: number;
  errors: string[];
  warnings: string[];
}

export class DatabaseImporter {
  
  /**
   * Import a subject spreadsheet
   * Strategy: Upsert (update if exists, create if not)
   */
  async importSubject(data: any, fileName: string): Promise<ImportResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { subjectInfo, topics, concepts, lessonContent, conceptQuestions } = data;

      let recordsImported = 0;
      let recordsUpdated = 0;

      console.log(`\n📦 Processing subject: ${subjectInfo.subject_code}`);

      // ========================================
      // STEP 1: UPSERT SUBJECT
      // ========================================
      const existingSubject = await Subject.findOne({ code: subjectInfo.subject_code }).session(session);

      let subject;
      if (existingSubject) {
        console.log(`   ♻️  Updating existing subject`);
        
        // Update the subject
        await Subject.updateOne(
          { code: subjectInfo.subject_code },
          {
            $set: {
              name: subjectInfo.subject_name,
              category: subjectInfo.category,
              level: subjectInfo.level,
              description: subjectInfo.description,
              version: subjectInfo.version,
              boardsSupported: subjectInfo.boards_supported,
              updatedAt: new Date(),
            }
          },
          { session }
        );
        
        subject = existingSubject;
        recordsUpdated++;

        // Delete all child data (we'll recreate it fresh)
        console.log(`   🧹 Cleaning old data...`);
        
        const existingTopics = await Topic.find({ subjectId: subject._id }).session(session);
        const topicIds = existingTopics.map(t => t._id);

        if (topicIds.length > 0) {
          const existingConcepts = await Concept.find({ topicId: { $in: topicIds } }).session(session);
          const conceptIds = existingConcepts.map(c => c._id);

          if (conceptIds.length > 0) {
            await LessonSection.deleteMany({ conceptId: { $in: conceptIds } }, { session });
            await ConceptQuestion.deleteMany({ conceptId: { $in: conceptIds } }, { session });
          }

          await Concept.deleteMany({ topicId: { $in: topicIds } }, { session });
        }

        await Topic.deleteMany({ subjectId: subject._id }, { session });
        console.log(`   ✅ Old data cleaned`);

      } else {
        console.log(`   ✨ Creating new subject`);
        
        const newSubject = await Subject.create([{
          code: subjectInfo.subject_code,
          name: subjectInfo.subject_name,
          category: subjectInfo.category,
          level: subjectInfo.level,
          description: subjectInfo.description,
          version: subjectInfo.version,
          boardsSupported: subjectInfo.boards_supported,
        }], { session });
        
        subject = newSubject[0];
        recordsImported++;
      }

      // ========================================
      // STEP 2: CREATE TOPICS
      // ========================================
      console.log(`   📚 Creating ${topics.length} topics...`);
      const topicMap = new Map<string, mongoose.Types.ObjectId>();

      for (const topicData of topics) {
        const topic = await Topic.create([{
          subjectId: subject._id,
          code: topicData.topic_code,
          name: topicData.name,
          description: topicData.description,
          orderIndex: topicData.order_index,
        }], { session });

        topicMap.set(topicData.topic_code, topic[0]._id);
        recordsImported++;
      }
      console.log(`   ✅ Topics created`);

      // ========================================
      // STEP 3: CREATE CONCEPTS
      // ========================================
      console.log(`   💡 Creating ${concepts.length} concepts...`);
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
      console.log(`   ✅ Concepts created`);

      // ========================================
      // STEP 4: CREATE LESSON SECTIONS
      // ========================================
      console.log(`   📖 Creating ${lessonContent.length} lesson sections...`);
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
      console.log(`   ✅ Lesson sections created`);

      // ========================================
      // STEP 5: CREATE CONCEPT QUESTIONS
      // ========================================
      console.log(`   ❓ Creating ${conceptQuestions.length} questions...`);
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
      console.log(`   ✅ Questions created`);

      // ========================================
      // COMMIT TRANSACTION
      // ========================================
      await session.commitTransaction();
      console.log(`   💾 Changes committed to database`);

      return {
        success: true,
        fileName,
        type: 'subject',
        recordsImported,
        recordsUpdated,
        errors: [],
        warnings: [],
      };

    } catch (error: any) {
      await session.abortTransaction();
      console.log(`   ❌ Import failed, rolling back...`);
      
      return {
        success: false,
        fileName,
        type: 'subject',
        recordsImported: 0,
        recordsUpdated: 0,
        errors: [error.message],
        warnings: [],
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Import past questions spreadsheet
   * Strategy: Delete existing questions for this board+subject, then insert fresh
   */
  async importPastQuestions(data: any, fileName: string): Promise<ImportResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { examInfo, questions } = data;

      console.log(`\n📝 Processing past questions: ${examInfo.exam_board} - ${examInfo.subject_code}`);

      // Delete existing questions for this exam board + subject combination
      const deleteResult = await PastQuestion.deleteMany({
        examBoard: examInfo.exam_board,
        subjectCode: examInfo.subject_code,
      }, { session });

      console.log(`   🧹 Deleted ${deleteResult.deletedCount} existing questions`);

      let recordsImported = 0;

      // Insert all questions fresh
      console.log(`   ❓ Creating ${questions.length} questions...`);
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
      console.log(`   💾 Changes committed to database`);

      return {
        success: true,
        fileName,
        type: 'past_questions',
        recordsImported,
        recordsUpdated: 0,
        errors: [],
        warnings: [],
      };

    } catch (error: any) {
      await session.abortTransaction();
      console.log(`   ❌ Import failed, rolling back...`);
      
      return {
        success: false,
        fileName,
        type: 'past_questions',
        recordsImported: 0,
        recordsUpdated: 0,
        errors: [error.message],
        warnings: [],
      };
    } finally {
      session.endSession();
    }
  }
}