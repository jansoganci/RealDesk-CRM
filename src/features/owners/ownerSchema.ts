import * as z from 'zod';

export const getOwnerSchema = (t: (key: string) => string) => {
  return z.object({
    name: z.string().min(1, t('owners.validations.nameRequired')),
    email: z.string().email(t('owners.validations.invalidEmail')),
    phone: z.string().min(1, t('owners.validations.phoneRequired')),
    address: z.string().optional(),
    notes: z.string().optional(),
  });
};
