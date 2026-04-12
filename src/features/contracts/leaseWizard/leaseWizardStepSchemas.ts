/**
 * Per-step Zod schemas for the lease wizard (Sprint 6A T9).
 * Built from `leaseAgreementFormObjectSchema.pick()` plus the same cross-field rules
 * that apply to fields introduced in that step.
 */

import { differenceInCalendarMonths, parseISO } from 'date-fns';
import { z } from 'zod';

import { leaseAgreementFormObjectSchema } from '@/features/contracts/schemas/leaseAgreementForm.schema';
import { isValidPhone } from '@/lib/serviceProxy';
import i18n from '@/i18n';

const lt = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`contracts:validation.leaseAgreement.${key}`, options);

const step1 = leaseAgreementFormObjectSchema
  .pick({
    linkedPropertyId: true,
    property_timezone: true,
    residence_type: true,
    residence_type_other: true,
    property_street: true,
    property_unit: true,
    property_city: true,
    property_state: true,
    property_zip: true,
    year_built: true,
    bedrooms: true,
    bathrooms: true,
  })
  .superRefine((data, ctx) => {
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
  });

const step2 = leaseAgreementFormObjectSchema
  .pick({
    linkedLandlordOwnerId: true,
    linkedTenant1Id: true,
    linkedTenant2Id: true,
    landlord_name: true,
    landlord_mailing_street: true,
    landlord_mailing_city: true,
    landlord_mailing_state: true,
    landlord_mailing_zip: true,
    landlord_phone: true,
    landlord_email: true,
    tenant_name: true,
    tenant_phone: true,
    tenant_email: true,
    tenant_name_2: true,
    tenant_phone_2: true,
    tenant_email_2: true,
    additional_occupants: true,
    co_signer_name: true,
    co_signer_phone: true,
    co_signer_email: true,
    co_signer_role: true,
  })
  .superRefine((data, ctx) => {
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
  });

const step3 = leaseAgreementFormObjectSchema
  .pick({
    lease_type: true,
    after_term_action: true,
    termination_notice_days: true,
    start_date: true,
    end_date: true,
  })
  .superRefine((data, ctx) => {
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
  });

const step4 = leaseAgreementFormObjectSchema
  .pick({
    rent_amount: true,
    deposit: true,
    rent_due_day: true,
    security_deposit_enabled: true,
    security_deposit_amount: true,
    security_deposit_return_days: true,
    late_fee_type: true,
    late_fee_amount: true,
    late_fee_per: true,
    late_fee_interest_pct: true,
    nsf_fee_enabled: true,
    nsf_fee_amount: true,
    early_move_in_enabled: true,
    early_move_in_date: true,
    early_move_in_prorated_rent: true,
    prepaid_rent_enabled: true,
    prepaid_rent_amount: true,
    prepaid_rent_start: true,
    prepaid_rent_end: true,
    parking_fee_enabled: true,
    parking_fee_amount: true,
  })
  .superRefine((data, ctx) => {
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
  });

const step5 = leaseAgreementFormObjectSchema
  .pick({
    payment_methods: true,
    paypal_email: true,
    venmo_handle: true,
    zelle_contact: true,
    payment_method_other: true,
    utilities_landlord_covered: true,
    utilities_other: true,
  })
  .superRefine((data, ctx) => {
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

const step6 = leaseAgreementFormObjectSchema.pick({
  furnished_enabled: true,
  furnished_rooms: true,
  appliances_enabled: true,
  appliances_list: true,
  appliances_other: true,
  common_areas_enabled: true,
  common_areas_description: true,
  parking_enabled: true,
  parking_spaces: true,
  move_in_inspection_required: true,
});

const step7 = leaseAgreementFormObjectSchema.pick({
  pets_allowed: true,
  pets_count: true,
  pets_types: true,
  pets_max_weight_lbs: true,
  pets_deposit_amount: true,
  pets_deposit_refundable: true,
  subletting_policy: true,
  renters_insurance_required: true,
  renters_insurance_min_coverage: true,
  smoking_allowed: true,
});

const step8 = leaseAgreementFormObjectSchema
  .pick({
    landlord_notice_custom_address: true,
    tenant_notice_custom_address: true,
    lead_paint_disclosure_required: true,
    lead_paint_known_hazards: true,
    lead_paint_hazard_description: true,
    lead_paint_records_available: true,
    lead_paint_records_description: true,
    lead_paint_pamphlet_delivered: true,
    lead_paint_pamphlet_delivery_method: true,
    lead_paint_pamphlet_delivery_date: true,
    additional_terms: true,
    year_built: true,
  })
  .superRefine((data, ctx) => {
    const leadRequired =
      data.year_built == null || data.year_built < 1978 || data.lead_paint_disclosure_required;
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
        if (!data.lead_paint_hazard_description?.trim().length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: lt('leadPaintHazardDescriptionRequired'),
            path: ['lead_paint_hazard_description'],
          });
        }
      }
    }
  });

/** 1-based step index → schema (steps 1–8). */
export const LEASE_WIZARD_STEP_SCHEMAS: Record<number, z.ZodTypeAny> = {
  1: step1,
  2: step2,
  3: step3,
  4: step4,
  5: step5,
  6: step6,
  7: step7,
  8: step8,
};

export const LEASE_WIZARD_TOTAL_STEPS = 8;
