/**
 * Sensitive-data client for US bank accounts and Tax IDs.
 * AES-256-GCM encryption and decryption are performed only by the authenticated
 * `pii-crypto` Edge Function. The browser never imports the encryption key.
 * Uses SHA-256 for hashing (duplicate detection lookups)
 */

import { supabase } from '../config/supabase';

export type PiiField = 'tax_id' | 'routing_number' | 'account_number' | 'legacy_bank_payload';
export type DecryptablePiiField = Exclude<PiiField, 'legacy_bank_payload'>;
export type PiiEntityType = 'property_owner' | 'tenant';

interface EncryptResponse {
  ciphertext?: unknown;
}

interface DecryptResponse {
  values?: unknown;
}

/** Weights for ABA routing number checksum (positions 1–9) */
const ROUTING_CHECKSUM_WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function encryptSensitiveValue(
  field: PiiField,
  plaintext: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<EncryptResponse>('pii-crypto', {
    body: { action: 'encrypt', field, plaintext },
  });

  if (error || typeof data?.ciphertext !== 'string') {
    throw new Error('Sensitive data service unavailable');
  }

  return data.ciphertext;
}

export async function decryptSensitiveFields(
  entityType: PiiEntityType,
  entityId: string,
  fields: readonly DecryptablePiiField[],
): Promise<Partial<Record<DecryptablePiiField, string>>> {
  const { data, error } = await supabase.functions.invoke<DecryptResponse>('pii-crypto', {
    body: { action: 'decrypt', entityType, entityId, fields },
  });

  if (error || !isRecord(data?.values)) {
    throw new Error('Sensitive data service unavailable');
  }

  const values: Partial<Record<DecryptablePiiField, string>> = {};
  for (const field of fields) {
    const value = data.values[field];
    if (typeof value !== 'string') {
      throw new Error('Sensitive data service returned an invalid response');
    }
    values[field] = value;
  }
  return values;
}

/**
 * Hash a Tax ID (EIN) for duplicate detection
 * Normalizes to digits-only before hashing so "12-3456789" and "123456789" yield the same hash
 *
 * @param taxId - Tax ID (EIN) as entered
 * @returns SHA-256 hash as hex string
 *
 * @example
 * const hash = await hashTaxId('12-3456789');
 * const same = await hashTaxId('123456789');
 * // hash === same
 */
export async function hashTaxId(taxId: string): Promise<string> {
  const normalized = taxId.replace(/\D/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

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
