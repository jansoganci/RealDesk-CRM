import { describe, expect, it } from 'vitest';

import { getLeaseAgreementFormDefaults } from '@/features/contracts/leaseWizard/leaseAgreementFormDefaults';
import { getPurchaseAgreementFormDefaults } from '@/features/contracts/purchaseWizard/purchaseAgreementFormDefaults';
import { UnsupportedDocumentJurisdictionError } from '@/config/supportedDocumentStates';
import { leaseAgreementPdfService } from '@/services/leaseAgreementPdf.service';
import { purchaseAgreementPdfService } from '@/services/purchaseAgreementPdf.service';
import { buildAttorneyDisclaimer } from '@/templates/documentRegistry';

const STATES = ['CA', 'TX', 'FL', 'NY', 'AZ'] as const;

describe('document PDF generation (Item 4 V1 drafts)', () => {
  it.each(STATES)('generates a lease draft for %s with disclaimer and template meta', (state) => {
    const form = {
      ...getLeaseAgreementFormDefaults(),
      property_state: state,
      landlord_name: 'Alex Landlord',
      tenant_name: 'Taylor Tenant',
      property_street: '100 Main St',
      property_city: 'Sample City',
      property_zip: '85001',
      year_built: 1990,
      lead_paint_disclosure_required: false,
    };
    const { blob, meta } = leaseAgreementPdfService.generateDocument({ form });
    expect(blob.size).toBeGreaterThan(500);
    expect(meta.jurisdiction).toBe(state);
    expect(meta.template_id).toBe(`realdesk.lease.${state.toLowerCase()}.v1`);
    expect(meta.template_version).toContain('draft');
    expect(buildAttorneyDisclaimer(state, 'lease')).toMatch(/not been reviewed by a licensed attorney/i);
  });

  it.each(STATES)('generates a purchase draft for %s with disclaimer and template meta', (state) => {
    const form = {
      ...getPurchaseAgreementFormDefaults(),
      property_state: state,
      governing_law_state: state as 'CA' | 'TX' | 'FL' | 'NY' | 'AZ',
      buyer_name: 'Blake Buyer',
      seller_name: 'Sam Seller',
      property_street: '200 Oak Ave',
      property_city: 'Sample City',
      property_zip: '85001',
      year_built: 2005,
      lead_paint_disclosure_required: false,
    };
    const { blob, meta } = purchaseAgreementPdfService.generateDocument({ form });
    expect(blob.size).toBeGreaterThan(500);
    expect(meta.jurisdiction).toBe(state);
    expect(meta.template_id).toBe(`realdesk.purchase.${state.toLowerCase()}.v1`);
  });

  it('rejects unsupported lease jurisdiction (Ohio)', () => {
    const form = {
      ...getLeaseAgreementFormDefaults(),
      property_state: 'OH',
    };
    expect(() => leaseAgreementPdfService.generateBlob({ form })).toThrow(
      UnsupportedDocumentJurisdictionError,
    );
  });

  it('rejects purchase when governing law mismatches property state', () => {
    const form = {
      ...getPurchaseAgreementFormDefaults(),
      property_state: 'CA',
      governing_law_state: 'TX' as const,
    };
    expect(() => purchaseAgreementPdfService.generateBlob({ form })).toThrow(
      UnsupportedDocumentJurisdictionError,
    );
  });
});
