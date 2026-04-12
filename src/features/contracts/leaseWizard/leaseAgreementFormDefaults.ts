/**
 * Default values for the lease wizard form. Keeps the full `LeaseAgreementFormValues`
 * shape valid for initial render and draft restore merges.
 */

import { addYears, format } from 'date-fns';

import type { LeaseAgreementFormValues } from '@/features/contracts/schemas/leaseAgreementForm.schema';

const PLACEHOLDER_LANDLORD = 'Landlord legal name';
const PLACEHOLDER_STREET = 'Street address';

export function getLeaseAgreementFormDefaults(): LeaseAgreementFormValues {
  const today = new Date();
  const start = format(today, 'yyyy-MM-dd');
  const end = format(addYears(today, 1), 'yyyy-MM-dd');

  return {
    linkedPropertyId: null,
    linkedTenant1Id: null,
    linkedTenant2Id: null,
    linkedLandlordOwnerId: null,

    lease_type: 'standard',
    after_term_action: 'terminate',
    termination_notice_days: 30,
    start_date: start,
    end_date: end,
    rent_amount: 1500,
    deposit: 0,

    property_timezone: 'America/Los_Angeles',
    residence_type: 'apartment',
    residence_type_other: null,
    property_street: PLACEHOLDER_STREET,
    property_unit: null,
    property_city: 'Los Angeles',
    property_state: 'CA',
    property_zip: '90210',
    year_built: 2000,
    bedrooms: 2,
    bathrooms: 1,

    landlord_name: PLACEHOLDER_LANDLORD,
    landlord_mailing_street: null,
    landlord_mailing_city: null,
    landlord_mailing_state: null,
    landlord_mailing_zip: null,
    landlord_phone: '',
    landlord_email: '',

    tenant_name: 'Primary tenant full name',
    tenant_phone: '5125551234',
    tenant_email: '',
    tenant_name_2: null,
    tenant_phone_2: '',
    tenant_email_2: '',
    additional_occupants: [],

    co_signer_name: null,
    co_signer_phone: '',
    co_signer_email: '',
    co_signer_role: null,

    rent_due_day: 1,

    security_deposit_enabled: false,
    security_deposit_amount: null,
    security_deposit_return_days: 21,

    late_fee_type: 'none',
    late_fee_amount: null,
    late_fee_per: null,
    late_fee_interest_pct: null,

    nsf_fee_enabled: false,
    nsf_fee_amount: null,

    early_move_in_enabled: false,
    early_move_in_date: null,
    early_move_in_prorated_rent: null,

    prepaid_rent_enabled: false,
    prepaid_rent_amount: null,
    prepaid_rent_start: null,
    prepaid_rent_end: null,

    parking_fee_enabled: false,
    parking_fee_amount: null,

    payment_methods: ['check'],
    paypal_email: '',
    venmo_handle: null,
    zelle_contact: null,
    payment_method_other: null,

    utilities_landlord_covered: [],
    utilities_other: null,

    furnished_enabled: false,
    furnished_rooms: null,
    appliances_enabled: false,
    appliances_list: null,
    appliances_other: null,

    common_areas_enabled: false,
    common_areas_description: null,

    parking_enabled: false,
    parking_spaces: null,

    move_in_inspection_required: true,

    pets_allowed: false,
    pets_count: null,
    pets_types: null,
    pets_max_weight_lbs: null,
    pets_deposit_amount: null,
    pets_deposit_refundable: null,

    subletting_policy: 'with_consent',
    renters_insurance_required: false,
    renters_insurance_min_coverage: null,
    smoking_allowed: false,

    landlord_notice_custom_address: null,
    tenant_notice_custom_address: null,

    lead_paint_disclosure_required: false,
    lead_paint_known_hazards: null,
    lead_paint_hazard_description: null,
    lead_paint_records_available: null,
    lead_paint_records_description: null,
    lead_paint_pamphlet_delivered: false,
    lead_paint_pamphlet_delivery_method: null,
    lead_paint_pamphlet_delivery_date: null,

    additional_terms: null,
  };
}
