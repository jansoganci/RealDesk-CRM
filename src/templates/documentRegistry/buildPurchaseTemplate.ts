import type { SupportedDocumentState } from '@/config/supportedDocumentStates';

import { purchaseContingencyGuidance, purchaseStateDisclosures } from './purchaseStateDisclosures';
import type { DocumentTemplate } from './types';

export const PURCHASE_TEMPLATE_VERSION = '1.0.0-draft';

export function buildPurchaseTemplate(state: SupportedDocumentState): DocumentTemplate {
  return {
    id: `realdesk.purchase.${state.toLowerCase()}.v1`,
    docType: 'purchase',
    jurisdiction: state,
    version: PURCHASE_TEMPLATE_VERSION,
    title: `RealDesk Residential Purchase Agreement (Draft) — ${state}`,
    counselApprovalRef: 'pending-attorney-review',
    sections: [
      {
        key: 'parties',
        kind: 'mapped',
        heading: '1. Parties',
        body:
          'This Residential Purchase Agreement (the "Agreement") is made between Seller {{seller_name}}{{seller2_block}} ' +
          'and Buyer {{buyer_name}}{{buyer2_block}}. Buyer\'s agent (if any): {{buyer_agent_name}}. ' +
          'Seller\'s agent (if any): {{seller_agent_name}}. Effective date (as entered): {{effective_date}}.',
      },
      {
        key: 'property',
        kind: 'mapped',
        heading: '2. Property',
        body:
          'Seller agrees to sell and Buyer agrees to buy the real property located at {{property_full_address}} ' +
          '(the "Property"), property type: {{property_type}}. Year built (if known): {{year_built}}. ' +
          'Tax parcel / other property info: {{tax_parcel_info}}. {{land_mineral_summary}} ' +
          'Personal property included (if described): {{personal_property_description}}.',
      },
      {
        key: 'price',
        kind: 'mapped',
        heading: '3. Purchase price and earnest money',
        body:
          'Purchase price: {{purchase_price}}. Earnest money: {{earnest_money_amount}}, due {{earnest_money_due_date}} ' +
          '{{earnest_money_time_clause}}. Escrow required: {{earnest_money_escrow_required}}. ' +
          'If this transaction fails for a reason entitling Buyer to return of earnest money under this Agreement, ' +
          'earnest money should be returned within {{earnest_money_return_days}} days after proper demand, subject to escrow instructions.',
      },
      {
        key: 'financing',
        kind: 'mapped',
        heading: '4. Financing',
        body: '{{financing_summary}}',
      },
      {
        key: 'closing',
        kind: 'mapped',
        heading: '5. Closing',
        body:
          'Closing date: {{closing_date}}{{closing_time_clause}}. Title company / closing agent (if stated): {{title_company}}. ' +
          'Closing costs responsibility: {{closing_costs_responsibility}}. Governing law state selected by parties: {{governing_law_state}}.',
      },
      {
        key: 'contingencies',
        kind: 'mapped',
        heading: '6. Contingencies',
        body:
          '{{contingency_guidance}}\n\n' +
          'Inspection / due diligence: {{inspection_summary}}\n' +
          'Appraisal contingency: {{appraisal_summary}}\n' +
          'Survey / title review: {{survey_title_summary}}\n' +
          'Offer expiration: {{offer_expiration}}.',
      },
      {
        key: 'state_disclosures',
        kind: 'static',
        heading: `7. ${state} disclosures and transaction notices`,
        body: purchaseStateDisclosures(state),
      },
      {
        key: 'default',
        kind: 'static',
        heading: '8. Default and remedies',
        body:
          'If Buyer defaults after contingencies are removed or waived, Seller may pursue remedies available under ' +
          'applicable law and this Agreement, which may include retention of earnest money as liquidated damages if the parties ' +
          'have validly so agreed, or other remedies not prohibited by law. If Seller defaults, Buyer may pursue remedies ' +
          'available under applicable law, including return of earnest money and, where available, specific performance or damages. ' +
          'The parties should confirm enforceability of any liquidated-damages term with counsel in {{jurisdiction}}.',
      },
      {
        key: 'additional',
        kind: 'mapped',
        heading: '9. Additional terms',
        body: '{{additional_terms}}',
      },
      {
        key: 'lead_slot',
        kind: 'addendum_slot',
        heading: '10. Lead-based paint addendum',
        body: 'LEAD_ADDENDUM_PLACEHOLDER',
      },
      {
        key: 'sig_buyer',
        kind: 'signature',
        signatureLabel: 'Buyer signature',
      },
      {
        key: 'sig_buyer2',
        kind: 'signature',
        signatureLabel: 'Additional buyer signature (if any)',
      },
      {
        key: 'sig_seller',
        kind: 'signature',
        signatureLabel: 'Seller signature',
      },
      {
        key: 'sig_seller2',
        kind: 'signature',
        signatureLabel: 'Additional seller signature (if any)',
      },
    ],
  };
}

/** Re-export for contingency section body builder (used when flattening). */
export { purchaseContingencyGuidance };
