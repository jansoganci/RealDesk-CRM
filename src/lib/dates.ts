import { startOfDay, addDays, differenceInDays, parseISO, format } from 'date-fns';

/**
 * Get today's date at start of day (00:00:00) in local timezone
 * Returns immutable Date object
 */
export function getToday(): Date {
  return startOfDay(new Date());
}

/**
 * Parse an ISO date string and return start of day in local timezone
 * @param dateString - ISO date string (e.g., "2024-01-15")
 * @returns Date object at start of day
 */
export function parseDateToStartOfDay(dateString: string): Date {
  return startOfDay(parseISO(dateString));
}

/**
 * Add days to a date immutably
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Calculate difference in days between two dates
 * @param laterDate - Later date
 * @param earlierDate - Earlier date
 * @returns Number of days difference (can be negative)
 */
export function daysDifference(laterDate: Date, earlierDate: Date): number {
  return differenceInDays(laterDate, earlierDate);
}

/**
 * Format date as YYYY-MM-DD for database storage
 * @param date - Date to format
 * @returns ISO date string (YYYY-MM-DD)
 */
export function formatDateForDb(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a YYYY-MM-DD (or ISO) date string for US UI display.
 * @returns MM/dd/yyyy, or empty string if invalid/missing
 */
export function formatDateDisplayUS(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(parseDateToStartOfDay(iso), 'MM/dd/yyyy');
  } catch {
    return '';
  }
}

/**
 * Parse a form date value (YYYY-MM-DD) into a local Date for calendar selection.
 */
export function parseDateInputValue(
  iso: string | null | undefined
): Date | undefined {
  if (!iso) return undefined;
  try {
    const parsed = parseDateToStartOfDay(iso);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

/**
 * Check if a date is between two other dates (inclusive)
 * @param date - Date to check
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns True if date is between startDate and endDate
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const parsedDate = startOfDay(date);
  const parsedStart = startOfDay(startDate);
  const parsedEnd = startOfDay(endDate);
  return parsedDate >= parsedStart && parsedDate <= parsedEnd;
}

