import { describe, expect, it } from 'vitest';
import {
  applyPropertyMatchDefaults,
  buildDefaultsFromLead,
  getDefaultPropertyMatch,
  isEligiblePropertyMatch,
  type DealPropertyMatch,
  type LeadDealDefaultsSource,
} from '../dealCreationDefaults';

function match(id: string, address: string, salePrice: number): DealPropertyMatch {
  return {
    property_id: id,
    property: {
      address,
      property_type: 'sale',
      status: 'Available',
      sale_price: salePrice,
      rent_amount: null,
    },
  };
}

const lead = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Emma Wilson',
  inquiry_type: 'sale',
  pre_approved: false,
  notes: null,
} satisfies LeadDealDefaultsSource;

describe('deal creation defaults', () => {
  it('prefers the property from the latest showing when it is still matched', () => {
    const first = match('10000000-0000-4000-8000-000000000010', 'First Avenue', 900_000);
    const shown = match('10000000-0000-4000-8000-000000000011', 'Montana Avenue', 750_000);
    const showings = [
      { property_id: first.property_id, showing_date: '2026-07-19T10:00:00.000Z' },
      { property_id: shown.property_id, showing_date: '2026-07-20T10:00:00.000Z' },
    ];

    expect(getDefaultPropertyMatch([first, shown], showings)?.property_id).toBe(shown.property_id);
  });

  it('falls back to the first match when no showing property is matched', () => {
    const first = match('10000000-0000-4000-8000-000000000010', 'First Avenue', 900_000);
    expect(getDefaultPropertyMatch([first], [])).toBe(first);
  });

  it('uses the selected property address and list price instead of the lead budget', () => {
    const selected = match(
      '10000000-0000-4000-8000-000000000011',
      '825 Montana Avenue, Santa Monica, CA 90403',
      750_000
    );

    const defaults = applyPropertyMatchDefaults(buildDefaultsFromLead(lead), lead, selected);

    expect(defaults.property_id).toBe(selected.property_id);
    expect(defaults.deal_name).toBe('Emma Wilson — 825 Montana Avenue, Santa Monica, CA 90403');
    expect(defaults.list_price).toBe(750_000);
    expect(defaults.intended_offer_price).toBe(750_000);
    expect(defaults.property_snapshot).toBeNull();
  });

  it('rejects stale matches whose property is no longer available', () => {
    const sold = match(
      '10000000-0000-4000-8000-000000000012',
      'Sold Property',
      800_000
    );
    if (sold.property) sold.property.status = 'Sold';

    expect(isEligiblePropertyMatch(sold, 'sale')).toBe(false);
  });
});
