import { BaseParser, ParseResult } from './BaseParser';
import { 
  SubjectInfoSchema, 
  TopicSchema, 
  ConceptSchema, 
  LessonContentSchema,
  ConceptQuestionSchema 
} from '../validators/schemas';
import { validateRequiredSheets, splitCommaSeparated } from '../utils/helpers';

export class SubjectParser extends BaseParser {
  private readonly REQUIRED_SHEETS = [
    'Subject_Info',
    'Topics',
    'Concepts',
    'Lesson_Content',
    'Concept_Questions'
  ];

  async parse(): Promise<ParseResult> {
    try {
      await this.loadWorkbook();

      // Validate required sheets exist
      const sheetValidation = validateRequiredSheets(this.workbook.worksheets, this.REQUIRED_SHEETS);
      if (!sheetValidation.valid) {
        return {
          success: false,
          errors: [`Missing required sheets: ${sheetValidation.missing.join(', ')}`],
          warnings: [],
        };
      }

      // Parse each sheet
      const subjectInfo = this.parseSubjectInfo();
      const topics = this.parseTopics();
      const concepts = this.parseConcepts();
      const lessonContent = this.parseLessonContent();
      const conceptQuestions = this.parseConceptQuestions();

      // Validate referential integrity
      this.validateReferences(topics, concepts, lessonContent, conceptQuestions);

      // Check question count per concept
      this.validateQuestionCount(concepts, conceptQuestions);

      if (this.errors.length > 0) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
        };
      }

      return {
        success: true,
        type: 'subject',
        data: {
          subjectInfo,
          topics,
          concepts,
          lessonContent,
          conceptQuestions,
        },
        errors: [],
        warnings: this.warnings,
      };

    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  private parseSubjectInfo(): any {
    const rawData = this.parseInfoSheet('Subject_Info');
    
    if (!rawData) {
      this.errors.push('Failed to parse Subject_Info sheet');
      return null;
    }

    const normalized = this.normalizeRow(rawData);

    try {
      const validated = SubjectInfoSchema.parse(normalized);
      return {
        ...validated,
        boards_supported: splitCommaSeparated(validated.boards_supported),
      };
    } catch (error: any) {
      this.errors.push(`Subject_Info validation failed: ${error.message}`);
      return null;
    }
  }

  private parseTopics(): any[] {
    const rawData = this.parseSheet('Topics');
    const topics: any[] = [];

    rawData.forEach((row, index) => {
      const normalized = this.normalizeRow(row);

      try {
        const validated = TopicSchema.parse(normalized);
        topics.push(validated);
      } catch (error: any) {
        this.errors.push(`Topics row ${index + 2} validation failed: ${error.message}`);
      }
    });

    return topics;
  }

  private parseConcepts(): any[] {
    const rawData = this.parseSheet('Concepts');
    const concepts: any[] = [];

    rawData.forEach((row, index) => {
      const normalized = this.normalizeRow(row);

      try {
        const validated = ConceptSchema.parse(normalized);
        concepts.push(validated);
      } catch (error: any) {
        this.errors.push(`Concepts row ${index + 2} validation failed: ${error.message}`);
      }
    });

    return concepts;
  }

  private parseLessonContent(): any[] {
    const rawData = this.parseSheet('Lesson_Content');
    const lessons: any[] = [];

    rawData.forEach((row, index) => {
      const normalized = this.normalizeRow(row);

      try {
        const validated = LessonContentSchema.parse(normalized);
        lessons.push(validated);
      } catch (error: any) {
        this.errors.push(`Lesson_Content row ${index + 2} validation failed: ${error.message}`);
      }
    });

    return lessons;
  }

  private parseConceptQuestions(): any[] {
    const rawData = this.parseSheet('Concept_Questions');
    const questions: any[] = [];

    rawData.forEach((row, index) => {
      const normalized = this.normalizeRow(row);

      try {
        const validated = ConceptQuestionSchema.parse(normalized);
        questions.push(validated);
      } catch (error: any) {
        this.errors.push(`Concept_Questions row ${index + 2} validation failed: ${error.message}`);
      }
    });

    return questions;
  }

  private validateReferences(topics: any[], concepts: any[], lessonContent: any[], questions: any[]): void {
    // Get all valid codes
    const topicCodes = new Set(topics.map(t => t.topic_code));
    const conceptCodes = new Set(concepts.map(c => c.concept_code));

    // Validate concept.topic_code references
    concepts.forEach(concept => {
      if (!topicCodes.has(concept.topic_code)) {
        this.errors.push(`Concept "${concept.concept_code}" references unknown topic "${concept.topic_code}"`);
      }
    });

    // Validate lesson_content.concept_code references
    lessonContent.forEach(lesson => {
      if (!conceptCodes.has(lesson.concept_code)) {
        this.errors.push(`Lesson content references unknown concept "${lesson.concept_code}"`);
      }
    });

    // Validate question.concept_code references
    questions.forEach(question => {
      if (!conceptCodes.has(question.concept_code)) {
        this.errors.push(`Question "${question.question_code}" references unknown concept "${question.concept_code}"`);
      }
    });

    // Check for duplicate codes
    this.checkDuplicates(topics.map(t => t.topic_code), 'topic_code');
    this.checkDuplicates(concepts.map(c => c.concept_code), 'concept_code');
    this.checkDuplicates(questions.map(q => q.question_code), 'question_code');
  }

  private validateQuestionCount(concepts: any[], questions: any[]): void {
    const questionCounts = new Map<string, number>();

    questions.forEach(q => {
      const count = questionCounts.get(q.concept_code) || 0;
      questionCounts.set(q.concept_code, count + 1);
    });

    concepts.forEach(concept => {
      const count = questionCounts.get(concept.concept_code) || 0;
      
      if (count < 10) {
        this.warnings.push(
          `Concept "${concept.concept_code}" has only ${count} questions (recommended: 10-15)`
        );
      } else if (count > 15) {
        this.warnings.push(
          `Concept "${concept.concept_code}" has ${count} questions (recommended: 10-15)`
        );
      }
    });
  }

  private checkDuplicates(codes: string[], fieldName: string): void {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    codes.forEach(code => {
      if (seen.has(code)) {
        duplicates.add(code);
      }
      seen.add(code);
    });

    if (duplicates.size > 0) {
      this.errors.push(
        `Duplicate ${fieldName} found: ${Array.from(duplicates).join(', ')}`
      );
    }
  }
}