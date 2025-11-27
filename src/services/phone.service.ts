/**
 * Phone Number Normalization Service
 * Converts all formats to standard format: "5392174782"
 * Removes: +90, 0, spaces, dashes, parentheses
 */

/**
 * Normalize phone number to standard format
 * Removes all formatting and country codes
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone (10 digits starting with 5)
 *
 * @example
 * normalizePhone('0539 217 47 82')      // '5392174782'
 * normalizePhone('+90 539 217 47 82')   // '5392174782'
 * normalizePhone('539-217-47-82')       // '5392174782'
 * normalizePhone('(0539) 217 47 82')    // '5392174782'
 * normalizePhone('+90-539-217-47-82')   // '5392174782'
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Remove country code +90 if present
  if (cleaned.startsWith('90')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Format phone for display
 * Converts "5392174782" to "0539 217 47 82"
 *
 * @param phone - Normalized phone number
 * @returns Formatted phone for display
 *
 * @example
 * formatPhoneForDisplay('5392174782')  // '0539 217 47 82'
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);

  if (normalized.length !== 10) {
    return phone; // Return original if invalid length
  }

  return `0${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 8)} ${normalized.substring(8, 10)}`;
}

/**
 * Validate Turkish mobile phone number
 * Must start with 5 and be 10 digits total
 *
 * @param phone - Phone number to validate
 * @returns true if valid Turkish mobile number
 *
 * @example
 * isValidPhone('5392174782')           // true
 * isValidPhone('0539 217 47 82')       // true (normalized first)
 * isValidPhone('4123456789')           // false (doesn't start with 5)
 * isValidPhone('539217478')            // false (too short)
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Turkish mobile: starts with 5, exactly 10 digits
  return /^5\d{9}$/.test(normalized);
}

/**
 * Detect phone number format
 *
 * @param phone - Phone number
 * @returns Format type
 */
export function detectPhoneFormat(phone: string): 'international' | 'national' | 'local' | 'unknown' {
  if (phone.startsWith('+90') || phone.startsWith('0090')) {
    return 'international';
  }
  if (phone.startsWith('0')) {
    return 'national';
  }
  if (phone.startsWith('5')) {
    return 'local';
  }
  return 'unknown';
}
