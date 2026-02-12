import ExcelJS from 'exceljs';
import { BaseParser } from './BaseParser';
import { SubjectParser } from './SubjectParser';
import { PastQuestionsParser } from './PastQuestionsParser';

/**
 * ParserFactory: Creates the appropriate parser based on file type
 * 
 * How it works:
 * 1. Opens the Excel file
 * 2. Looks at the sheet names
 * 3. Returns the correct parser (SubjectParser or PastQuestionsParser)
 */

export class ParserFactory {
  
  /**
   * Create the appropriate parser for a file
   * 
   * CHANGED: We no longer create a BaseParser instance
   * Instead, we read the file directly to detect type
   */
  static async createParser(filePath: string): Promise<BaseParser> {
    try {
      // STEP 1: Load the workbook to detect type
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // STEP 2: Get all sheet names
      const sheetNames = workbook.worksheets.map(ws => ws.name);

      // STEP 3: Detect type based on sheet names
      let type: 'subject' | 'past_questions' | 'module' | null = null;

      if (sheetNames.includes('Subject_Info')) {
        type = 'subject';
      } else if (sheetNames.includes('Exam_Info')) {
        type = 'past_questions';
      } else if (sheetNames.includes('Module_Info')) {
        type = 'module';
      }

      // STEP 4: Return the appropriate parser
      switch (type) {
        case 'subject':
          return new SubjectParser(filePath);
        
        case 'past_questions':
          return new PastQuestionsParser(filePath);
        
        case 'module':
          throw new Error('Module parser not implemented yet (v1 scope)');
        
        default:
          throw new Error(
            `Unknown spreadsheet type. File must contain one of these sheets: Subject_Info, Exam_Info, or Module_Info. ` +
            `Found sheets: ${sheetNames.join(', ')}`
          );
      }

    } catch (error: any) {
      // If it's our custom error, rethrow it
      if (error.message.includes('Unknown spreadsheet type') || 
          error.message.includes('Module parser not implemented')) {
        throw error;
      }
      
      // Otherwise, it's a file reading error
      throw new Error(`Failed to read file "${filePath}": ${error.message}`);
    }
  }
}