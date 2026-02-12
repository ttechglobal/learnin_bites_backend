import fs from 'fs';
import path from 'path';

/**
 * FileScanner: Finds all Excel files in the content directories
 * 
 * Why we need this:
 * - We don't want to hardcode file names
 * - Content creators can add new files anytime
 * - Server auto-discovers all content on startup
 */

export interface ContentFile {
  filePath: string;      // Full path: /content/subjects/mathematics.xlsx
  fileName: string;      // Just the name: mathematics.xlsx
  category: string;      // subjects, past-questions, or modules
}

export class FileScanner {
  private contentRoot: string;

  constructor(contentRoot: string = './content') {
    this.contentRoot = contentRoot;
  }

  /**
   * Scans all subdirectories and finds .xlsx files
   * 
   * How it works:
   * 1. Looks in /content/subjects
   * 2. Looks in /content/past-questions
   * 3. Looks in /content/modules
   * 4. Returns array of all Excel files found
   */
  scanAllFiles(): ContentFile[] {
    const files: ContentFile[] = [];

    // Categories to scan
    const categories = ['subjects', 'past-questions', 'modules'];

    categories.forEach(category => {
      const categoryPath = path.join(this.contentRoot, category);

      // Check if directory exists
      if (!fs.existsSync(categoryPath)) {
        console.log(`⚠️  Directory not found: ${categoryPath}`);
        return;
      }

      // Read all files in the directory
      const filesInDir = fs.readdirSync(categoryPath);

      // Filter only .xlsx files
      filesInDir.forEach(fileName => {
        if (fileName.endsWith('.xlsx') && !fileName.startsWith('~')) {
          // Skip temporary Excel files (start with ~$)
          
          files.push({
            filePath: path.join(categoryPath, fileName),
            fileName: fileName,
            category: category,
          });
        }
      });
    });

    return files;
  }

  /**
   * Scan a specific category only
   */
  scanCategory(category: 'subjects' | 'past-questions' | 'modules'): ContentFile[] {
    const categoryPath = path.join(this.contentRoot, category);
    const files: ContentFile[] = [];

    if (!fs.existsSync(categoryPath)) {
      return files;
    }

    const filesInDir = fs.readdirSync(categoryPath);

    filesInDir.forEach(fileName => {
      if (fileName.endsWith('.xlsx') && !fileName.startsWith('~')) {
        files.push({
          filePath: path.join(categoryPath, fileName),
          fileName: fileName,
          category: category,
        });
      }
    });

    return files;
  }
}