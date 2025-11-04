import * as z from 'zod';

export const getInquirySchema = (t: (key: string, options?: any) => string) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z.string().min(1, t('validations.phoneRequired')),
    email: z.string().email(t('validations.invalidEmail')).optional().or(z.literal('')),
    preferred_city: z.string().optional(),
    preferred_district: z.string().optional(),
    min_budget: z.number().positive().optional().nullable(),
    max_budget: z.number().positive().optional().nullable(),
    notes: z.string().optional(),
  });
};
