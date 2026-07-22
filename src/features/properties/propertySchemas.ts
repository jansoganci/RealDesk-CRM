import * as z from 'zod';
import { US_STATE_CODES } from '@/features/leads/schemas/lead-form';

const usStateSchema = (
  t: (key: string, options?: Record<string, unknown>) => string,
) =>
  z
    .string()
    .length(2, t('validations.invalidState'))
    .transform((s) => s.toUpperCase())
    .refine((code) => (US_STATE_CODES as readonly string[]).includes(code), {
      message: t('validations.invalidState'),
    });

// Base property schema (common fields for both rental and sale)
const basePropertySchema = (t: (key: string, options?: Record<string, unknown>) => string) =>
  z.object({
    owner_id: z.string().min(1, t('validations.ownerRequired')),
    street_address: z.string().min(1, t('validations.addressRequired')),
    city: z.string().min(1, t('validations.cityRequired')),
    state: usStateSchema(t),
    zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, t('validations.invalidZip')),
    mls_id: z.string().optional(),
    year_built: z.preprocess((val) => {
      if (val === '' || val === undefined || val === null) return undefined;
      if (typeof val === 'number' && Number.isNaN(val)) return undefined;
      return val;
    }, z.number().int().min(1600).max(new Date().getFullYear() + 1).optional()),
    notes: z.string().optional(),
    listing_url: z
      .union([z.string().url(t('validations.invalidUrl')), z.literal('')])
      .optional()
      .nullable(),
  });

// Rental property schema
export const getRentalPropertySchema = (
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  return basePropertySchema(t).extend({
    property_type: z.literal('rental'),
    status: z.enum(['Empty', 'Occupied', 'Inactive']),
    rent_amount: z.number().positive(t('validations.rentAmountPositive')),
    currency: z.literal('USD').default('USD'),
  });
};

// Sale property schema
export const getSalePropertySchema = (
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  return basePropertySchema(t).extend({
    property_type: z.literal('sale'),
    status: z.enum(['Available', 'Under Offer', 'Sold', 'Inactive']),
    sale_price: z.number().positive(t('validations.salePricePositive')),
    currency: z.literal('USD').default('USD'),
    buyer_name: z.string().optional(),
    buyer_phone: z.string().optional(),
    buyer_email: z
      .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
      .optional()
      .nullable(),
    offer_amount: z.number().positive().optional().nullable(),
  });
};

// Combined property schema (for backward compatibility)
export const getPropertySchema = (t: (key: string, options?: Record<string, unknown>) => string) => {
  return basePropertySchema(t).extend({
    property_type: z.enum(['rental', 'sale']).default('rental'),
    status: z.enum(['Empty', 'Occupied', 'Inactive', 'Available', 'Under Offer', 'Sold']),
    // Rental fields
    rent_amount: z.number().positive().optional().nullable(),
    // Sale fields
    sale_price: z.number().positive().optional().nullable(),
    currency: z.literal('USD').default('USD').optional(),
    buyer_name: z.string().optional(),
    buyer_phone: z.string().optional(),
    buyer_email: z
      .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
      .optional()
      .nullable(),
    offer_amount: z.number().positive().optional().nullable(),
  });
};
