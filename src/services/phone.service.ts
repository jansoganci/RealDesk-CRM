/**
 * Phone Number Normalization Service (US NANP)
 * Converts common formats to a 10-digit national number and E.164 (+1) for storage.
 */

/**
 * Normalize phone number to 10 digits (national format, no country code)
 * Strips all non-digits; if 11 digits and the first is 1 (US country code), drops it.
 *
 * @param phone - Phone number in any format
 * @returns 10-digit string (e.g. "5125551234"), or fewer digits if input is incomplete
 *
 * @example
 * normalizePhone('(512) 555-1234')     // '5125551234'
 * normalizePhone('+1 512 555 1234')    // '5125551234'
 * normalizePhone('15125551234')        // '5125551234'
 * normalizePhone('512-555-1234')       // '5125551234'
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';

  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Format phone for display in US style: (NPA) NXX-XXXX
 *
 * @param phone - Phone in any format; normalized internally
 * @returns "(512) 555-1234", or the original string if not exactly 10 digits after normalization
 *
 * @example
 * formatPhoneForDisplay('5125551234')         // '(512) 555-1234'
 * formatPhoneForDisplay('+1 (512) 555-1234') // '(512) 555-1234'
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);

  if (normalized.length !== 10) {
    return phone;
  }

  return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6, 10)}`;
}

/**
 * Validate US NANP phone number (10 digits after normalization)
 * Area code (NPA): first digit cannot be 0 or 1
 * Exchange (NXX): first digit cannot be 0 or 1
 *
 * @param phone - Phone number to validate
 * @returns true if valid US number
 *
 * @example
 * isValidPhone('5125551234')           // true
 * isValidPhone('(512) 555-1234')       // true
 * isValidPhone('0125551234')           // false (invalid area code)
 * isValidPhone('5120551234')           // false (invalid exchange)
 * isValidPhone('512555123')            // false (too short)
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) {
    return false;
  }
  const areaFirst = normalized[0];
  const exchangeFirst = normalized[3];
  if (areaFirst === '0' || areaFirst === '1') {
    return false;
  }
  if (exchangeFirst === '0' || exchangeFirst === '1') {
    return false;
  }
  return /^\d{10}$/.test(normalized);
}

/**
 * Classify the raw input string by common US formatting patterns.
 *
 * @param phone - Phone number as entered
 * @returns Format category
 *
 * @example
 * detectPhoneFormat('+1 512 555 1234')   // 'international'
 * detectPhoneFormat('15125551234')     // 'international'
 * detectPhoneFormat('(512) 555-1234')  // 'national'
 * detectPhoneFormat('5125551234')      // 'local'
 * detectPhoneFormat('512-555-1234')    // 'unknown'
 */
export function detectPhoneFormat(phone: string): 'international' | 'national' | 'local' | 'unknown' {
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+1')) {
    return 'international';
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return 'international';
  }

  if (/^\(\d{3}\)\s*\d{3}-\d{4}$/.test(trimmed)) {
    return 'national';
  }

  if (/^\d{10}$/.test(trimmed)) {
    return 'local';
  }

  return 'unknown';
}

/**
 * Format phone for persistent storage (E.164 US: +1XXXXXXXXXX)
 *
 * @param phone - Phone in any format
 * @returns "+15125551234" when normalization yields exactly 10 digits; otherwise empty string
 *
 * @example
 * formatPhoneForStorage('5125551234')       // '+15125551234'
 * formatPhoneForStorage('+1 512-555-1234')  // '+15125551234'
 * formatPhoneForStorage('512')              // ''
 */
export function formatPhoneForStorage(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) {
    return '';
  }
  return `+1${normalized}`;
}
