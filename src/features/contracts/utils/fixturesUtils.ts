/**
 * Fixtures Utility Functions
 * 
 * Helper functions for parsing and formatting fixtures data
 * between component state (array) and form/database storage (string)
 */

/**
 * Parse comma-separated string to array
 * Handles empty strings, null, undefined, and whitespace
 * 
 * @param value - Comma-separated string (e.g., "Kombi,Klima,Buzdolabı")
 * @returns Array of trimmed strings (e.g., ["Kombi", "Klima", "Buzdolabı"])
 */
export function parseFixturesString(value: string | null | undefined): string[] {
  if (!value || value.trim() === '') {
    return [];
  }
  
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Convert array to comma-separated string
 * Used for form submission and database storage
 * 
 * @param items - Array of fixture names
 * @returns Comma-separated string (e.g., "Kombi,Klima,Buzdolabı")
 */
export function formatFixturesArray(items: string[]): string {
  if (!items || items.length === 0) {
    return '';
  }
  
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .join(',');
}

/**
 * Format fixtures for PDF display
 * Converts to readable format with comma + space
 * Returns '-' if empty (per requirement)
 * 
 * @param value - Comma-separated string or null/undefined
 * @returns Formatted string for PDF (e.g., "Kombi, Klima, Buzdolabı") or "-" if empty
 */
export function formatFixturesForPdf(value: string | null | undefined): string {
  const items = parseFixturesString(value);
  
  if (items.length === 0) {
    return '-';
  }
  
  return items.join(', ');
}
