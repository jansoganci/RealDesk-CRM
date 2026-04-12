/**
 * Sprint 6B — US Purchase Agreement Wizard (9 steps).
 * `financing_type` uses z.discriminatedUnion; cross-field rules use superRefine.
 */

import { parseISO } from 'date-fns';
import { z } from 'zod';
import i18n from '@/i18n';
import { isValidPhone, isValidState, isValidZipCode } from '@/lib/serviceProxy';

const lt = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`contracts:validation.purchaseAgreement.${key}`, options);

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
] as const;

const nullableUuid = z.preprocess((v) => {
  if (v === '' || v === undefined) return null;
  return v;
}, z.union([z.string().uuid(), z.null()]));

const optionalEmail = z.union([z.string().email(lt('invalidEmail')), z.literal('')]);

const optionalUsPhone = z
  .string()
  .refine((v) => v === '' || isValidPhone(v), { message: lt('invalidPhone') });

const requiredUsPhone = z
  .string()
  .min(10, lt('phoneMin'))
  .refine((v) => isValidPhone(v), { message: lt('invalidPhone') });

const usState = z
  .string()
  .length(2, lt('stateLength'))
  .refine((s) => isValidState(s), { message: lt('invalidState') });

const usZip = z
  .string()
  .min(5, lt('zipMin'))
  .refine((x) => isValidZipCode(x), { message: lt('invalidZip') });

