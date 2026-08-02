import type { PurchaseAgreementFormValues } from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import type { SupportedDocumentState } from '@/config/supportedDocumentStates';
import { formatCurrency } from '@/lib/currency';

import { purchaseContingencyGuidance } from './purchaseStateDisclosures';
import { fmtDate, fmtMoney, fmtYesNo, optionalClause } from './formatHelpers';

const USD = 'USD';

function financingSummary(form: PurchaseAgreementFormValues): string {
  if (form.financing_type === 'all_cash') {
    return `All-cash transaction. Proof of funds deadline: ${fmtDate(form.all_cash_proof_deadline_date)} ${form.all_cash_proof_deadline_time ?? ''}`.trim();
  }
  if (form.financing_type === 'seller_financing') {
    return [
      'Seller financing.',
      `Loan amount: ${fmtMoney(form.seller_financing_loan_amount)}.`,
      `Down payment: ${fmtMoney(form.seller_financing_down_payment)}.`,
      `Interest rate: ${form.seller_financing_interest_rate ?? '—'}%.`,
      `Term: ${form.seller_financing_term_value ?? '—'} ${form.seller_financing_term_unit ?? ''}.`,
      `Doc deadline: ${fmtDate(form.seller_financing_doc_deadline)}.`,
      `Approval deadline: ${fmtDate(form.seller_financing_approval_deadline)}.`,
    ].join(' ');
  }
  return [
    'Third-party / bank financing.',
    `Loan type: ${form.bank_loan_type_other?.trim() || form.bank_loan_type || '—'}.`,
    `Pre-approval letter date: ${fmtDate(form.bank_preapproval_letter_date)}.`,
    `Seller notification days (financing): ${form.bank_seller_notification_days ?? '—'}.`,
    `Contingent on sale of other property: ${fmtYesNo(form.bank_contingent_on_sale)}.`,
  ].join(' ');
}

export function buildPurchaseFormContext(
  form: PurchaseAgreementFormValues,
  state: SupportedDocumentState,
): Record<string, string> {
  const propertyFull = [form.property_street, form.property_city, form.property_state, form.property_zip]
    .filter(Boolean)
    .join(', ');

  const inspection = [
    `Disclosures deadline: ${fmtDate(form.inspection_disclosures_deadline_date)} ${form.inspection_disclosures_deadline_time ?? ''}`.trim(),
    `Contractor deadline: ${fmtDate(form.inspection_contractor_deadline_date)} ${form.inspection_contractor_deadline_time ?? ''}`.trim(),
    `Negotiation days: ${form.inspection_negotiation_days ?? '—'}`,
  ].join('; ');

  const appraisal = form.appraisal_contingency
    ? `Yes; negotiation days: ${form.appraisal_negotiation_days ?? '—'}`
    : 'No appraisal contingency stated';

  const surveyTitle = [
    `Survey — buyer notify days: ${form.survey_buyer_notification_days ?? '—'}; seller remedy days: ${form.survey_seller_remedy_days ?? '—'}`,
    `Title — buyer review days: ${form.title_buyer_review_days ?? '—'}; seller remedy days: ${form.title_seller_remedy_days ?? '—'}; type: ${form.title_type ?? '—'}`,
  ].join('. ');

  return {
    jurisdiction: state,
    seller_name: form.seller_name,
    seller2_block: optionalClause(form.seller_name_2?.trim(), ` and ${form.seller_name_2}`),
    buyer_name: form.buyer_name,
    buyer2_block: optionalClause(form.buyer_name_2?.trim(), ` and ${form.buyer_name_2}`),
    buyer_agent_name: form.buyer_agent_name?.trim() || '—',
    seller_agent_name: form.seller_agent_name?.trim() || '—',
    effective_date: fmtDate(form.effective_date),
    property_full_address: propertyFull,
    property_type: form.property_type_other?.trim() || form.property_type || '—',
    year_built: form.year_built != null ? String(form.year_built) : '—',
    tax_parcel_info: form.tax_parcel_info?.trim() || form.other_property_info?.trim() || '—',
    land_mineral_summary: `Land included: ${fmtYesNo(form.land_included)}. Mineral rights transferred: ${fmtYesNo(form.mineral_rights_transferred)}.`,
    personal_property_description: form.personal_property_description?.trim() || 'None described',
    purchase_price: formatCurrency(form.purchase_price ?? 0, USD),
    earnest_money_amount: formatCurrency(form.earnest_money_amount ?? 0, USD),
    earnest_money_due_date: fmtDate(form.earnest_money_due_date),
    earnest_money_time_clause: optionalClause(form.earnest_money_deadline_time, ` at ${form.earnest_money_deadline_time}`),
    earnest_money_escrow_required: fmtYesNo(form.earnest_money_escrow_required),
    earnest_money_return_days: String(form.earnest_money_return_days ?? '—'),
    financing_summary: financingSummary(form),
    closing_date: fmtDate(form.closing_date),
    closing_time_clause: optionalClause(form.closing_time, ` at ${form.closing_time}`),
    title_company: form.title_company?.trim() || '—',
    closing_costs_responsibility: form.closing_costs_responsibility || '—',
    governing_law_state: form.governing_law_state || state,
    contingency_guidance: purchaseContingencyGuidance(state),
    inspection_summary: inspection,
    appraisal_summary: appraisal,
    survey_title_summary: surveyTitle,
    offer_expiration: `${fmtDate(form.offer_expiration_date)} ${form.offer_expiration_time ?? ''}`.trim(),
    additional_terms: form.additional_terms?.trim() || 'None stated.',
  };
}
