/**
 * Sprint 6A — US Lease Agreement Wizard (8 steps).
 * Validates full form for submit; cross-field rules use superRefine.
 */

import { differenceInCalendarMonths, parseISO } from 'date-fns';
import { z } from 'zod';
import i18n from '@/i18n';
import { isValidPhone, isValidState, isValidZipCode } from '@/lib/serviceProxy';

const lt = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`contracts:validation.leaseAgreement.${key}`, options);

const nullableUuid = z.preprocess((v) => {
  if (v === '' || v === undefined) return null;
  return v;
}, z.union([z.string().uuid(), z.null()]));

const optionalEmail = z.union([z.string().email(lt('invalidEmail')), z.literal('')]);

const requiredUsPhone = z
  .string()
  .min(10, lt('phoneMin'))
  .refine((v) => isValidPhone(v), { message: lt('invalidPhone') });

const optionalUsPhone = z
  .string()
  .refine((v) => v === '' || isValidPhone(v), { message: lt('invalidPhone') });

const usState = z
  .string()
  .length(2, lt('stateLength'))
  .refine((s) => isValidState(s), { message: lt('invalidState') });

const usZip = z
  .string()
  .min(5, lt('zipMin'))
  .refine((z) => isValidZipCode(z), { message: lt('invalidZip') });

export const leasePaymentMethodEnum = z.enum([
  'ach',
  'cash',
  'check',
  'credit_card',
  'paypal',
  'venmo',
  'zelle',
  'other',
]);

