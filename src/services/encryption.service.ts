/**
 * Encryption Service for TC Kimlik No and IBAN
 * Uses Web Crypto API with AES-GCM for encryption
 * Uses SHA-256 for hashing (lookups)
 *
 * IMPORTANT: This runs in the browser, not Node.js
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

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
 * @param plaintext - String to encrypt (TC or IBAN)
 * @returns Encrypted string in format "iv:ciphertext"
 *
 * @example
 * const encrypted = await encrypt('12345678901');
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
 * // Returns: "12345678901"
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
 * Hash TC Kimlik No for lookups
 * Uses SHA-256 (one-way, cannot be reversed)
 *
 * @param tc - TC Kimlik No to hash
 * @returns SHA-256 hash as hex string
 *
 * @example
 * const hash = await hashTC('12345678901');
 * // Always returns same hash for same TC
 * // Cannot reverse hash to get original TC
 */
export async function hashTC(tc: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(tc);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Validate TC Kimlik No format
 * Must be exactly 11 digits
 *
 * @param tc - TC Kimlik No to validate
 * @returns true if valid format
 *
 * @example
 * isValidTC('12345678901') // true
 * isValidTC('123456789')   // false (too short)
 * isValidTC('1234567890a') // false (not all digits)
 */
export function isValidTC(tc: string): boolean {
  return /^\d{11}$/.test(tc);
}

/**
 * Validate IBAN format (Turkey)
 * Must be TR followed by 24 digits
 *
 * @param iban - IBAN to validate
 * @returns true if valid format
 *
 * @example
 * isValidIBAN('TR123456789012345678901234') // true
 * isValidIBAN('TR12345678901234567890123')  // false (too short)
 * isValidIBAN('US123456789012345678901234') // false (not TR)
 */
export function isValidIBAN(iban: string): boolean {
  return /^TR\d{24}$/.test(iban);
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
