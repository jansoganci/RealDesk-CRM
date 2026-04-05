/**
 * Encryption Service for US bank accounts and Tax IDs
 * Uses Web Crypto API with AES-GCM for encryption
 * Uses SHA-256 for hashing (duplicate detection lookups)
 *
 * IMPORTANT: This runs in the browser, not Node.js
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

/** Weights for ABA routing number checksum (positions 1–9) */
const ROUTING_CHECKSUM_WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1] as const;

/**
 * Get or generate encryption key
 * Key is stored in environment variable
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = import.meta.env.VITE_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'VITE_ENCRYPTION_KEY not found in environment. Please add it to your .env file.\n' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  if (keyHex.length !== 64) {
    throw new Error('VITE_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  // Convert hex to Uint8Array
  const keyData = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
  );

  // Import key for Web Crypto API
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: iv:ciphertext (both hex-encoded)
 *
 * @param plaintext - String to encrypt (e.g. Tax ID, bank payload)
 * @returns Encrypted string in format "iv:ciphertext"
 *
 * @example
 * const encrypted = await encrypt('12-3456789');
 * // Returns: "a1b2c3d4e5f6....:1a2b3c4d5e6f...."
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedText = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encodedText
    );

    // Convert to hex
    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const ciphertextHex = Array.from(new Uint8Array(ciphertext))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return `${ivHex}:${ciphertextHex}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt ciphertext
 * Input format: iv:ciphertext (hex-encoded)
 *
 * @param ciphertext - Encrypted string from encrypt()
 * @returns Decrypted plaintext
 *
 * @example
 * const decrypted = await decrypt('a1b2c3...:1a2b3c...');
 * // Returns: "12-3456789"
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    const [ivHex, encryptedHex] = ciphertext.split(':');

    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid ciphertext format. Expected "iv:ciphertext"');
    }

    const key = await getEncryptionKey();

    // Convert from hex
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const encrypted = new Uint8Array(
      encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
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

/**
 * Generate a new encryption key (for setup)
 * Returns 32-byte key as hex string
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * const key = generateEncryptionKey();
 * // Add this to your .env file as VITE_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
