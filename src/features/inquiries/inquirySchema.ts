/**
 * @deprecated Use schemas from @/features/leads/schemas/lead-form instead.
 * Kept for backward compatibility with existing InquiryDialog component.
 */
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { isValidPhone } from '@/services/phone.service';

// Base inquiry schema (common fields for both rental and sale)
const baseInquirySchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z
      .string()
      .min(1, t('validations.phoneRequired'))
      .refine(isValidPhone, {
        message: t('validations.invalidPhone', 'Invalid US phone number'),
      }),
    email: z
      .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
      .optional()
      .nullable(),
    preferred_city: z.string().optional(),
    preferred_district: z.string().optional(),
    notes: z.string().optional(),
  });

// Rental inquiry schema
export const getRentalInquirySchema = (t: TFunction) => {
  return baseInquirySchema(t).extend({
    inquiry_type: z.literal('rental'),
    min_rent_budget: z.number().positive().optional().nullable(),
    max_rent_budget: z.number().positive().optional().nullable(),
  });
};

// Sale inquiry schema
export const getSaleInquirySchema = (t: TFunction) => {
  return baseInquirySchema(t).extend({
    inquiry_type: z.literal('sale'),
    min_sale_budget: z.number().positive().optional().nullable(),
    max_sale_budget: z.number().positive().optional().nullable(),
  });
};

// Combined inquiry schema (for backward compatibility with type inference)
// Use getRentalInquirySchema or getSaleInquirySchema for actual form validation
export const getInquirySchema = (t: TFunction) => {
  return baseInquirySchema(t).extend({
    inquiry_type: z.enum(['rental', 'sale']).default('rental'),
    // Rental budget fields
    min_rent_budget: z.number().positive().optional().nullable(),
    max_rent_budget: z.number().positive().optional().nullable(),
    // Sale budget fields
    min_sale_budget: z.number().positive().optional().nullable(),
    max_sale_budget: z.number().positive().optional().nullable(),
  });
};
