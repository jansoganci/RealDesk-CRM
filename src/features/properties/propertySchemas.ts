import * as z from 'zod';

// Base property schema (common fields for both rental and sale)
const basePropertySchema = (t: (key: string, options?: any) => string) =>
  z.object({
    owner_id: z.string().min(1, t('validations.ownerRequired')),
    address: z.string().min(1, t('validations.addressRequired')),
    city: z.string().optional(),
    district: z.string().optional(),
    notes: z.string().optional(),
    listing_url: z
      .union([z.string().url(t('validations.invalidUrl')), z.literal('')])
      .optional()
      .nullable(),
  });

// Rental property schema
export const getRentalPropertySchema = (t: (key: string, options?: any) => string) => {
  return basePropertySchema(t).extend({
    property_type: z.literal('rental'),
    status: z.enum(['Empty', 'Occupied', 'Inactive']),
    rent_amount: z.number().positive(t('validations.rentAmountPositive')),
    currency: z.enum(['USD', 'TRY']),
  });
};

// Sale property schema
export const getSalePropertySchema = (t: (key: string, options?: any) => string) => {
  return basePropertySchema(t).extend({
    property_type: z.literal('sale'),
    status: z.enum(['Available', 'Under Offer', 'Sold', 'Inactive']),
    sale_price: z.number().positive(t('validations.salePricePositive')),
    currency: z.enum(['USD', 'TRY']),
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
export const getPropertySchema = (t: (key: string, options?: any) => string) => {
  return basePropertySchema(t).extend({
    property_type: z.enum(['rental', 'sale']).default('rental'),
    status: z.enum(['Empty', 'Occupied', 'Inactive', 'Available', 'Under Offer', 'Sold']),
    // Rental fields
    rent_amount: z.number().positive().optional().nullable(),
    // Sale fields
    sale_price: z.number().positive().optional().nullable(),
    currency: z.enum(['USD', 'TRY']).optional().nullable(),
    buyer_name: z.string().optional(),
    buyer_phone: z.string().optional(),
    buyer_email: z
      .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
      .optional()
      .nullable(),
    offer_amount: z.number().positive().optional().nullable(),
  });
};

// Rental inquiry schema
export const getRentalInquirySchema = (t: (key: string, options?: any) => string) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z.string().min(1, t('validations.phoneRequired')),
    email: z
      .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
      .optional()
      .nullable(),
    preferred_city: z.string().optional(),
    preferred_district: z.string().optional(),
    min_rent_budget: z.number().positive().optional().nullable(),
    max_rent_budget: z.number().positive().optional().nullable(),
    inquiry_type: z.literal('rental'),
    notes: z.string().optional(),
  });
};

// Sale inquiry schema
export const getSaleInquirySchema = (t: (key: string, options?: any) => string) => {
  return z.object({
    name: z.string().min(1, t('validations.nameRequired')),
    phone: z.string().min(1, t('validations.phoneRequired')),
    email: z
      .union([z.string().email(t('validations.invalidEmail')), z.literal('')])
      .optional()
      .nullable(),
    preferred_city: z.string().optional(),
    preferred_district: z.string().optional(),
    min_sale_budget: z.number().positive().optional().nullable(),
    max_sale_budget: z.number().positive().optional().nullable(),
    inquiry_type: z.literal('sale'),
    notes: z.string().optional(),
  });
};
