import * as z from 'zod';

export const getPropertySchema = (t: (key: string, options?: any) => string) => {
  return z.object({
    owner_id: z.string().min(1, t('validations.ownerRequired')),
    address: z.string().min(1, t('validations.addressRequired')),
    city: z.string().optional(),
    district: z.string().optional(),
    status: z.enum(['Empty', 'Occupied', 'Inactive']),
    rent_amount: z.number().positive().optional().nullable(),
    currency: z.enum(['USD', 'TRY']).optional().nullable(),
    notes: z.string().optional(),
    listing_url: z.union([
      z.string().url(t('validations.invalidUrl')),
      z.literal(''),
    ]).optional().nullable(),
  });
};
