/**
 * Per-step Zod schemas for the purchase wizard (Sprint 6B T7).
 * Step 9 uses the full `purchaseAgreementFormSchema` (including cross-field dates).
 */

import { z } from 'zod';

import {
  branchAllCash,
  branchBank,
  branchSeller,
  purchaseAgreementFieldsWithoutFinancing,
  purchaseAgreementFormSchema,
} from '@/features/contracts/schemas/purchaseAgreementForm.schema';
import { isValidPhone } from '@/lib/serviceProxy';
import i18n from '@/i18n';

const lt = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`contracts:validation.purchaseAgreement.${key}`, options);

const financingDiscriminator = z.object({
  financing_type: z.enum(['all_cash', 'bank_financing', 'seller_financing']),
});

const step1 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    linkedPropertyId: true,
    property_timezone: true,
    property_type: true,
    property_type_other: true,
    property_street: true,
    property_city: true,
    property_state: true,
    property_zip: true,
    year_built: true,
    tax_parcel_info: true,
    other_description: true,
    land_included: true,
    other_property_info: true,
  })
  .merge(financingDiscriminator)
  .superRefine((data, ctx) => {
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
  });

const step2 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    buyer_name: true,
    buyer_mailing_street: true,
    buyer_mailing_city: true,
    buyer_mailing_state: true,
    buyer_mailing_zip: true,
    buyer_phone: true,
    buyer_email: true,
    buyer_name_2: true,
    buyer_mailing_street_2: true,
    buyer_mailing_city_2: true,
    buyer_mailing_state_2: true,
    buyer_mailing_zip_2: true,
    buyer_phone_2: true,
    buyer_email_2: true,
    title_type: true,
    seller_name: true,
    seller_mailing_street: true,
    seller_mailing_city: true,
    seller_mailing_state: true,
    seller_mailing_zip: true,
    seller_phone: true,
    seller_email: true,
    seller_name_2: true,
    seller_phone_2: true,
    seller_email_2: true,
    linkedSellerOwnerId: true,
    seller_id: true,
    effective_date: true,
    buyer_agent_name: true,
    seller_agent_name: true,
  })
  .merge(financingDiscriminator)
  .superRefine((data, ctx) => {
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
  });

const step3 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    personal_property_description: true,
  })
  .merge(financingDiscriminator);

const step4 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    earnest_money_amount: true,
    earnest_money_due_date: true,
    earnest_money_escrow_required: true,
    earnest_money_deadline_time: true,
  })
  .merge(financingDiscriminator);

const step5 = z.union([
  branchAllCash
    .pick({
      financing_type: true,
      purchase_price: true,
      all_cash_proof_deadline_date: true,
      all_cash_proof_deadline_time: true,
      bank_contingent_on_sale: true,
      contingent_on_other_property: true,
      contingent_property_address: true,
      contingent_property_days: true,
      bank_loan_type: true,
      bank_loan_type_other: true,
      bank_preapproval_letter_date: true,
      bank_seller_notification_days: true,
      fha_addendum_uploaded: true,
      fha_addendum_path: true,
      va_addendum_uploaded: true,
      va_addendum_path: true,
      seller_financing_loan_amount: true,
      seller_financing_down_payment: true,
      seller_financing_interest_rate: true,
      seller_financing_term_value: true,
      seller_financing_term_unit: true,
      seller_financing_doc_deadline: true,
      seller_financing_approval_deadline: true,
    })
    .superRefine((data, ctx) => {
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
      if (data.bank_contingent_on_sale) {
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
    }),
  branchBank
    .pick({
      financing_type: true,
      purchase_price: true,
      all_cash_proof_deadline_date: true,
      all_cash_proof_deadline_time: true,
      bank_loan_type: true,
      bank_loan_type_other: true,
      bank_preapproval_letter_date: true,
      bank_seller_notification_days: true,
      bank_contingent_on_sale: true,
      fha_addendum_uploaded: true,
      fha_addendum_path: true,
      va_addendum_uploaded: true,
      va_addendum_path: true,
      contingent_on_other_property: true,
      contingent_property_address: true,
      contingent_property_days: true,
      seller_financing_loan_amount: true,
      seller_financing_down_payment: true,
      seller_financing_interest_rate: true,
      seller_financing_term_value: true,
      seller_financing_term_unit: true,
      seller_financing_doc_deadline: true,
      seller_financing_approval_deadline: true,
    })
    .superRefine((data, ctx) => {
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
      if (data.bank_contingent_on_sale) {
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
      // FHA/VA addendum uploads happen in Step 9 — do not block Step 5 Next here.
      // Full form + save/PDF still enforce via `purchaseAgreementFormSchema.superRefine`.
    }),
  branchSeller
    .pick({
      financing_type: true,
      purchase_price: true,
      all_cash_proof_deadline_date: true,
      all_cash_proof_deadline_time: true,
      bank_loan_type: true,
      bank_loan_type_other: true,
      bank_preapproval_letter_date: true,
      bank_seller_notification_days: true,
      bank_contingent_on_sale: true,
      contingent_on_other_property: true,
      contingent_property_address: true,
      contingent_property_days: true,
      seller_financing_loan_amount: true,
      seller_financing_down_payment: true,
      seller_financing_interest_rate: true,
      seller_financing_term_value: true,
      seller_financing_term_unit: true,
      seller_financing_doc_deadline: true,
      seller_financing_approval_deadline: true,
      fha_addendum_uploaded: true,
      fha_addendum_path: true,
      va_addendum_uploaded: true,
      va_addendum_path: true,
    })
    .superRefine((data, ctx) => {
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
      if (data.seller_financing_approval_deadline == null || !data.seller_financing_approval_deadline.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: lt('sellerFinancingApprovalDeadlineRequired'),
          path: ['seller_financing_approval_deadline'],
        });
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
    }),
]);

const step6 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    closing_date: true,
    closing_costs_responsibility: true,
    closing_time: true,
    title_company: true,
  })
  .merge(financingDiscriminator);

const step7 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    survey_buyer_notification_days: true,
    survey_seller_remedy_days: true,
    mineral_rights_transferred: true,
    title_buyer_review_days: true,
    title_seller_remedy_days: true,
    inspection_contractor_deadline_date: true,
    inspection_contractor_deadline_time: true,
    inspection_disclosures_deadline_date: true,
    inspection_disclosures_deadline_time: true,
    inspection_negotiation_days: true,
    appraisal_contingency: true,
    appraisal_negotiation_days: true,
  })
  .merge(financingDiscriminator)
  .superRefine((data, ctx) => {
    if (data.appraisal_contingency && data.appraisal_negotiation_days == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('appraisalNegotiationDaysRequired'),
        path: ['appraisal_negotiation_days'],
      });
    }
  });

const step8 = purchaseAgreementFieldsWithoutFinancing
  .pick({
    offer_expiration_date: true,
    offer_expiration_time: true,
    governing_law_state: true,
    earnest_money_return_days: true,
  })
  .merge(financingDiscriminator);

const step9 = purchaseAgreementFormSchema;

/** 1-based step index → schema (steps 1–9). */
export const PURCHASE_WIZARD_STEP_SCHEMAS: Record<number, z.ZodTypeAny> = {
  1: step1,
  2: step2,
  3: step3,
  4: step4,
  5: step5,
  6: step6,
  7: step7,
  8: step8,
  9: step9,
};

export const PURCHASE_WIZARD_TOTAL_STEPS = 9;
