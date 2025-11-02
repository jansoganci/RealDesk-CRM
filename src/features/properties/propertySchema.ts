import * as z from 'zod';

export const getPropertySchema = (t: (key: string) => string) => {
  return z.object({
    owner_id: z.string().min(1, t('properties.validations.ownerRequired')),
    address: z.string().min(1, t('properties.validations.addressRequired')),
    city: z.string().optional(),
    district: z.string().optional(),
    status: z.enum(['Empty', 'Occupied', 'Inactive']),
    notes: z.string().optional(),
  });
};
