import ExcelJS from 'exceljs';
import { getSheetByName, rowToObject, normalizeString, normalizeNumber } from '../utils/helpers';

export interface ParseResult {
  success: boolean;
  type?: 'subject' | 'past_questions' | 'module';
  data?: any;
  errors: string[];
  warnings: string[];
}

export abstract class BaseParser {
  // ↑ CHANGED: Made this an abstract class
  // This means it MUST be extended by other parsers
  
  protected workbook: ExcelJS.Workbook;
  protected filePath: string;
  protected errors: string[] = [];
  protected warnings: string[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Load the Excel file into memory
   */
  async loadWorkbook(): Promise<void> {
    try {
      await this.workbook.xlsx.readFile(this.filePath);
    } catch (error: any) {
      throw new Error(`Failed to load workbook: ${error.message}`);
    }
  }

  /**
   * Detect spreadsheet type by looking at sheet names
   */
  protected detectSpreadsheetType(): 'subject' | 'past_questions' | 'module' | null {
    const sheetNames = this.workbook.worksheets.map(ws => ws.name);

    if (sheetNames.includes('Subject_Info')) {
      return 'subject';
    } else if (sheetNames.includes('Exam_Info')) {
      return 'past_questions';
    } else if (sheetNames.includes('Module_Info')) {
      return 'module';
    }

    return null;
  }

  /**
   * ABSTRACT METHOD: Must be implemented by child classes
   * 
   * This is the main parsing method that each specific parser must define
   */
  abstract parse(): Promise<ParseResult>;
  // ↑ This tells TypeScript: "Every class that extends BaseParser MUST have a parse() method"

  /**
   * Parse a data sheet (with multiple rows)
   * 
   * Example: Topics sheet, Concepts sheet, Questions sheet
   */
  protected parseSheet(sheetName: string): any[] {
    const sheet = getSheetByName(this.workbook, sheetName);
    
    if (!sheet) {
      this.errors.push(`Sheet "${sheetName}" not found`);
      return [];
    }

    const rows: any[] = [];
    const headers: string[] = [];

    // Get headers from first row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell: { value: any; }, colNumber: any) => {
      headers.push(normalizeString(cell.value));
    });

    // Parse data rows (skip header)
    sheet.eachRow((row: any, rowNumber: number) => {
      if (rowNumber === 1) return; // Skip header row

      const rowData = rowToObject(row, headers);
      
      // Skip empty rows
      const hasData = Object.values(rowData).some(val => 
        val !== null && val !== undefined && String(val).trim() !== ''
      );

      if (hasData) {
        rows.push(rowData);
      }
    });

    return rows;
  }

  /**
   * Parse an info sheet (single row of data)
   * 
   * Example: Subject_Info, Exam_Info
   * These sheets have headers in row 1 and data in row 2
   */
  protected parseInfoSheet(sheetName: string): any {
    const sheet = getSheetByName(this.workbook, sheetName);
    
    if (!sheet) {
      this.errors.push(`Sheet "${sheetName}" not found`);
      return null;
    }

    const info: any = {};
    const headers: string[] = [];

    // Get headers from first row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell: { value: any; }, colNumber: any) => {
      headers.push(normalizeString(cell.value));
    });

    // Get data from second row
    const dataRow = sheet.getRow(2);
    headers.forEach((header, index) => {
      const cell = dataRow.getCell(index + 1);
      info[header] = cell.value;
    });

    return info;
  }

  /**
   * Normalize a row of data
   * Converts strings and numbers to proper types
   */
  protected normalizeRow(row: any): any {
    const normalized: any = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (key.includes('order_index') || key.includes('estimated_minutes') || 
          key.includes('year') || key.includes('question_number')) {
        normalized[key] = normalizeNumber(value);
      } else {
        normalized[key] = normalizeString(value);
      }
    }

    return normalized;
  }

  /**
   * Get all errors collected during parsing
   */
  getErrors(): string[] {
    return this.errors;
  }

  /**
   * Get all warnings collected during parsing
   */
  getWarnings(): string[] {
    return this.warnings;
  }
}