import * as z from 'zod';

export const getOwnerSchema = (t: (key: string, options?: any) => string) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    email: z.string().email(t('validations.invalidEmail')),
    phone: z.string().min(1, t('validations.phoneRequired')),
    address: z.string().optional(),
    notes: z.string().optional(),
  });
};
