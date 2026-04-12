/**
 * Rebuilds wizard form values from persisted `contracts` + `purchase_details` rows
 * (e.g. PDF regeneration after a counter-offer). Starts from wizard defaults and overlays DB.
 */

import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { getPurchaseAgreementFormDefaults } from '@/features/contracts/purchaseWizard/purchaseAgreementFormDefaults';
import type { Contract, PurchaseDetails } from '@/types';

function isoDateOnly(v: string | null | undefined): string {
  if (!v) return '';
  return v.length >= 10 ? v.slice(0, 10) : v;
}

/**
 * Maps stored purchase contract rows back to the 9-step wizard shape for PDF generation.
 */
export function purchaseAgreementFormValuesFromDb(
  contract: Contract,
  d: PurchaseDetails,
): PurchaseAgreementFormValues {
  const base = getPurchaseAgreementFormDefaults();
  const fin = d.financing_type as PurchaseAgreementFormValues['financing_type'];

  return {
    ...base,
    financing_type: fin,

    linkedPropertyId: contract.property_id,
    linkedSellerOwnerId: null,
    seller_id: contract.seller_id,

    effective_date: isoDateOnly(contract.effective_date) || base.effective_date,
    closing_date: isoDateOnly(contract.closing_date) || base.closing_date,
    purchase_price: Number(contract.purchase_price ?? base.purchase_price),
    earnest_money_amount: Number(contract.earnest_money_amount ?? base.earnest_money_amount),
    earnest_money_due_date: isoDateOnly(contract.earnest_money_due_date) || base.earnest_money_due_date,
    governing_law_state: (contract.governing_law_state ?? base.governing_law_state) as PurchaseAgreementFormValues['governing_law_state'],
    deal_status: (contract.deal_status as PurchaseAgreementFormValues['deal_status']) ?? base.deal_status,
    buyer_name_2: contract.buyer_name_2,
    seller_name_2: contract.seller_name_2,

    property_timezone: d.property_timezone,
    property_type: d.property_type as PurchaseAgreementFormValues['property_type'],
    property_type_other: d.property_type_other,
    property_street: d.property_street,
    property_city: d.property_city,
    property_state: d.property_state,
    property_zip: d.property_zip,
    year_built: d.year_built,
    tax_parcel_info: d.tax_parcel_info,
    other_description: d.other_description,
    land_included: d.land_included,
    other_property_info: d.other_property_info,

    buyer_name: d.buyer_name,
    buyer_mailing_street: d.buyer_mailing_street,
    buyer_mailing_city: d.buyer_mailing_city,
    buyer_mailing_state: d.buyer_mailing_state,
    buyer_mailing_zip: d.buyer_mailing_zip,
    buyer_phone: d.buyer_phone ?? base.buyer_phone,
    buyer_email: d.buyer_email ?? '',
    buyer_mailing_street_2: d.buyer_mailing_street_2,
    buyer_mailing_city_2: d.buyer_mailing_city_2,
    buyer_mailing_state_2: d.buyer_mailing_state_2,
    buyer_mailing_zip_2: d.buyer_mailing_zip_2,
    buyer_phone_2: d.buyer_phone_2 ?? '',
    buyer_email_2: d.buyer_email_2 ?? '',

    title_type: (d.title_type as PurchaseAgreementFormValues['title_type']) ?? null,

    seller_name: d.seller_name,
    seller_mailing_street: d.seller_mailing_street,
    seller_mailing_city: d.seller_mailing_city,
    seller_mailing_state: d.seller_mailing_state,
    seller_mailing_zip: d.seller_mailing_zip,
    seller_phone: d.seller_phone ?? base.seller_phone,
    seller_email: d.seller_email ?? '',
    seller_phone_2: d.seller_phone_2 ?? '',
    seller_email_2: d.seller_email_2 ?? '',

    buyer_agent_name: d.buyer_agent_name,
    seller_agent_name: d.seller_agent_name,

    personal_property_description: d.personal_property_description,

    earnest_money_escrow_required: d.earnest_money_escrow_required,
    earnest_money_deadline_time: d.earnest_money_deadline_time,

    all_cash_proof_deadline_date: d.all_cash_proof_deadline_date ?? base.all_cash_proof_deadline_date,
    all_cash_proof_deadline_time: d.all_cash_proof_deadline_time ?? base.all_cash_proof_deadline_time,

    bank_loan_type: (d.bank_loan_type as PurchaseAgreementFormValues['bank_loan_type']) ?? base.bank_loan_type,
    bank_loan_type_other: d.bank_loan_type_other,
    bank_preapproval_letter_date: d.bank_preapproval_letter_date ?? base.bank_preapproval_letter_date,
    bank_seller_notification_days: d.bank_seller_notification_days ?? base.bank_seller_notification_days,
    bank_contingent_on_sale: d.bank_contingent_on_sale,
    fha_addendum_uploaded: d.fha_addendum_uploaded,
    fha_addendum_path: d.fha_addendum_path,
    va_addendum_uploaded: d.va_addendum_uploaded,
    va_addendum_path: d.va_addendum_path,

    seller_financing_loan_amount: d.seller_financing_loan_amount,
    seller_financing_down_payment: d.seller_financing_down_payment,
    seller_financing_interest_rate: d.seller_financing_interest_rate,
    seller_financing_term_value: d.seller_financing_term_value,
    seller_financing_term_unit: (d.seller_financing_term_unit as PurchaseAgreementFormValues['seller_financing_term_unit']) ??
      base.seller_financing_term_unit,
    seller_financing_doc_deadline: d.seller_financing_doc_deadline ?? base.seller_financing_doc_deadline,
    seller_financing_approval_deadline: d.seller_financing_approval_deadline ?? base.seller_financing_approval_deadline,

    contingent_on_other_property: d.contingent_on_other_property,
    contingent_property_address: d.contingent_property_address,
    contingent_property_days: d.contingent_property_days,

    closing_costs_responsibility: d.closing_costs_responsibility as PurchaseAgreementFormValues['closing_costs_responsibility'],
    closing_time: d.closing_time ?? base.closing_time,
    title_company: d.title_company,

    survey_buyer_notification_days: d.survey_buyer_notification_days ?? base.survey_buyer_notification_days,
    survey_seller_remedy_days: d.survey_seller_remedy_days ?? base.survey_seller_remedy_days,
    mineral_rights_transferred: d.mineral_rights_transferred,
    title_buyer_review_days: d.title_buyer_review_days ?? base.title_buyer_review_days,
    title_seller_remedy_days: d.title_seller_remedy_days ?? base.title_seller_remedy_days,

    inspection_contractor_deadline_date: d.inspection_contractor_deadline_date ?? base.inspection_contractor_deadline_date,
    inspection_contractor_deadline_time: d.inspection_contractor_deadline_time ?? base.inspection_contractor_deadline_time,
    inspection_disclosures_deadline_date: d.inspection_disclosures_deadline_date ?? base.inspection_disclosures_deadline_date,
    inspection_disclosures_deadline_time: d.inspection_disclosures_deadline_time ?? base.inspection_disclosures_deadline_time,
    inspection_negotiation_days: d.inspection_negotiation_days ?? base.inspection_negotiation_days,

    appraisal_contingency: d.appraisal_contingency,
    appraisal_negotiation_days: d.appraisal_negotiation_days ?? base.appraisal_negotiation_days,

    offer_expiration_date: d.offer_expiration_date ?? base.offer_expiration_date,
    offer_expiration_time: d.offer_expiration_time ?? base.offer_expiration_time,

    earnest_money_return_days: d.earnest_money_return_days,

    lead_paint_disclosure_required: d.lead_paint_disclosure_required,
    lead_paint_known_hazards: d.lead_paint_known_hazards,
    lead_paint_hazard_description: d.lead_paint_hazard_description,
    lead_paint_records_available: d.lead_paint_records_available,
    lead_paint_pamphlet_delivered: d.lead_paint_pamphlet_delivered,
    lead_paint_pamphlet_delivery_method: d.lead_paint_pamphlet_delivery_method as PurchaseAgreementFormValues['lead_paint_pamphlet_delivery_method'],
    lead_paint_pamphlet_delivery_date: d.lead_paint_pamphlet_delivery_date,

    custom_addendums: d.custom_addendums,
    additional_terms: d.additional_terms,

    wizard_completed: d.wizard_completed,
    pdf_generated_at: d.pdf_generated_at,
  };
}
