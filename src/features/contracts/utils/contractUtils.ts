import { parseDateToStartOfDay, getToday, daysDifference } from '../../../lib/dates';

/**
 * Contract Utility Functions
 * Helper functions for contract-related calculations and checks
 */

/**
 * Check if a contract is expiring soon (within 90 days)
 * Only checks active contracts
 * 
 * @param endDate - Contract end date (ISO string)
 * @param status - Contract status ('Active', 'Inactive', 'Archived')
 * @returns True if contract is active and expiring within 90 days
 */
export function isExpiringSoon(endDate: string, status: string): boolean {
  if (status !== 'Active') return false;
  
  const end = parseDateToStartOfDay(endDate);
  const today = getToday();
  const daysUntilExpiry = daysDifference(end, today);
  
  return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
}