/** Base shape (no cross-field `superRefine`). Used for per-step `.pick()` validation in the lease wizard shell. */
export const leaseAgreementFormObjectSchema = z.object({
    linkedPropertyId: nullableUuid,
    linkedTenant1Id: nullableUuid,
    linkedTenant2Id: nullableUuid,
    linkedLandlordOwnerId: nullableUuid,

    lease_type: z.enum(['standard', 'month_to_month'], {
      required_error: lt('leaseTypeRequired'),
    }),
    after_term_action: z.enum(['terminate', 'convert_to_month_to_month']).nullable(),
    termination_notice_days: z.coerce
      .number()
      .int()
      .min(1, lt('terminationNoticeMin'))
      .max(365, lt('terminationNoticeMax'))
      .nullable(),
    start_date: z.string().min(1, lt('startDateRequired')),
    end_date: z.string().min(1, lt('endDateRequired')),
    rent_amount: z.coerce.number().positive(lt('rentPositive')),
    deposit: z.coerce.number().min(0, lt('depositNonNegative')).nullable(),

    property_timezone: z.string().min(1, lt('propertyTimezoneRequired')),
    residence_type: z.enum(['apartment', 'house', 'condo', 'other']),
    residence_type_other: z.string().nullable(),
    property_street: z.string().min(3, lt('streetMin')),
    property_unit: z.string().nullable(),
    property_city: z.string().min(2, lt('cityMin')),
    property_state: usState,
    property_zip: usZip,
    year_built: z.coerce.number().int().min(1600).max(2100).nullable(),
    bedrooms: z.coerce.number().min(0.5, lt('bedroomsMin')).max(99, lt('bedroomsMax')),
    bathrooms: z.coerce.number().min(0.5, lt('bathroomsMin')).max(99, lt('bathroomsMax')),

    landlord_name: z.string().min(2, lt('landlordNameMin')),
    landlord_mailing_street: z.string().nullable(),
    landlord_mailing_city: z.string().nullable(),
    landlord_mailing_state: z.string().nullable(),
    landlord_mailing_zip: z.string().nullable(),
    landlord_phone: optionalUsPhone,
    landlord_email: optionalEmail,

    tenant_name: z.string().min(2, lt('tenantNameMin')),
    tenant_phone: requiredUsPhone,
    tenant_email: optionalEmail,
    tenant_name_2: z.string().nullable(),
    tenant_phone_2: optionalUsPhone,
    tenant_email_2: optionalEmail,
    additional_occupants: z.array(z.string()),

    co_signer_name: z.string().nullable(),
    co_signer_phone: optionalUsPhone,
    co_signer_email: optionalEmail,
    co_signer_role: z.enum(['co_signer', 'guarantor']).nullable(),

    rent_due_day: z.coerce.number().int().min(1).max(31),

    security_deposit_enabled: z.boolean(),
    security_deposit_amount: z.coerce.number().min(0).nullable(),
    security_deposit_return_days: z.coerce.number().int().min(1).max(90).nullable(),

    late_fee_type: z.enum(['none', 'fixed', 'interest']),
    late_fee_amount: z.coerce.number().min(0).nullable(),
    late_fee_per: z.enum(['occurrence', 'day']).nullable(),
    late_fee_interest_pct: z.coerce.number().min(0).max(100).nullable(),

    nsf_fee_enabled: z.boolean(),
    nsf_fee_amount: z.coerce.number().min(0).nullable(),

    early_move_in_enabled: z.boolean(),
    early_move_in_date: z.string().nullable(),
    early_move_in_prorated_rent: z.coerce.number().min(0).nullable(),

    prepaid_rent_enabled: z.boolean(),
    prepaid_rent_amount: z.coerce.number().min(0).nullable(),
    prepaid_rent_start: z.string().nullable(),
    prepaid_rent_end: z.string().nullable(),

    parking_fee_enabled: z.boolean(),
    parking_fee_amount: z.coerce.number().min(0).nullable(),

    payment_methods: z.array(leasePaymentMethodEnum).min(1, lt('paymentMethodsMin')),
    paypal_email: optionalEmail,
    venmo_handle: z.string().nullable(),
    zelle_contact: z.string().nullable(),
    payment_method_other: z.string().nullable(),

    utilities_landlord_covered: z.array(z.string()),
    utilities_other: z.string().nullable(),

    furnished_enabled: z.boolean(),
    furnished_rooms: z.array(z.string()).nullable(),
    appliances_enabled: z.boolean(),
    appliances_list: z.array(z.string()).nullable(),
    appliances_other: z.string().nullable(),

    common_areas_enabled: z.boolean(),
    common_areas_description: z.string().nullable(),

    parking_enabled: z.boolean(),
    parking_spaces: z.coerce.number().int().min(0).nullable(),

    move_in_inspection_required: z.boolean(),

    pets_allowed: z.boolean(),
    pets_count: z.coerce.number().int().min(0).nullable(),
    pets_types: z.string().nullable(),
    pets_max_weight_lbs: z.coerce.number().int().min(0).nullable(),
    pets_deposit_amount: z.coerce.number().min(0).nullable(),
    pets_deposit_refundable: z.boolean().nullable(),

    subletting_policy: z.enum(['not_allowed', 'with_consent', 'no_restriction']),
    renters_insurance_required: z.boolean(),
    renters_insurance_min_coverage: z.coerce.number().min(0).nullable(),
    smoking_allowed: z.boolean(),

    landlord_notice_custom_address: z.string().nullable(),
    tenant_notice_custom_address: z.string().nullable(),

    lead_paint_disclosure_required: z.boolean(),
    lead_paint_known_hazards: z.boolean().nullable(),
    lead_paint_hazard_description: z.string().nullable(),
    lead_paint_records_available: z.boolean().nullable(),
    lead_paint_records_description: z.string().nullable(),
    lead_paint_pamphlet_delivered: z.boolean(),
    lead_paint_pamphlet_delivery_method: z
      .enum(['in_person', 'email', 'mail'])
      .nullable(),
    lead_paint_pamphlet_delivery_date: z.string().nullable(),

    additional_terms: z
      .string()
      .max(2000, lt('additionalTermsMax'))
      .nullable(),
  });

