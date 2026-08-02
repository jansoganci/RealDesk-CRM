import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import type { SupportedDocumentState } from '@/config/supportedDocumentStates';
import { formatCurrency } from '@/lib/currency';

import { fmtDate, fmtList, fmtMoney, fmtYesNo } from './formatHelpers';

const USD = 'USD';

function lateFeeSummary(form: LeaseAgreementFormValues): string {
  if (form.late_fee_type === 'none') return 'Late fee: None.';
  if (form.late_fee_type === 'fixed') {
    const per = form.late_fee_per === 'day' ? 'per day' : 'per occurrence';
    return `Late fee: ${fmtMoney(form.late_fee_amount)} (${per}).`;
  }
  if (form.late_fee_type === 'interest') {
    return `Late fee: ${form.late_fee_interest_pct ?? 0}% interest as specified.`;
  }
  return 'Late fee: —.';
}

export function buildLeaseFormContext(
  form: LeaseAgreementFormValues,
  state: SupportedDocumentState,
): Record<string, string> {
  const propertyFull = [form.property_street, form.property_unit, form.property_city, form.property_state, form.property_zip]
    .filter(Boolean)
    .join(', ');

  const landlordContact = [
    form.landlord_email ? `Email: ${form.landlord_email}` : null,
    form.landlord_phone ? `Phone: ${form.landlord_phone}` : null,
    form.landlord_mailing_street
      ? `Mailing: ${[form.landlord_mailing_street, form.landlord_mailing_city, form.landlord_mailing_state, form.landlord_mailing_zip].filter(Boolean).join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('. ');

  const tenant2 =
    form.tenant_name_2?.trim()
      ? ` and ${form.tenant_name_2}${form.tenant_email_2 ? ` (${form.tenant_email_2})` : ''}`
      : '';

  const cosigner = form.co_signer_name?.trim()
    ? `. Co-signer/guarantor: ${form.co_signer_name}${form.co_signer_email ? ` (${form.co_signer_email})` : ''}`
    : '';

  const leaseType =
    form.lease_type === 'month_to_month'
      ? 'Month-to-month'
      : form.lease_type === 'standard'
        ? 'Standard (fixed term)'
        : String(form.lease_type);

  const endClause = form.end_date ? ` and ends on ${fmtDate(form.end_date)}` : '';

  const prepaid = form.prepaid_rent_enabled
    ? `${fmtMoney(form.prepaid_rent_amount)} from ${fmtDate(form.prepaid_rent_start)} to ${fmtDate(form.prepaid_rent_end)}`
    : 'None';

  const parking = form.parking_enabled
    ? `Enabled (${form.parking_spaces ?? '—'} spaces)${form.parking_fee_enabled ? `; fee ${fmtMoney(form.parking_fee_amount)}` : ''}`
    : 'Not included';

  const amenities = [
    form.furnished_enabled ? `Furnished rooms: ${fmtList(form.furnished_rooms)}` : 'Unfurnished',
    form.appliances_enabled ? `Appliances: ${fmtList(form.appliances_list)}${form.appliances_other ? ` (${form.appliances_other})` : ''}` : null,
    form.common_areas_enabled ? `Common areas: ${form.common_areas_description ?? 'Yes'}` : null,
  ]
    .filter(Boolean)
    .join('; ');

  const petsDetails = form.pets_allowed
    ? `types ${form.pets_types ?? '—'}, count ${form.pets_count ?? '—'}, max weight ${form.pets_max_weight_lbs ?? '—'} lbs`
    : 'n/a';

  const petsDeposit = form.pets_deposit_amount != null
    ? `${fmtMoney(form.pets_deposit_amount)} (${form.pets_deposit_refundable ? 'refundable' : 'non-refundable/as stated'})`
    : 'None stated';

  return {
    jurisdiction: state,
    jurisdiction_placeholder: state,
    landlord_name: form.landlord_name,
    landlord_contact_block: landlordContact ? ` (${landlordContact})` : '',
    tenant_name: form.tenant_name,
    tenant2_block: tenant2,
    cosigner_block: cosigner,
    additional_occupants: fmtList(form.additional_occupants),
    property_full_address: propertyFull,
    residence_type: form.residence_type_other?.trim() || form.residence_type,
    bedrooms: String(form.bedrooms ?? '—'),
    bathrooms: String(form.bathrooms ?? '—'),
    year_built: form.year_built != null ? String(form.year_built) : '—',
    property_timezone: form.property_timezone || '—',
    lease_type: leaseType,
    start_date: fmtDate(form.start_date),
    end_date_clause: endClause,
    after_term_action: form.after_term_action || '—',
    termination_notice_days: String(form.termination_notice_days ?? '—'),
    rent_amount: formatCurrency(form.rent_amount ?? 0, USD),
    rent_due_day: String(form.rent_due_day ?? '—'),
    payment_methods: fmtList(form.payment_methods),
    late_fee_summary: lateFeeSummary(form),
    nsf_summary: form.nsf_fee_enabled ? `NSF fee: ${fmtMoney(form.nsf_fee_amount)}.` : 'NSF fee: none stated.',
    prepaid_rent_summary: prepaid,
    security_deposit_enabled: fmtYesNo(form.security_deposit_enabled),
    security_deposit_amount: fmtMoney(form.security_deposit_amount),
    security_deposit_return_days: String(form.security_deposit_return_days ?? '—'),
    pets_deposit_summary: petsDeposit,
    utilities_landlord: fmtList(form.utilities_landlord_covered),
    utilities_other: form.utilities_other?.trim() || '—',
    parking_summary: parking,
    amenities_summary: amenities || '—',
    pets_allowed: fmtYesNo(form.pets_allowed),
    pets_details: petsDetails,
    subletting_policy: form.subletting_policy || '—',
    smoking_allowed: fmtYesNo(form.smoking_allowed),
    renters_insurance_required: fmtYesNo(form.renters_insurance_required),
    renters_insurance_min_coverage: fmtMoney(form.renters_insurance_min_coverage),
    move_in_inspection_required: fmtYesNo(form.move_in_inspection_required),
    additional_terms: form.additional_terms?.trim() || 'None stated.',
  };
}
