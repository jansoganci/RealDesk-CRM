import * as z from 'zod';

export const getTenantSchema = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t('tenants.validations.nameRequired')),
    phone: z.string().optional(),
    email: z.string().email(t('tenants.validations.invalidEmail')).optional().or(z.literal('')),
    property_id: z.string().optional(),
    notes: z.string().optional(),
  });
};
