/**
 * Buyer-Agent Agreement Form Schema Tests
 * Quick validation tests for buyer-agent-agreement-form.ts schema
 */

import { describe, it, expect } from 'vitest';
import { createBuyerAgentAgreementSchema } from '../buyer-agent-agreement-form';

const LEAD_ID = '11111111-1111-1111-1111-111111111111';

function baseAgreement(overrides: Record<string, unknown> = {}) {
  return {
    lead_id: LEAD_ID,
    signed_date: '2026-01-15',
    expiration_date: '2026-07-15',
    commission_type: 'percentage' as const,
    commission_rate: 3,
    status: 'draft' as const,
    ...overrides,
  };
}

describe('createBuyerAgentAgreementSchema', () => {
  it('validates a complete percentage agreement (flat_fee optional)', () => {
    const valid = baseAgreement({ commission_type: 'percentage', commission_rate: 3 });

    const result = createBuyerAgentAgreementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates a complete flat_fee agreement', () => {
    const valid = baseAgreement({
      commission_type: 'flat_fee',
      commission_rate: undefined,
      flat_fee_amount: 5000,
    });

    const result = createBuyerAgentAgreementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects percentage agreement with missing commission_rate', () => {
    const invalid = baseAgreement({ commission_type: 'percentage', commission_rate: undefined });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects percentage agreement with 0 commission_rate', () => {
    const invalid = baseAgreement({ commission_type: 'percentage', commission_rate: 0 });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects flat_fee agreement with missing flat_fee_amount', () => {
    const invalid = baseAgreement({
      commission_type: 'flat_fee',
      commission_rate: undefined,
      flat_fee_amount: undefined,
    });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects flat_fee agreement with 0 flat_fee_amount', () => {
    const invalid = baseAgreement({
      commission_type: 'flat_fee',
      commission_rate: undefined,
      flat_fee_amount: 0,
    });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects expiration_date before signed_date (string compare)', () => {
    const invalid = baseAgreement({ signed_date: '2026-07-15', expiration_date: '2026-01-15' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects expiration_date equal to signed_date', () => {
    const invalid = baseAgreement({ signed_date: '2026-01-15', expiration_date: '2026-01-15' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts expiration_date after signed_date (string compare)', () => {
    const valid = baseAgreement({ signed_date: '2026-01-15', expiration_date: '2026-07-15' });

    const result = createBuyerAgentAgreementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty signed_date', () => {
    const invalid = baseAgreement({ signed_date: '' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty expiration_date', () => {
    const invalid = baseAgreement({ expiration_date: '' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid status enum value', () => {
    const invalid = baseAgreement({ status: 'bogus' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid commission_type enum value', () => {
    const invalid = baseAgreement({ commission_type: 'bogus' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts empty string pdf_url', () => {
    const valid = baseAgreement({ pdf_url: '' });

    const result = createBuyerAgentAgreementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid pdf_url', () => {
    const invalid = baseAgreement({ pdf_url: 'not-a-url' });

    const result = createBuyerAgentAgreementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts valid https pdf_url', () => {
    const valid = baseAgreement({ pdf_url: 'https://example.com/agreement.pdf' });

    const result = createBuyerAgentAgreementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
