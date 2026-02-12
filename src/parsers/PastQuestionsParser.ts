import { BaseParser, ParseResult } from './BaseParser';
import { ExamInfoSchema, PastQuestionSchema } from '../validators/schemas';
import { validateRequiredSheets } from '../utils/helpers';

export class PastQuestionsParser extends BaseParser {
  private readonly REQUIRED_SHEETS = ['Exam_Info', 'Questions'];

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

      // Parse sheets
      const examInfo = this.parseExamInfo();
      const questions = this.parseQuestions();

      if (this.errors.length > 0) {
        return {
          success: false,
          errors: this.errors,
          warnings: this.warnings,
        };
      }

      return {
        success: true,
        type: 'past_questions',
        data: {
          examInfo,
          questions,
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

  private parseExamInfo(): any {
    const rawData = this.parseInfoSheet('Exam_Info');
    
    if (!rawData) {
      this.errors.push('Failed to parse Exam_Info sheet');
      return null;
    }

    const normalized = this.normalizeRow(rawData);

    try {
      return ExamInfoSchema.parse(normalized);
    } catch (error: any) {
      this.errors.push(`Exam_Info validation failed: ${error.message}`);
      return null;
    }
  }

  private parseQuestions(): any[] {
    const rawData = this.parseSheet('Questions');
    const questions: any[] = [];

    rawData.forEach((row, index) => {
      const normalized = this.normalizeRow(row);

      try {
        const validated = PastQuestionSchema.parse(normalized);
        questions.push(validated);
      } catch (error: any) {
        this.errors.push(`Questions row ${index + 2} validation failed: ${error.message}`);
      }
    });

    return questions;
  }
}