import { describe, expect, it } from 'vitest';
import { dealFormSchema, dealUpdateFormSchema } from '../dealFormSchema';

function validDeal(overrides: Record<string, unknown> = {}) {
  return {
    deal_name: 'Emma Wilson — 825 Montana Avenue',
    deal_type: 'sale',
    client_role: 'buyer',
    property_id: '10000000-0000-4000-8000-000000000011',
    financing_type: 'conventional',
    preapproval_status: 'approved',
    intended_offer_price: 740_000,
    earnest_money_planned: 10_000,
    projected_close_date: '2099-01-15',
    ...overrides,
  };
}

describe('dealFormSchema — required fields', () => {
  it('accepts a complete, valid deal', () => {
    const result = dealFormSchema.safeParse(validDeal());
    expect(result.success).toBe(true);
  });

  it('rejects an empty deal name', () => {
    const result = dealFormSchema.safeParse(validDeal({ deal_name: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects a missing client_role', () => {
    const { client_role: _omit, ...rest } = validDeal();
    const result = dealFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('defaults deal_type to sale when omitted', () => {
    const { deal_type: _omit, ...rest } = validDeal();
    const result = dealFormSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.deal_type).toBe('sale');
  });
});

describe('dealFormSchema — financing / preapproval enums', () => {
  it('accepts a known financing_type', () => {
    const result = dealFormSchema.safeParse(validDeal({ financing_type: 'fha' }));
    expect(result.success).toBe(true);
  });

  it('rejects an unknown financing_type', () => {
    const result = dealFormSchema.safeParse(validDeal({ financing_type: 'bitcoin' }));
    expect(result.success).toBe(false);
  });

  it('allows financing_type and preapproval_status to be null', () => {
    const result = dealFormSchema.safeParse(
      validDeal({ financing_type: null, preapproval_status: null })
    );
    expect(result.success).toBe(true);
  });

  it('rejects an unknown preapproval_status', () => {
    const result = dealFormSchema.safeParse(validDeal({ preapproval_status: 'maybe' }));
    expect(result.success).toBe(false);
  });
});

describe('dealFormSchema — earnest money vs. intended offer price', () => {
  it('accepts earnest money below the intended offer price', () => {
    const result = dealFormSchema.safeParse(
      validDeal({ intended_offer_price: 500_000, earnest_money_planned: 5_000 })
    );
    expect(result.success).toBe(true);
  });

  it('accepts earnest money equal to the intended offer price', () => {
    const result = dealFormSchema.safeParse(
      validDeal({ intended_offer_price: 5_000, earnest_money_planned: 5_000 })
    );
    expect(result.success).toBe(true);
  });

  it('rejects earnest money that exceeds the intended offer price', () => {
    const result = dealFormSchema.safeParse(
      validDeal({ intended_offer_price: 5_000, earnest_money_planned: 10_000 })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['earnest_money_planned']);
    }
  });

  it('skips the comparison when intended offer price is not set', () => {
    const { intended_offer_price: _omit, ...rest } = validDeal({ earnest_money_planned: 10_000 });
    const result = dealFormSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });
});

describe('dealFormSchema — projected_close_date', () => {
  it('rejects a close date in the past', () => {
    const result = dealFormSchema.safeParse(validDeal({ projected_close_date: '2020-01-01' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['projected_close_date']);
    }
  });

  it('accepts a future close date as a YYYY-MM-DD string (DateField contract)', () => {
    const result = dealFormSchema.safeParse(validDeal({ projected_close_date: '2099-01-15' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.projected_close_date).toBe('2099-01-15');
  });

  it('accepts a null close date (not yet chosen)', () => {
    const result = dealFormSchema.safeParse(validDeal({ projected_close_date: null }));
    expect(result.success).toBe(true);
  });

  it('accepts an empty-string close date (cleared DateField)', () => {
    const result = dealFormSchema.safeParse(validDeal({ projected_close_date: '' }));
    expect(result.success).toBe(true);
  });
});

describe('dealUpdateFormSchema — partial edits', () => {
  it('accepts a partial patch with only one field set', () => {
    const result = dealUpdateFormSchema.safeParse({ notes: 'Buyer requested rent-back' });
    expect(result.success).toBe(true);
  });

  it('still rejects an empty deal_name when provided', () => {
    const result = dealUpdateFormSchema.safeParse({ deal_name: '' });
    expect(result.success).toBe(false);
  });

  it('still rejects earnest money exceeding intended offer price on partial edits', () => {
    const result = dealUpdateFormSchema.safeParse({
      intended_offer_price: 1_000,
      earnest_money_planned: 2_000,
    });
    expect(result.success).toBe(false);
  });
});
