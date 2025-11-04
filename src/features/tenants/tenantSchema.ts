import * as z from 'zod';

export const getTenantSchema = (t: (key: string, options?: any) => string) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z.string().optional(),
    email: z.string().email(t('validations.invalidEmail')).optional().or(z.literal('')),
    property_id: z.string().optional(),
    notes: z.string().optional(),
  });
};
