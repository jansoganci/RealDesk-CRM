import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock('@/config/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
}));

import {
  decryptSensitiveFields,
  encryptSensitiveValue,
  hashTaxId,
  isValidAccountNumber,
  isValidRoutingNumber,
  isValidTaxId,
} from '../encryption.service';

describe('encryption service', () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it('sends plaintext to the authenticated server encryption endpoint', async () => {
    invoke.mockResolvedValue({ data: { ciphertext: 'iv:ciphertext' }, error: null });

    await expect(encryptSensitiveValue('tax_id', '12-3456789')).resolves.toBe('iv:ciphertext');
    expect(invoke).toHaveBeenCalledWith('pii-crypto', {
      body: { action: 'encrypt', field: 'tax_id', plaintext: '12-3456789' },
    });
  });

  it('requests entity-bound decryption instead of accepting arbitrary ciphertext', async () => {
    invoke.mockResolvedValue({
      data: { values: { tax_id: '12-3456789' } },
      error: null,
    });

    await expect(
      decryptSensitiveFields(
        'property_owner',
        '11111111-1111-4111-8111-111111111111',
        ['tax_id'],
      ),
    ).resolves.toEqual({ tax_id: '12-3456789' });
  });

  it('fails closed on Edge Function errors and malformed responses', async () => {
    invoke.mockResolvedValue({ data: null, error: new Error('network') });
    await expect(encryptSensitiveValue('tax_id', '12-3456789')).rejects.toThrow(
      'Sensitive data service unavailable',
    );

    invoke.mockResolvedValue({ data: { values: { tax_id: 123 } }, error: null });
    await expect(
      decryptSensitiveFields(
        'property_owner',
        '11111111-1111-4111-8111-111111111111',
        ['tax_id'],
      ),
    ).rejects.toThrow('invalid response');
  });

  it('keeps deterministic Tax ID hashing compatible across formatting', async () => {
    await expect(hashTaxId('12-3456789')).resolves.toBe(await hashTaxId('123456789'));
  });

  it('keeps US field validators client-side', () => {
    expect(isValidRoutingNumber('021000021')).toBe(true);
    expect(isValidRoutingNumber('123456789')).toBe(false);
    expect(isValidAccountNumber('1234-5678')).toBe(true);
    expect(isValidAccountNumber('12')).toBe(false);
    expect(isValidTaxId('12-3456789')).toBe(true);
    expect(isValidTaxId('12345')).toBe(false);
  });
});
