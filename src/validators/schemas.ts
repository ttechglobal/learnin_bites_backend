import { z } from 'zod';

// Subject validation schemas
export const SubjectInfoSchema = z.object({
  subject_code: z.string().min(1, 'Subject code is required'),
  subject_name: z.string().min(1, 'Subject name is required'),
  category: z.string().min(1, 'Category is required'),
  level: z.string().min(1, 'Level is required'),
  description: z.string().min(1, 'Description is required'),
  version: z.string().min(1, 'Version is required'),
  boards_supported: z.string().min(1, 'Boards supported is required'),
});

export const TopicSchema = z.object({
  topic_code: z.string().min(1, 'Topic code is required'),
  name: z.string().min(1, 'Topic name is required'),
  description: z.string().min(1, 'Description is required'),
  order_index: z.number().int().min(0, 'Order index must be >= 0'),
});

export const ConceptSchema = z.object({
  concept_code: z.string().min(1, 'Concept code is required'),
  topic_code: z.string().min(1, 'Topic code is required'),
  title: z.string().min(1, 'Title is required'),
  short_description: z.string().min(1, 'Short description is required'),
  order_index: z.number().int().min(0, 'Order index must be >= 0'),
  estimated_minutes: z.number().int().min(1, 'Estimated minutes must be >= 1'),
});

export const LessonContentSchema = z.object({
  concept_code: z.string().min(1, 'Concept code is required'),
  section_type: z.enum(['intro', 'explanation', 'example', 'formula', 'key_point', 'mistake', 'summary'], {
    message: 'Invalid section type' ,
  }),
  content: z.string().min(1, 'Content is required'),
  order_index: z.number().int().min(0, 'Order index must be >= 0'),
});

export const ConceptQuestionSchema = z.object({
  question_code: z.string().min(1, 'Question code is required'),
  concept_code: z.string().min(1, 'Concept code is required'),
  question_text: z.string().min(1, 'Question text is required'),
  option_a: z.string().min(1, 'Option A is required'),
  option_b: z.string().min(1, 'Option B is required'),
  option_c: z.string().min(1, 'Option C is required'),
  option_d: z.string().min(1, 'Option D is required'),
  correct_answer: z.enum(['A', 'B', 'C', 'D'], {
     message: 'Correct answer must be A, B, C, or D',
  }),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
     message: 'Difficulty must be easy, medium, or hard',
  }),
  hint: z.string().optional(),
  explanation: z.string().min(1, 'Explanation is required'),
});

// Past Questions validation schemas
export const ExamInfoSchema = z.object({
  exam_board: z.string().min(1, 'Exam board is required'),
  subject_code: z.string().min(1, 'Subject code is required'),
  years_covered: z.string().min(1, 'Years covered is required'),
  version: z.string().min(1, 'Version is required'),
});

export const PastQuestionSchema = z.object({
  year: z.number().int().min(1900, 'Year must be valid').max(2100, 'Year must be valid'),
  question_number: z.number().int().min(1, 'Question number must be >= 1'),
  topic_code: z.string().optional(),
  concept_code: z.string().optional(),
  question_text: z.string().min(1, 'Question text is required'),
  option_a: z.string().min(1, 'Option A is required'),
  option_b: z.string().min(1, 'Option B is required'),
  option_c: z.string().min(1, 'Option C is required'),
  option_d: z.string().min(1, 'Option D is required'),
  correct_answer: z.enum(['A', 'B', 'C', 'D'], {
     message: 'Correct answer must be A, B, C, or D',
  }),
  explanation: z.string().min(1, 'Explanation is required'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
     message: 'Difficulty must be easy, medium, or hard',
  }),
});

// Module validation schemas (for future use)
export const ModuleInfoSchema = z.object({
  module_code: z.string().min(1, 'Module code is required'),
  module_name: z.string().min(1, 'Module name is required'),
  subject_code: z.string().min(1, 'Subject code is required'),
  description: z.string().min(1, 'Description is required'),
  version: z.string().min(1, 'Version is required'),
});