export const leaseAgreementFormSchema = leaseAgreementFormObjectSchema.superRefine((data, ctx) => {
    if (data.residence_type === 'other') {
      const o = data.residence_type_other?.trim() ?? '';
      if (o.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('residenceTypeOtherRequired'),
          path: ['residence_type_other'],
        });
      }
    }

    if (data.lease_type === 'standard') {
      const start = parseISO(data.start_date);
      const end = parseISO(data.end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('validDate'),
          path: ['end_date'],
        });
      } else {
        if (end <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: lt('endDateAfterStart'),
            path: ['end_date'],
          });
        } else if (differenceInCalendarMonths(end, start) < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: lt('leaseMinOneMonth'),
            path: ['end_date'],
          });
        }
      }
      if (data.after_term_action == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('afterTermRequired'),
          path: ['after_term_action'],
        });
      }
    }

    if (data.lease_type === 'month_to_month') {
      if (data.termination_notice_days == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('terminationNoticeRequired'),
          path: ['termination_notice_days'],
        });
      }
      if (data.after_term_action != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('afterTermNotForM2m'),
          path: ['after_term_action'],
        });
      }
    }

    const t2Any =
      (data.tenant_name_2?.trim() ?? '').length > 0 ||
      (data.tenant_phone_2?.trim() ?? '').length > 0 ||
      (data.tenant_email_2?.trim() ?? '').length > 0;
    if (t2Any) {
      if ((data.tenant_name_2?.trim() ?? '').length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('tenant2NameRequired'),
          path: ['tenant_name_2'],
        });
      }
      if (!data.tenant_phone_2?.trim() || !isValidPhone(data.tenant_phone_2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('tenant2PhoneRequired'),
          path: ['tenant_phone_2'],
        });
      }
    }

    const cosAny =
      (data.co_signer_name?.trim() ?? '').length > 0 ||
      (data.co_signer_phone?.trim() ?? '').length > 0 ||
      (data.co_signer_email?.trim() ?? '').length > 0;
    if (cosAny) {
      if ((data.co_signer_name?.trim() ?? '').length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('coSignerNameRequired'),
          path: ['co_signer_name'],
        });
      }
      if (!data.co_signer_phone?.trim() || !isValidPhone(data.co_signer_phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('coSignerPhoneRequired'),
          path: ['co_signer_phone'],
        });
      }
      if (data.co_signer_role == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('coSignerRoleRequired'),
          path: ['co_signer_role'],
        });
      }
    }

    const y = data.year_built;
    const leadRequired =
      y == null ||
      (typeof y === 'number' && (Number.isNaN(y) || y < 1978));
    if (leadRequired) {
      if (!data.lead_paint_pamphlet_delivered) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('leadPaintPamphletRequired'),
          path: ['lead_paint_pamphlet_delivered'],
        });
      }
      if (data.lead_paint_pamphlet_delivered) {
        if (data.lead_paint_pamphlet_delivery_method == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: lt('leadPaintDeliveryMethodRequired'),
            path: ['lead_paint_pamphlet_delivery_method'],
          });
        }
        if (!data.lead_paint_pamphlet_delivery_date?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: lt('leadPaintDeliveryDateRequired'),
            path: ['lead_paint_pamphlet_delivery_date'],
          });
        }
      }
      if (data.lead_paint_known_hazards === true) {
        if (!(data.lead_paint_hazard_description?.trim().length)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: lt('leadPaintHazardDescriptionRequired'),
            path: ['lead_paint_hazard_description'],
          });
        }
      }
    }

    if (data.late_fee_type === 'fixed') {
      if (data.late_fee_amount == null || data.late_fee_amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('lateFeeAmountRequired'),
          path: ['late_fee_amount'],
        });
      }
      if (data.late_fee_per == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('lateFeePerRequired'),
          path: ['late_fee_per'],
        });
      }
    }
    if (data.late_fee_type === 'interest') {
      if (data.late_fee_interest_pct == null || data.late_fee_interest_pct <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('lateFeeInterestRequired'),
          path: ['late_fee_interest_pct'],
        });
      }
    }

    if (data.security_deposit_enabled) {
      if (data.security_deposit_amount == null || data.security_deposit_amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('securityDepositAmountRequired'),
          path: ['security_deposit_amount'],
        });
      }
    }

    if (data.nsf_fee_enabled) {
      if (data.nsf_fee_amount == null || data.nsf_fee_amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('nsfFeeAmountRequired'),
          path: ['nsf_fee_amount'],
        });
      }
    }

    if (data.early_move_in_enabled) {
      if (!data.early_move_in_date?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('earlyMoveInDateRequired'),
          path: ['early_move_in_date'],
        });
      }
    }

    if (data.prepaid_rent_enabled) {
      if (data.prepaid_rent_amount == null || data.prepaid_rent_amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('prepaidRentAmountRequired'),
          path: ['prepaid_rent_amount'],
        });
      }
    }

    if (data.parking_fee_enabled) {
      if (data.parking_fee_amount == null || data.parking_fee_amount < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('parkingFeeAmountRequired'),
          path: ['parking_fee_amount'],
        });
      }
    }

    if (data.payment_methods.includes('paypal') && !(data.paypal_email?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('paypalEmailRequired'),
        path: ['paypal_email'],
      });
    }
    if (data.payment_methods.includes('venmo') && !(data.venmo_handle?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('venmoHandleRequired'),
        path: ['venmo_handle'],
      });
    }
    if (data.payment_methods.includes('zelle') && !(data.zelle_contact?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('zelleContactRequired'),
        path: ['zelle_contact'],
      });
    }
    if (data.payment_methods.includes('other') && !(data.payment_method_other?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('paymentMethodOtherRequired'),
        path: ['payment_method_other'],
      });
    }
  });

export type LeaseAgreementFormValues = z.infer<typeof leaseAgreementFormSchema>;
