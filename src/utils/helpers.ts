export const normalizeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const normalizeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const splitCommaSeparated = (value: string): string[] => {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

export const validateRequiredSheets = (
  worksheets: any,
  requiredSheets: string[]
): { valid: boolean; missing: string[] } => {
  const sheetNames = worksheets.map((ws: any) => ws.name);
  const missing = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
  
  return {
    valid: missing.length === 0,
    missing,
  };
};

export const getSheetByName = (workbook: any, sheetName: string): any => {
  return workbook.worksheets.find((ws: any) => ws.name === sheetName);
};

export const rowToObject = (row: any, headers: string[]): any => {
  const obj: any = {};
  headers.forEach((header, index) => {
    const cell = row.getCell(index + 1);
    obj[header] = cell.value;
  });
  return obj;
};