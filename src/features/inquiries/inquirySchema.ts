/**
 * @deprecated Prefer @/features/leads/schemas/lead-form for new work.
 * Kept for InquiryDialog and lead list actions.
 */
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { isValidPhone } from '@/services/phone.service';
import { leadSourceSchema, US_STATE_CODES } from '@/features/leads/schemas/lead-form';

export { LEAD_SOURCE_OPTIONS } from '@/features/leads/schemas/lead-form';

const preferredOptionalStateSchema = (t: TFunction) =>
  z
    .preprocess(
      (v) =>
        typeof v !== 'string' || v.trim() === '' ? undefined : v.trim().toUpperCase(),
      z
        .string()
        .length(2, t('validations.invalidState'))
        .refine((code) => (US_STATE_CODES as readonly string[]).includes(code), {
          message: t('validations.invalidState'),
        })
        .optional(),
    );

const inquiryFields = (t: TFunction) => ({
  name: z.string().min(1, t('validations.nameRequired')),
  phone: z
    .string()
    .min(1, t('validations.phoneRequired'))
    .refine(isValidPhone, {
      message: t('validations.invalidPhone'),
    }),
  email: z
    .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
    .optional()
    .nullable(),
  preferred_state: preferredOptionalStateSchema(t),
  preferred_city: z.string().optional(),
  lead_source: leadSourceSchema,
  pre_approved: z.boolean().default(false),
  inquiry_type: z.enum(['rental', 'sale']),
  min_rent_budget: z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
    z.number().positive(t('validations.minBudget')).optional().nullable(),
  ),
  max_rent_budget: z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
    z.number().positive(t('validations.maxBudget')).optional().nullable(),
  ),
  min_sale_budget: z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
    z.number().positive(t('validations.minBudget')).optional().nullable(),
  ),
  max_sale_budget: z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? undefined : v),
    z.number().positive(t('validations.maxBudget')).optional().nullable(),
  ),
  notes: z.string().optional(),
});

/** Used by InquiryDialog — branch UI on `inquiry_type`. */
export const getInquirySchema = (t: TFunction) =>
  z.object(inquiryFields(t)).superRefine((data, ctx) => {
    if (
      data.inquiry_type === 'rental' &&
      data.min_rent_budget != null &&
      data.max_rent_budget != null &&
      data.min_rent_budget > data.max_rent_budget
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('validations.budgetRange'),
        path: ['max_rent_budget'],
      });
    }
    if (
      data.inquiry_type === 'sale' &&
      data.min_sale_budget != null &&
      data.max_sale_budget != null &&
      data.min_sale_budget > data.max_sale_budget
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('validations.budgetRange'),
        path: ['max_sale_budget'],
      });
    }
  });

export type InquiryDialogFormValues = z.infer<ReturnType<typeof getInquirySchema>>;

export type InquirySubmitPayload = InquiryDialogFormValues & {
  preferred_district?: string | null;
};
