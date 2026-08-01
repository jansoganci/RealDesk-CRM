/**
 * Validation helpers for US bank accounts and Tax IDs.
 * Sensitive-field encryption and hashing run in Supabase Edge Functions.
 */

/** Weights for ABA routing number checksum (positions 1–9) */
const ROUTING_CHECKSUM_WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1] as const;

/**
 * Validate US ABA routing transit number
 * Exactly 9 digits; checksum: weighted sum (3,7,1,3,7,1,3,7,1) divisible by 10
 *
 * @param routing - Routing number (digits only)
 * @returns true if format and checksum are valid
 *
 * @example
 * isValidRoutingNumber('021000021') // true (Federal Reserve example pattern / valid checksum)
 * isValidRoutingNumber('123456789') // false if checksum fails
 */
export function isValidRoutingNumber(routing: string): boolean {
  const digits = routing.replace(/\D/g, '');
  if (digits.length !== 9 || !/^\d{9}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]!, 10) * ROUTING_CHECKSUM_WEIGHTS[i]!;
  }
  return sum % 10 === 0;
}

/**
 * Validate US bank account number length
 * Strips dashes and spaces; requires 4–17 digits
 *
 * @param account - Account number as entered
 */
export function isValidAccountNumber(account: string): boolean {
  const digits = account.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(digits)) {
    return false;
  }
  return digits.length >= 4 && digits.length <= 17;
}

/**
 * Validate Employer Identification Number (EIN) format
 * Empty string is valid (optional field). If provided: `XX-XXXXXXX` or 9 consecutive digits.
 * Does not validate SSN.
 *
 * @param taxId - EIN / Tax ID string
 *
 * @example
 * isValidTaxId('') // true
 * isValidTaxId('12-3456789') // true
 * isValidTaxId('123456789') // true
 * isValidTaxId('12345') // false
 */
export function isValidTaxId(taxId: string): boolean {
  if (taxId === '') {
    return true;
  }
  const trimmed = taxId.trim();
  if (/^\d{2}-\d{7}$/.test(trimmed)) {
    return true;
  }
  if (/^\d{9}$/.test(trimmed)) {
    return true;
  }
  return false;
}
