import { describe, expect, it } from 'vitest';
import {
  buildDealPayload,
  validateConvertPreconditions,
} from '../dealConvertPreconditions';
import type { DealFormData } from '@/features/deals/schemas/dealFormSchema';

function baseFormData(overrides: Partial<DealFormData> = {}): DealFormData {
  return {
    deal_name: 'Emma Wilson — 825 Montana Avenue',
    deal_type: 'sale',
    client_role: 'buyer',
    property_id: '10000000-0000-4000-8000-000000000011',
    property_snapshot: null,
    financing_type: 'conventional',
    preapproval_status: 'approved',
    buyer_agent_agreement_id: null,
    list_price: 750_000,
    intended_offer_price: 740_000,
    earnest_money_planned: 10_000,
    projected_close_date: '2026-09-01',
    notes: null,
    lead_id: '10000000-0000-4000-8000-000000000001',
    deal_stage: undefined,
    ...overrides,
  };
}

describe('validateConvertPreconditions', () => {
  it('passes when a property has been matched', () => {
    expect(validateConvertPreconditions({ property_id: 'prop-1' })).toBeNull();
  });

  it('requires a property when converting from a lead', () => {
    expect(validateConvertPreconditions({ property_id: null })).toBe('property_required');
  });

  it('requires a property when the field is undefined', () => {
    expect(validateConvertPreconditions({ property_id: undefined })).toBe('property_required');
  });
});

describe('buildDealPayload', () => {
  it('maps form data to the create payload with a resolved property_id', () => {
    const payload = buildDealPayload(baseFormData());

    expect(payload).toEqual({
      deal_name: 'Emma Wilson — 825 Montana Avenue',
      deal_type: 'sale',
      client_role: 'buyer',
      property_id: '10000000-0000-4000-8000-000000000011',
      property_snapshot: null,
      financing_type: 'conventional',
      preapproval_status: 'approved',
      buyer_agent_agreement_id: null,
      list_price: 750_000,
      intended_offer_price: 740_000,
      earnest_money_planned: 10_000,
      projected_close_date: '2026-09-01',
      notes: null,
    });
  });

  it('coerces a missing property_id and optional fields to null', () => {
    const payload = buildDealPayload(
      baseFormData({
        property_id: null,
        financing_type: null,
        preapproval_status: null,
        buyer_agent_agreement_id: null,
        list_price: null,
        intended_offer_price: null,
        earnest_money_planned: null,
        notes: null,
      })
    );

    expect(payload.property_id).toBeNull();
    expect(payload.financing_type).toBeNull();
    expect(payload.preapproval_status).toBeNull();
    expect(payload.list_price).toBeNull();
    expect(payload.intended_offer_price).toBeNull();
    expect(payload.earnest_money_planned).toBeNull();
  });

  it('sends an empty projected_close_date as null (matches DateField YYYY-MM-DD-or-null contract)', () => {
    expect(buildDealPayload(baseFormData({ projected_close_date: '' })).projected_close_date).toBeNull();
    expect(buildDealPayload(baseFormData({ projected_close_date: null })).projected_close_date).toBeNull();
    expect(
      buildDealPayload(baseFormData({ projected_close_date: '2026-09-01' })).projected_close_date
    ).toBe('2026-09-01');
  });
});
