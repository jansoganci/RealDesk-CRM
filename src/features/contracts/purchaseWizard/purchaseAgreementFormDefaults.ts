/**
 * Default values for the purchase wizard form. Keeps `PurchaseAgreementFormValues`
 * valid for initial render and draft restore merges (bank financing branch).
 */

import { addDays, format } from 'date-fns';

import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';

const PLACEHOLDER_STREET = '123 Main Street';

export function getPurchaseAgreementFormDefaults(): PurchaseAgreementFormValues {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  const effective_date = fmt(today);
  const earnest_money_due_date = fmt(addDays(today, 3));
  const inspection_contractor_deadline_date = fmt(addDays(today, 7));
  const inspection_disclosures_deadline_date = fmt(addDays(today, 10));
  const closing_date = fmt(addDays(today, 45));
  const offer_expiration_date = fmt(addDays(today, 5));
  const all_cash_proof_deadline_date = fmt(addDays(today, 14));
  const seller_financing_doc_deadline = fmt(addDays(today, 12));
  const seller_financing_approval_deadline = fmt(addDays(today, 20));

  return {
    linkedPropertyId: null,
    linkedSellerOwnerId: null,
    seller_id: null,

    financing_type: 'bank_financing',

    effective_date,
    closing_date,
    purchase_price: 425_000,
    earnest_money_amount: 10_000,
    earnest_money_due_date,
    governing_law_state: 'CA',
    deal_status: 'draft',
    buyer_name_2: null,
    seller_name_2: null,

    property_timezone: 'America/Los_Angeles',
    property_type: 'single_family',
    property_type_other: null,
    property_street: PLACEHOLDER_STREET,
    property_city: 'Los Angeles',
    property_state: 'CA',
    property_zip: '90210',
    year_built: 2005,
    tax_parcel_info: null,
    other_description: null,
    land_included: true,
    other_property_info: null,

    buyer_name: 'Buyer legal name',
    buyer_mailing_street: null,
    buyer_mailing_city: null,
    buyer_mailing_state: null,
    buyer_mailing_zip: null,
    buyer_phone: '3105550100',
    buyer_email: '',
    buyer_mailing_street_2: null,
    buyer_mailing_city_2: null,
    buyer_mailing_state_2: null,
    buyer_mailing_zip_2: null,
    buyer_phone_2: '',
    buyer_email_2: '',

    title_type: null,

    seller_name: 'Seller legal name',
    seller_mailing_street: null,
    seller_mailing_city: null,
    seller_mailing_state: null,
    seller_mailing_zip: null,
    seller_phone: '3105550101',
    seller_email: '',
    seller_phone_2: '',
    seller_email_2: '',

    buyer_agent_name: null,
    seller_agent_name: null,

    personal_property_description: null,

    earnest_money_escrow_required: true,
    earnest_money_deadline_time: null,

    all_cash_proof_deadline_date,
    all_cash_proof_deadline_time: '5:00 PM',

    bank_loan_type: 'conventional',
    bank_loan_type_other: null,
    bank_preapproval_letter_date: fmt(today),
    bank_seller_notification_days: 7,
    bank_contingent_on_sale: false,
    fha_addendum_uploaded: false,
    fha_addendum_path: null,
    va_addendum_uploaded: false,
    va_addendum_path: null,

    seller_financing_loan_amount: null,
    seller_financing_down_payment: null,
    seller_financing_interest_rate: null,
    seller_financing_term_value: null,
    seller_financing_term_unit: null,
    seller_financing_doc_deadline,
    seller_financing_approval_deadline,

    contingent_on_other_property: false,
    contingent_property_address: null,
    contingent_property_days: null,

    closing_costs_responsibility: 'both',
    closing_time: '12:00 PM',
    title_company: null,

    survey_buyer_notification_days: 5,
    survey_seller_remedy_days: 5,
    mineral_rights_transferred: true,
    title_buyer_review_days: 10,
    title_seller_remedy_days: 5,

    inspection_contractor_deadline_date,
    inspection_contractor_deadline_time: '5:00 PM',
    inspection_disclosures_deadline_date,
    inspection_disclosures_deadline_time: '5:00 PM',
    inspection_negotiation_days: 5,

    appraisal_contingency: true,
    appraisal_negotiation_days: 5,

    offer_expiration_date,
    offer_expiration_time: '5:00 PM',

    earnest_money_return_days: 5,

    lead_paint_disclosure_required: false,
    lead_paint_known_hazards: null,
    lead_paint_hazard_description: null,
    lead_paint_records_available: null,
    lead_paint_pamphlet_delivered: false,
    lead_paint_pamphlet_delivery_method: null,
    lead_paint_pamphlet_delivery_date: null,

    custom_addendums: null,
    additional_terms: null,

    wizard_completed: false,
    pdf_generated_at: null,
  };
}