function parseDateOnly(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null;
  try {
    const d = parseISO(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isBeforeOrEqual(a: Date, b: Date): boolean {
  const ad = a.getTime();
  const bd = b.getTime();
  return ad <= bd;
}

/** All wizard fields except `financing_type` (discriminator added per branch). */
export const purchaseAgreementFieldsWithoutFinancing = z.object({
  linkedPropertyId: nullableUuid,
  linkedSellerOwnerId: nullableUuid,

  effective_date: z.string().min(1, lt('effectiveDateRequired')),
  closing_date: z.string().min(1, lt('closingDateRequired')),
  purchase_price: z.coerce.number().positive(lt('purchasePricePositive')),
  earnest_money_amount: z.coerce.number().min(0, lt('earnestMoneyNonNegative')),
  earnest_money_due_date: z.string().min(1, lt('earnestMoneyDueDateRequired')),
  governing_law_state: z.enum(US_STATES, {
    errorMap: () => ({ message: 'Please select a valid US state' }),
  }),
  deal_status: z
    .enum(['draft', 'active', 'under_contract', 'closed', 'cancelled', 'incomplete'])
    .nullable()
    .optional(),
  buyer_name_2: z.string().nullable(),
  seller_name_2: z.string().nullable(),
  seller_id: nullableUuid,

  property_timezone: z.string().min(1, lt('propertyTimezoneRequired')),
  property_type: z.enum([
    'single_family',
    'condominium',
    'pud',
    'duplex',
    'triplex',
    'fourplex',
    'other',
  ]),
  property_type_other: z.string().nullable(),
  property_street: z.string().min(3, lt('streetMin')),
  property_city: z.string().min(2, lt('cityMin')),
  property_state: usState,
  property_zip: usZip,
  year_built: z.coerce.number().int().min(1600).max(2100).nullable(),
  tax_parcel_info: z.string().nullable(),
  other_description: z.string().nullable(),
  land_included: z.boolean(),
  other_property_info: z.string().nullable(),

  buyer_name: z.string().min(2, lt('buyerNameMin')),
  buyer_mailing_street: z.string().nullable(),
  buyer_mailing_city: z.string().nullable(),
  buyer_mailing_state: z.string().nullable(),
  buyer_mailing_zip: z.string().nullable(),
  buyer_phone: requiredUsPhone,
  buyer_email: optionalEmail,
  buyer_mailing_street_2: z.string().nullable(),
  buyer_mailing_city_2: z.string().nullable(),
  buyer_mailing_state_2: z.string().nullable(),
  buyer_mailing_zip_2: z.string().nullable(),
  buyer_phone_2: optionalUsPhone,
  buyer_email_2: optionalEmail,

  title_type: z
    .enum(['tenancy_in_common', 'joint_tenancy', 'tenancy_by_entirety'])
    .nullable(),

  seller_name: z.string().min(2, lt('sellerNameMin')),
  seller_mailing_street: z.string().nullable(),
  seller_mailing_city: z.string().nullable(),
  seller_mailing_state: z.string().nullable(),
  seller_mailing_zip: z.string().nullable(),
  seller_phone: requiredUsPhone,
  seller_email: optionalEmail,
  seller_phone_2: optionalUsPhone,
  seller_email_2: optionalEmail,

  buyer_agent_name: z.string().nullable(),
  seller_agent_name: z.string().nullable(),

  personal_property_description: z.string().max(2000).nullable(),

  earnest_money_escrow_required: z.boolean(),
  earnest_money_deadline_time: z.string().nullable(),

  all_cash_proof_deadline_date: z.string().nullable(),
  all_cash_proof_deadline_time: z.string().nullable(),

  bank_loan_type: z.enum(['conventional', 'fha', 'va', 'other']).nullable(),
  bank_loan_type_other: z.string().nullable(),
  bank_preapproval_letter_date: z.string().nullable(),
  bank_seller_notification_days: z.coerce.number().int().min(0).nullable(),
  bank_contingent_on_sale: z.boolean(),
  fha_addendum_uploaded: z.boolean(),
  fha_addendum_path: z.string().nullable(),
  va_addendum_uploaded: z.boolean(),
  va_addendum_path: z.string().nullable(),
  /** Wizard-only: user chose a PDF to upload on Generate (not in DB until submit). */
  fha_addendum_pending: z.boolean().optional(),
  va_addendum_pending: z.boolean().optional(),

  seller_financing_loan_amount: z.coerce.number().min(0).nullable(),
  seller_financing_down_payment: z.coerce.number().min(0).nullable(),
  seller_financing_interest_rate: z.coerce.number().min(0).max(100).nullable(),
  seller_financing_term_value: z.coerce.number().int().min(0).nullable(),
  seller_financing_term_unit: z.enum(['months', 'years']).nullable(),
  seller_financing_doc_deadline: z.string().nullable(),
  seller_financing_approval_deadline: z.string().nullable(),

  contingent_on_other_property: z.boolean(),
  contingent_property_address: z.string().nullable(),
  contingent_property_days: z.coerce.number().int().min(0).nullable(),

  closing_costs_responsibility: z.enum(['buyer', 'seller', 'both']),
  closing_time: z.string().nullable(),
  title_company: z.string().nullable(),

  survey_buyer_notification_days: z.coerce.number().int().min(0).nullable(),
  survey_seller_remedy_days: z.coerce.number().int().min(0).nullable(),
  mineral_rights_transferred: z.boolean(),
  title_buyer_review_days: z.coerce.number().int().min(0).nullable(),
  title_seller_remedy_days: z.coerce.number().int().min(0).nullable(),

  inspection_contractor_deadline_date: z.string().nullable(),
  inspection_contractor_deadline_time: z.string().nullable(),
  inspection_disclosures_deadline_date: z.string().nullable(),
  inspection_disclosures_deadline_time: z.string().nullable(),
  inspection_negotiation_days: z.coerce.number().int().min(0).nullable(),

  appraisal_contingency: z.boolean(),
  appraisal_negotiation_days: z.coerce.number().int().min(0).nullable(),

  offer_expiration_date: z.string().nullable(),
  offer_expiration_time: z.string().nullable(),

  earnest_money_return_days: z.coerce
    .number()
    .int()
    .min(0, lt('earnestMoneyReturnDaysMin'))
    .max(365, lt('earnestMoneyReturnDaysMax')),

  lead_paint_disclosure_required: z.boolean(),
  lead_paint_known_hazards: z.boolean().nullable(),
  lead_paint_hazard_description: z.string().nullable(),
  lead_paint_records_available: z.boolean().nullable(),
  lead_paint_pamphlet_delivered: z.boolean(),
  lead_paint_pamphlet_delivery_method: z.enum(['in_person', 'email', 'mail']).nullable(),
  lead_paint_pamphlet_delivery_date: z.string().nullable(),

  custom_addendums: z.array(z.string()).max(5).nullable(),
  additional_terms: z.string().max(2000, lt('additionalTermsMax')).nullable(),

  wizard_completed: z.boolean(),
  pdf_generated_at: z.string().nullable(),
});

export const branchAllCash = purchaseAgreementFieldsWithoutFinancing.extend({
  financing_type: z.literal('all_cash'),
});

export const branchBank = purchaseAgreementFieldsWithoutFinancing.extend({
  financing_type: z.literal('bank_financing'),
});

export const branchSeller = purchaseAgreementFieldsWithoutFinancing.extend({
  financing_type: z.literal('seller_financing'),
});

/** Base shape (discriminated union). Use for per-step `.pick()` in the purchase wizard shell. */
export const purchaseAgreementFormObjectSchema = z.discriminatedUnion('financing_type', [
  branchAllCash,
  branchBank,
  branchSeller,
]);

export const purchaseAgreementFormSchema = purchaseAgreementFormObjectSchema.superRefine((data, ctx) => {
  if (data.property_type === 'other') {
    const o = data.property_type_other?.trim() ?? '';
    if (o.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('propertyTypeOtherRequired'),
        path: ['property_type_other'],
      });
    }
  }

  const buyer2Any =
    (data.buyer_name_2?.trim() ?? '').length > 0 ||
    (data.buyer_phone_2?.trim() ?? '').length > 0 ||
    (data.buyer_email_2?.trim() ?? '').length > 0 ||
    (data.buyer_mailing_street_2?.trim() ?? '').length > 0;
  if (buyer2Any) {
    if ((data.buyer_name_2?.trim() ?? '').length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('buyer2NameRequired'),
        path: ['buyer_name_2'],
      });
    }
    if (data.title_type == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('titleTypeRequiredWithCoBuyer'),
        path: ['title_type'],
      });
    }
    if (!data.buyer_phone_2?.trim() || !isValidPhone(data.buyer_phone_2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('buyer2PhoneRequired'),
        path: ['buyer_phone_2'],
      });
    }
  }

  const eff = parseDateOnly(data.effective_date);
  const emDue = parseDateOnly(data.earnest_money_due_date);
  const insC = parseDateOnly(data.inspection_contractor_deadline_date);
  const insD = parseDateOnly(data.inspection_disclosures_deadline_date);
  const close = parseDateOnly(data.closing_date);
  const offerExp = parseDateOnly(data.offer_expiration_date);

  if (eff && emDue && !isBeforeOrEqual(eff, emDue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('dateOrderEffectiveEarnest'),
      path: ['earnest_money_due_date'],
    });
  }
  if (emDue && insC && !isBeforeOrEqual(emDue, insC)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('dateOrderEarnestInspectionAccess'),
      path: ['inspection_contractor_deadline_date'],
    });
  }
  if (insC && insD && !isBeforeOrEqual(insC, insD)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('dateOrderInspectionAccessDisclosures'),
      path: ['inspection_disclosures_deadline_date'],
    });
  }
  if (insD && close && !isBeforeOrEqual(insD, close)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('dateOrderDisclosuresClosing'),
      path: ['closing_date'],
    });
  }
  if (offerExp && close && !isBeforeOrEqual(offerExp, close)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('offerExpirationBeforeClosing'),
      path: ['offer_expiration_date'],
    });
  }

  if (data.financing_type === 'bank_financing') {
    if (data.bank_loan_type == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('bankLoanTypeRequired'),
        path: ['bank_loan_type'],
      });
    }
    if (data.bank_loan_type === 'other' && !(data.bank_loan_type_other?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('bankLoanTypeOtherRequired'),
        path: ['bank_loan_type_other'],
      });
    }
    if (data.bank_preapproval_letter_date == null || !data.bank_preapproval_letter_date.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('bankPreapprovalDateRequired'),
        path: ['bank_preapproval_letter_date'],
      });
    }
    if (data.bank_seller_notification_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('bankSellerNotificationDaysRequired'),
        path: ['bank_seller_notification_days'],
      });
    }
  }

  if (data.financing_type === 'all_cash') {
    if (data.all_cash_proof_deadline_date == null || !data.all_cash_proof_deadline_date.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('allCashProofDeadlineDateRequired'),
        path: ['all_cash_proof_deadline_date'],
      });
    }
    if (data.all_cash_proof_deadline_time == null || !data.all_cash_proof_deadline_time.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('allCashProofDeadlineTimeRequired'),
        path: ['all_cash_proof_deadline_time'],
      });
    }
  }

  if (data.financing_type === 'seller_financing') {
    if (data.seller_financing_loan_amount == null || data.seller_financing_loan_amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('sellerFinancingLoanAmountRequired'),
        path: ['seller_financing_loan_amount'],
      });
    }
    if (data.seller_financing_interest_rate == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('sellerFinancingRateRequired'),
        path: ['seller_financing_interest_rate'],
      });
    }
    if (data.seller_financing_term_value == null || data.seller_financing_term_value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('sellerFinancingTermRequired'),
        path: ['seller_financing_term_value'],
      });
    }
    if (data.seller_financing_term_unit == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('sellerFinancingTermUnitRequired'),
        path: ['seller_financing_term_unit'],
      });
    }
    if (data.seller_financing_doc_deadline == null || !data.seller_financing_doc_deadline.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('sellerFinancingDocDeadlineRequired'),
        path: ['seller_financing_doc_deadline'],
      });
    }
    if (
      data.seller_financing_approval_deadline == null ||
      !data.seller_financing_approval_deadline.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('sellerFinancingApprovalDeadlineRequired'),
        path: ['seller_financing_approval_deadline'],
      });
    }
  }

  if (data.contingent_on_other_property) {
    if (!(data.contingent_property_address?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('contingentPropertyAddressRequired'),
        path: ['contingent_property_address'],
      });
    }
    if (data.contingent_property_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('contingentPropertyDaysRequired'),
        path: ['contingent_property_days'],
      });
    }
  }

  if (data.bank_contingent_on_sale && data.financing_type === 'bank_financing') {
    if (!(data.contingent_property_address?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('contingentPropertyAddressRequired'),
        path: ['contingent_property_address'],
      });
    }
    if (data.contingent_property_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('contingentPropertyDaysRequired'),
        path: ['contingent_property_days'],
      });
    }
  }

  if (data.appraisal_contingency) {
    if (data.appraisal_negotiation_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('appraisalNegotiationDaysRequired'),
        path: ['appraisal_negotiation_days'],
      });
    }
  }

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
      if (!(data.lead_paint_hazard_description?.trim().length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('leadPaintHazardDescriptionRequired'),
          path: ['lead_paint_hazard_description'],
        });
      }
    }
  }

  if (
    data.financing_type === 'bank_financing' &&
    data.bank_loan_type === 'fha' &&
    !data.fha_addendum_uploaded &&
    !data.fha_addendum_pending
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('fhaAddendumRequired'),
      path: ['fha_addendum_uploaded'],
    });
  }
  if (
    data.financing_type === 'bank_financing' &&
    data.bank_loan_type === 'va' &&
    !data.va_addendum_uploaded &&
    !data.va_addendum_pending
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: lt('vaAddendumRequired'),
      path: ['va_addendum_uploaded'],
    });
  }
});

export type PurchaseAgreementFormValues = z.infer<typeof purchaseAgreementFormSchema>;
