import { describe, expect, it } from 'vitest';
import { decryptWithKeys, encryptWithKey, PiiCryptoError } from './pii-crypto.ts';

const CURRENT_KEY = '11'.repeat(32);
const LEGACY_KEY = '22'.repeat(32);

describe('PII crypto compatibility', () => {
  it('round-trips the existing iv:ciphertext AES-GCM format', async () => {
    const ciphertext = await encryptWithKey('12-3456789', CURRENT_KEY);

    expect(ciphertext).toMatch(/^[0-9a-f]{24}:[0-9a-f]+$/);
    await expect(decryptWithKeys(ciphertext, [CURRENT_KEY])).resolves.toBe('12-3456789');
  });

  it('falls back to the legacy key without rewriting old rows', async () => {
    const legacyCiphertext = await encryptWithKey('021000021|12345678', LEGACY_KEY);

    await expect(
      decryptWithKeys(legacyCiphertext, [CURRENT_KEY, LEGACY_KEY]),
    ).resolves.toBe('021000021|12345678');
  });

  it('rejects malformed ciphertext or a non-matching key', async () => {
    await expect(decryptWithKeys('not-ciphertext', [CURRENT_KEY])).rejects.toBeInstanceOf(
      PiiCryptoError,
    );

    const ciphertext = await encryptWithKey('sensitive', CURRENT_KEY);
    await expect(decryptWithKeys(ciphertext, [LEGACY_KEY])).rejects.toBeInstanceOf(PiiCryptoError);
  });
});
