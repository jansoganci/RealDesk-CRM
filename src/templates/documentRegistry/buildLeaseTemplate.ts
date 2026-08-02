import type { SupportedDocumentState } from '@/config/supportedDocumentStates';

import { leaseNoticePeriods, leaseStateDisclosures } from './leaseStateDisclosures';
import type { DocumentTemplate } from './types';

export const LEASE_TEMPLATE_VERSION = '1.0.0-draft';

export function buildLeaseTemplate(state: SupportedDocumentState): DocumentTemplate {
  return {
    id: `realdesk.lease.${state.toLowerCase()}.v1`,
    docType: 'lease',
    jurisdiction: state,
    version: LEASE_TEMPLATE_VERSION,
    title: `Closewell Residential Lease Agreement (Draft) — ${state}`,
    counselApprovalRef: 'pending-attorney-review',
    sections: [
      {
        key: 'parties',
        kind: 'mapped',
        heading: '1. Parties',
        body:
          'This Residential Lease Agreement (the "Agreement") is entered into between Landlord {{landlord_name}}' +
          '{{landlord_contact_block}} and Tenant {{tenant_name}}{{tenant2_block}}{{cosigner_block}}. ' +
          'Additional occupants (if any): {{additional_occupants}}.',
      },
      {
        key: 'premises',
        kind: 'mapped',
        heading: '2. Premises',
        body:
          'Landlord leases to Tenant the residential premises located at {{property_full_address}} ' +
          '(the "Premises"), residence type: {{residence_type}}. Bedrooms: {{bedrooms}}. Bathrooms: {{bathrooms}}. ' +
          'Year built (if known): {{year_built}}. Time zone for notices and generated timestamps: {{property_timezone}}.',
      },
      {
        key: 'term',
        kind: 'mapped',
        heading: '3. Term',
        body:
          'Lease type: {{lease_type}}. The term begins on {{start_date}}{{end_date_clause}}. ' +
          'After the fixed term (if any), the parties\' selected after-term action is: {{after_term_action}}. ' +
          'Termination notice days (as entered): {{termination_notice_days}}.',
      },
      {
        key: 'rent',
        kind: 'mapped',
        heading: '4. Rent and payment',
        body:
          'Monthly rent is {{rent_amount}}, due on day {{rent_due_day}} of each month. ' +
          'Accepted payment methods: {{payment_methods}}. {{late_fee_summary}} {{nsf_summary}} ' +
          'Prepaid rent (if any): {{prepaid_rent_summary}}.',
      },
      {
        key: 'deposit',
        kind: 'mapped',
        heading: '5. Security deposit',
        body:
          'Security deposit enabled: {{security_deposit_enabled}}. Amount: {{security_deposit_amount}}. ' +
          'Landlord intends to return any unused deposit within {{security_deposit_return_days}} days after Tenant vacates, ' +
          'subject to lawful deductions and the {{jurisdiction}} rules summarized in the state disclosures below. ' +
          'Pet deposit (if any): {{pets_deposit_summary}}.',
      },
      {
        key: 'use_rules',
        kind: 'mapped',
        heading: '6. Use, utilities, and house rules',
        body:
          'Utilities Landlord covers: {{utilities_landlord}}. Other utility notes: {{utilities_other}}. ' +
          'Parking: {{parking_summary}}. Furnishings/appliances/common areas: {{amenities_summary}}. ' +
          'Pets allowed: {{pets_allowed}} ({{pets_details}}). Subletting policy: {{subletting_policy}}. ' +
          'Smoking allowed: {{smoking_allowed}}. Renters insurance required: {{renters_insurance_required}} ' +
          '(minimum coverage if stated: {{renters_insurance_min_coverage}}). ' +
          'Move-in inspection required: {{move_in_inspection_required}}.',
      },
      {
        key: 'state_disclosures',
        kind: 'static',
        heading: `7. ${state} disclosures and statutory notices`,
        body: leaseStateDisclosures(state),
      },
      {
        key: 'notices',
        kind: 'static',
        heading: '8. Notice periods',
        body: leaseNoticePeriods(state),
      },
      {
        key: 'default',
        kind: 'static',
        heading: '9. Default and remedies',
        body:
          'If either party fails to perform a material obligation under this Agreement, the other party may exercise ' +
          'remedies available under applicable {{jurisdiction_placeholder}} law and this Agreement, including notices to cure ' +
          'or quit where required, recovery of unpaid rent, and lawful termination. Self-help eviction is prohibited. ' +
          'Nothing in this section limits non-waivable statutory rights.',
      },
      {
        key: 'additional',
        kind: 'mapped',
        heading: '10. Additional terms',
        body: '{{additional_terms}}',
      },
      {
        key: 'lead_slot',
        kind: 'addendum_slot',
        heading: '11. Lead-based paint addendum',
        body: 'LEAD_ADDENDUM_PLACEHOLDER',
      },
      {
        key: 'sig_landlord',
        kind: 'signature',
        signatureLabel: 'Landlord signature',
      },
      {
        key: 'sig_tenant',
        kind: 'signature',
        signatureLabel: 'Tenant signature',
      },
      {
        key: 'sig_tenant2',
        kind: 'signature',
        signatureLabel: 'Additional tenant signature (if any)',
      },
      {
        key: 'sig_cosigner',
        kind: 'signature',
        signatureLabel: 'Co-signer / guarantor signature (if any)',
      },
    ],
  };
}
