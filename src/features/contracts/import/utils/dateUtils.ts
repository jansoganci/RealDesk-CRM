/**
 * Date utility functions for contract import
 */

/**
 * Convert date format from "01/01/2024" or "01.01.2024" to "2024-01-01"
 * Used when parsing dates from PDF documents
 */
export function convertDateFormat(dateStr: string): string {
  const parts = dateStr.split(/[./]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return '';
}

