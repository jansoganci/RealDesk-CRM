const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const KEY_HEX_LENGTH = 64;
const MAX_CIPHERTEXT_HEX_LENGTH = 512;

export class PiiCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PiiCryptoError';
  }
}

function hexToBytes(value: string): Uint8Array {
  if (value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    throw new PiiCryptoError('Invalid hexadecimal value');
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

function bytesToHex(value: Uint8Array): string {
  return Array.from(value)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function importEncryptionKey(keyHex: string): Promise<CryptoKey> {
  if (keyHex.length !== KEY_HEX_LENGTH || !/^[0-9a-f]{64}$/i.test(keyHex)) {
    throw new PiiCryptoError('Invalid encryption key configuration');
  }

  return crypto.subtle.importKey(
    'raw',
    hexToBytes(keyHex),
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptWithKey(plaintext: string, keyHex: string): Promise<string> {
  const key = await importEncryptionKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);

  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(encrypted))}`;
}

function parseCiphertext(ciphertext: string): { iv: Uint8Array; encrypted: Uint8Array } {
  const parts = ciphertext.split(':');
  if (parts.length !== 2) {
    throw new PiiCryptoError('Invalid ciphertext format');
  }

  const [ivHex, encryptedHex] = parts;
  if (
    !ivHex ||
    !encryptedHex ||
    ivHex.length !== IV_LENGTH * 2 ||
    encryptedHex.length < 32 ||
    encryptedHex.length > MAX_CIPHERTEXT_HEX_LENGTH ||
    encryptedHex.length % 2 !== 0
  ) {
    throw new PiiCryptoError('Invalid ciphertext format');
  }

  return {
    iv: hexToBytes(ivHex),
    encrypted: hexToBytes(encryptedHex),
  };
}

export async function decryptWithKeys(
  ciphertext: string,
  keyHexes: readonly string[],
): Promise<string> {
  const { iv, encrypted } = parseCiphertext(ciphertext);

  for (const keyHex of keyHexes) {
    try {
      const key = await importEncryptionKey(keyHex);
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        encrypted,
      );
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      if (error instanceof PiiCryptoError) {
        throw error;
      }
    }
  }

  throw new PiiCryptoError('Unable to decrypt ciphertext');
}
