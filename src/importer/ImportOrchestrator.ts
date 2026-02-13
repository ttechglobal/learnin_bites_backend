import { FileScanner, ContentFile } from './FileScanner';
import { ParserFactory } from '../parsers';
import { DatabaseImporter, ImportResult } from './DatabaseImporter';

/**
 * ImportOrchestrator: The main controller that ties everything together
 * 
 * This is what runs when the server starts
 * 
 * Flow:
 * 1. Scan for files
 * 2. Parse each file
 * 3. Import valid files to database
 * 4. Report results
 */

export interface ImportSummary {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  results: ImportResult[];
}

export class ImportOrchestrator {
  private scanner: FileScanner;
  private importer: DatabaseImporter;

  constructor() {
    this.scanner = new FileScanner();
    this.importer = new DatabaseImporter();
  }

  /**
   * Import all content files
   * 
   * This is the main entry point called on server startup
   */
  async importAll(): Promise<ImportSummary> {
    console.log('🔍 Scanning for content files...');
    
    const files = this.scanner.scanAllFiles();
    
    console.log(`📁 Found ${files.length} files to import`);

    const results: ImportResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each file
    for (const file of files) {
      console.log(`\n📄 Processing: ${file.fileName}`);
      
      const result = await this.importFile(file);
      results.push(result);

      if (result.success) {
        successCount++;
        console.log(`✅ Success: ${result.recordsImported} created, ${result.recordsUpdated} updated`);
      } else {
        failureCount++;
        console.log(`❌ Failed: ${result.errors.join(', ')}`);
      }

      // Display warnings if any
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          console.log(`⚠️  Warning: ${warning}`);
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Files: ${files.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log('='.repeat(50) + '\n');

    return {
      totalFiles: files.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Import a single file
   * 
   * Steps:
   * 1. Create appropriate parser
   * 2. Parse the file
   * 3. If valid, import to database
   * 4. Return result
   */
  private async importFile(file: ContentFile): Promise<ImportResult> {
    try {
      // STEP 1: Create parser based on file type
      const parser = await ParserFactory.createParser(file.filePath);

      // STEP 2: Parse the file
      const parseResult = await parser.parse();

      // STEP 3: If parsing failed, return errors
      if (!parseResult.success) {
        return {
          success: false,
          fileName: file.fileName,
          type: parseResult.type || 'unknown',
          recordsImported: 0,
          recordsUpdated: 0,  // ← ADD THIS
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        };
      }

      // STEP 4: Import to database based on type
      let importResult: ImportResult;

      if (parseResult.type === 'subject') {
        importResult = await this.importer.importSubject(parseResult.data, file.fileName);
      } else if (parseResult.type === 'past_questions') {
        importResult = await this.importer.importPastQuestions(parseResult.data, file.fileName);
      } else {
        return {
          success: false,
          fileName: file.fileName,
          type: parseResult.type || 'unknown',
          recordsImported: 0,
          recordsUpdated: 0,  // ← ADD THIS
          errors: ['Unsupported file type'],
          warnings: [],
        };
      }

      // Merge parse warnings with import result
      importResult.warnings = [...parseResult.warnings, ...importResult.warnings];

      return importResult;

    } catch (error: any) {
      return {
        success: false,
        fileName: file.fileName,
        type: 'unknown',
        recordsImported: 0,
        recordsUpdated: 0,  // ← ADD THIS
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * Import only files from a specific category
   */
  async importCategory(category: 'subjects' | 'past-questions' | 'modules'): Promise<ImportSummary> {
    const files = this.scanner.scanCategory(category);
    
    const results: ImportResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const result = await this.importFile(file);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      totalFiles: files.length,
      successCount,
      failureCount,
      results,
    };
  }
}