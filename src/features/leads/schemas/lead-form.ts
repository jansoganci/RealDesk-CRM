/**
 * Lead Form Validation Schema
 * Zod schema for lead creation and update with US market validation
 */

import { z } from 'zod';
import { isValidPhone, formatPhoneForDisplay } from '@/services/phone.service';

// ============================================================================
// Lead Source Enum & Options
// ============================================================================

export const leadSourceSchema = z.enum([
  'zillow',
  'realtor_com',
  'referral',
  'sign_call',
  'social_media',
  'cold_call',
  'open_house',
  'other',
]).optional();

export const LEAD_SOURCE_OPTIONS = [
  { value: 'zillow', label: 'Zillow' },
  { value: 'realtor_com', label: 'Realtor.com' },
  { value: 'referral', label: 'Referral' },
  { value: 'sign_call', label: 'Sign Call' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'open_house', label: 'Open House' },
  { value: 'other', label: 'Other' },
] as const;

// ============================================================================
// Lead Status Enum & Options
// ============================================================================

export const leadStatusSchema = z.enum([
  'new',
  'contacted',
  'qualified',
  'active',
  'matched',
  'under_contract',
  'closed_won',
  'closed_lost',
  'converted',
]);

export const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'active', label: 'Active' },
  { value: 'matched', label: 'Matched' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'converted', label: 'Converted' },
] as const;

// ============================================================================
// US States
// ============================================================================

export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington D.C.' },
] as const;

const US_STATE_CODES = US_STATES.map((s) => s.value);

// ============================================================================
// Create Lead Schema
// ============================================================================

export const createLeadSchema = z
  .object({
    // Required fields
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),

    phone: z
      .string()
      .min(1, 'Phone is required')
      .refine(isValidPhone, {
        message: 'Please enter a valid US phone number (e.g., (512) 555-1234). Exchange cannot start with 0 or 1.',
      })
      .transform(formatPhoneForDisplay), // Auto-format to (555) 123-4567

    inquiry_type: z.enum(['rental', 'sale'], {
      required_error: 'Please select rental or sale',
    }),

    // Optional fields
    email: z.string().email('Invalid email address').optional().or(z.literal('')),

    lead_source: leadSourceSchema,

    preferred_city: z
      .string()
      .max(100, 'City must be less than 100 characters')
      .optional()
      .or(z.literal('')),

    preferred_state: z
      .string()
      .length(2, 'State code must be 2 characters')
      .toUpperCase()
      .refine((val) => !val || US_STATE_CODES.includes(val as any), {
        message: 'Please select a valid US state',
      })
      .optional()
      .or(z.literal('')),

    pre_approved: z.boolean().default(false),

    // Budget fields - conditional on inquiry_type
    min_rent_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    max_rent_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    min_sale_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    max_sale_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Validate min <= max for rental
      if (data.min_rent_budget && data.max_rent_budget) {
        return data.min_rent_budget <= data.max_rent_budget;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot exceed maximum budget',
      path: ['max_rent_budget'],
    }
  )
  .refine(
    (data) => {
      // Validate min <= max for sale
      if (data.min_sale_budget && data.max_sale_budget) {
        return data.min_sale_budget <= data.max_sale_budget;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot exceed maximum budget',
      path: ['max_sale_budget'],
    }
  );

// ============================================================================
// Update Lead Schema (allows status change)
// ============================================================================

const baseUpdateLeadSchema = z
  .object({
    // Required fields
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters'),

    phone: z
      .string()
      .min(1, 'Phone is required')
      .refine(isValidPhone, {
        message: 'Please enter a valid US phone number (e.g., (512) 555-1234). Exchange cannot start with 0 or 1.',
      })
      .transform(formatPhoneForDisplay),

    inquiry_type: z.enum(['rental', 'sale'], {
      required_error: 'Please select rental or sale',
    }),

    // Optional fields
    email: z.string().email('Invalid email address').optional().or(z.literal('')),

    lead_source: leadSourceSchema,

    preferred_city: z
      .string()
      .max(100, 'City must be less than 100 characters')
      .optional()
      .or(z.literal('')),

    preferred_state: z
      .string()
      .length(2, 'State code must be 2 characters')
      .toUpperCase()
      .refine((val) => !val || US_STATE_CODES.includes(val as any), {
        message: 'Please select a valid US state',
      })
      .optional()
      .or(z.literal('')),

    pre_approved: z.boolean().default(false),

    min_rent_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    max_rent_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    min_sale_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    max_sale_budget: z.coerce
      .number()
      .positive('Budget must be positive')
      .optional()
      .nullable(),

    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .or(z.literal('')),

    // Status field (only for updates)
    status: leadStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.min_rent_budget && data.max_rent_budget) {
        return data.min_rent_budget <= data.max_rent_budget;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot exceed maximum budget',
      path: ['max_rent_budget'],
    }
  )
  .refine(
    (data) => {
      if (data.min_sale_budget && data.max_sale_budget) {
        return data.min_sale_budget <= data.max_sale_budget;
      }
      return true;
    },
    {
      message: 'Minimum budget cannot exceed maximum budget',
      path: ['max_sale_budget'],
    }
  );

export const updateLeadSchema = baseUpdateLeadSchema;

// ============================================================================
// Type Exports
// ============================================================================

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
export type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;
