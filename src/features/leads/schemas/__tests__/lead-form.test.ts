/**
 * Lead Form Schema Tests
 * Quick validation tests for lead-form.ts schema
 */

import { describe, it, expect } from 'vitest';
import { createLeadSchema, US_STATES, LEAD_SOURCE_OPTIONS } from '../lead-form';

describe('createLeadSchema', () => {
  it('validates a complete rental lead', () => {
    const validLead = {
      name: 'John Doe',
      phone: '5551234567',
      email: 'john@example.com',
      inquiry_type: 'rental' as const,
      lead_source: 'zillow' as const,
      preferred_city: 'Austin',
      preferred_state: 'TX',
      min_rent_budget: 1500,
      max_rent_budget: 2500,
      pre_approved: false,
      notes: 'Looking for 2BR apartment',
    };

    const result = createLeadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('(555) 123-4567'); // Auto-formatted
      expect(result.data.preferred_state).toBe('TX'); // Uppercase
    }
  });

  it('validates a complete sale lead', () => {
    const validLead = {
      name: 'Jane Smith',
      phone: '(555) 987-6543',
      inquiry_type: 'sale' as const,
      min_sale_budget: 300000,
      max_sale_budget: 450000,
      pre_approved: true,
    };

    const result = createLeadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it('rejects invalid US phone', () => {
    const invalidLead = {
      name: 'Test',
      phone: '123', // Too short
      inquiry_type: 'sale' as const,
    };

    const result = createLeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('rejects invalid state code', () => {
    const invalidLead = {
      name: 'Test',
      phone: '5551234567',
      inquiry_type: 'rental' as const,
      preferred_state: 'ZZ', // Invalid state
    };

    const result = createLeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('rejects min > max budget for rental', () => {
    const invalidLead = {
      name: 'Test',
      phone: '5551234567',
      inquiry_type: 'rental' as const,
      min_rent_budget: 3000,
      max_rent_budget: 2000, // Min exceeds max
    };

    const result = createLeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('rejects min > max budget for sale', () => {
    const invalidLead = {
      name: 'Test',
      phone: '5551234567',
      inquiry_type: 'sale' as const,
      min_sale_budget: 500000,
      max_sale_budget: 400000, // Min exceeds max
    };

    const result = createLeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('exports US_STATES array with 51 entries', () => {
    expect(US_STATES).toHaveLength(51); // 50 states + DC
    expect(US_STATES[0]).toHaveProperty('value');
    expect(US_STATES[0]).toHaveProperty('label');
  });

  it('exports LEAD_SOURCE_OPTIONS array', () => {
    expect(LEAD_SOURCE_OPTIONS).toHaveLength(8);
    expect(LEAD_SOURCE_OPTIONS[0]).toEqual({ value: 'zillow', label: 'Zillow' });
  });
});
