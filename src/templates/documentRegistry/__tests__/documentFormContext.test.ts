import { describe, expect, it } from 'vitest';

import { getLeaseAgreementFormDefaults } from '@/features/contracts/leaseWizard/leaseAgreementFormDefaults';
import { getPurchaseAgreementFormDefaults } from '@/features/contracts/purchaseWizard/purchaseAgreementFormDefaults';

import { buildLeaseTemplate } from '../buildLeaseTemplate';
import { buildPurchaseTemplate } from '../buildPurchaseTemplate';
import { interpolateTemplate } from '../interpolate';
import { buildLeaseFormContext } from '../leaseFormContext';
import { buildPurchaseFormContext } from '../purchaseFormContext';

function sectionBody(sections: { key: string; body?: string }[], key: string): string {
  const section = sections.find((s) => s.key === key);
  if (!section?.body) throw new Error(`section ${key} not found`);
  return section.body;
}

describe('lease form context — issue 3 (party name trailing dash)', () => {
  it('renders party names with no dangling em-dash when no contact/co-signer/tenant2 data is given', () => {
    const form = getLeaseAgreementFormDefaults(); // no landlord contact, no tenant_name_2, no co_signer_name
    const values = buildLeaseFormContext(form, 'CA');
    const template = buildLeaseTemplate('CA');
    const resolved = interpolateTemplate(sectionBody(template.sections, 'parties'), values);

    expect(values.landlord_contact_block).toBe('');
    expect(values.tenant2_block).toBe('');
    expect(values.cosigner_block).toBe('');
    expect(resolved).not.toMatch(/—/);
    expect(resolved).toContain(`Landlord ${form.landlord_name} and Tenant ${form.tenant_name}.`);
  });

  it('regression: no end_date does not leave a dangling em-dash before the period', () => {
    const form = { ...getLeaseAgreementFormDefaults(), end_date: '' };
    const values = buildLeaseFormContext(form, 'CA');
    const template = buildLeaseTemplate('CA');
    const resolved = interpolateTemplate(sectionBody(template.sections, 'term'), values);

    expect(values.end_date_clause).toBe('');
    expect(resolved).not.toMatch(/—/);
    expect(resolved).toContain(`The term begins on ${values.start_date}.`);
  });
});

describe('purchase form context — issue 3 (party name trailing dash)', () => {
  it('renders party names with no dangling em-dash when no second buyer/seller is given', () => {
    const form = getPurchaseAgreementFormDefaults(); // buyer_name_2/seller_name_2 default to null
    const values = buildPurchaseFormContext(form, 'CA');
    const template = buildPurchaseTemplate('CA');
    const resolved = interpolateTemplate(sectionBody(template.sections, 'parties'), values);

    expect(values.seller2_block).toBe('');
    expect(values.buyer2_block).toBe('');
    expect(resolved).toContain(`Seller ${form.seller_name} and Buyer ${form.buyer_name}.`);
    expect(resolved.split(`${form.seller_name}`)[1]?.startsWith(' and')).toBe(true);
  });
});

describe('purchase form context — issue 4 (earnest money dash, double period)', () => {
  it('regression: no earnest money deadline time does not leave a dangling "—." artifact', () => {
    const form = getPurchaseAgreementFormDefaults(); // earnest_money_deadline_time defaults to null
    const values = buildPurchaseFormContext(form, 'CA');
    const template = buildPurchaseTemplate('CA');
    const resolved = interpolateTemplate(sectionBody(template.sections, 'price'), values);

    expect(values.earnest_money_time_clause).toBe('');
    expect(resolved).not.toMatch(/—\s*\./);
    expect(resolved).toContain(`due ${values.earnest_money_due_date}. Escrow required`);
  });

  it('regression: no closing time does not leave a dangling em-dash on the closing date', () => {
    const form = { ...getPurchaseAgreementFormDefaults(), closing_time: null };
    const values = buildPurchaseFormContext(form, 'CA');
    const template = buildPurchaseTemplate('CA');
    const resolved = interpolateTemplate(sectionBody(template.sections, 'closing'), values);

    expect(values.closing_time_clause).toBe('');
    // Narrowly scoped: title_company legitimately renders as "—" elsewhere in
    // this section when unset, so only assert the closing-date fragment itself
    // (the field this test targets) is dash-free.
    expect(resolved).not.toMatch(/\d{4}—/);
    expect(resolved).toContain(`Closing date: ${values.closing_date}. Title company`);
  });

  it('default "None described" fallback does not produce a double period', () => {
    const form = getPurchaseAgreementFormDefaults(); // personal_property_description defaults to null
    const values = buildPurchaseFormContext(form, 'CA');
    const template = buildPurchaseTemplate('CA');
    const resolved = interpolateTemplate(sectionBody(template.sections, 'property'), values);

    expect(values.personal_property_description).toBe('None described');
    expect(resolved).not.toContain('..');
    expect(resolved).toContain('Personal property included (if described): None described.');
  });
});
