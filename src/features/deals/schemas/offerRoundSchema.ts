import { z } from 'zod';
import { contingencyFormArraySchema } from './contingencySchema';

export const offerRoundStatusSchema = z.enum([
  'draft',
  'submitted',
  'verbal_accepted',
  'mutual_acceptance',
  'rejected',
  'expired',
  'withdrawn',
]);

export const offeredBySchema = z.enum(['buyer', 'seller']);

export const financingTypeSchema = z.enum([
  'cash',
  'conventional',
  'fha',
  'va',
  'usda',
  'seller_financing',
  'other',
]);

/** "HH:MM AM/PM" style (flexible spacing/case) */
const expirationTimeSchema = z
  .union([
    z.literal(''),
    z.string().regex(/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/, 'Use time like 5:00 PM'),
  ])
  .optional()
  .nullable();

const optionalDateInput = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.string().min(8, 'Enter a valid date').optional().nullable()
);

function parseLocalDate(d: string): Date {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? new Date(NaN) : x;
}

const offerRoundObjectSchema = z.object({
  round_number: z.coerce.number().int().min(1).max(500),
  offered_by: offeredBySchema,
  parent_round_id: z.string().uuid().optional().nullable(),
  status: offerRoundStatusSchema,
  offer_price: z.coerce.number().positive('Offer price must be greater than zero'),
  emd_amount: z.coerce.number().min(0).optional().nullable(),
  closing_date: optionalDateInput,
  possession_date: optionalDateInput,
  seller_credits: z.coerce.number().min(0).optional().nullable(),
  appraisal_gap_coverage: z.coerce.number().min(0).optional().nullable(),
  personal_property_notes: z.string().max(5000).optional().nullable(),
  financing_type: financingTypeSchema.optional().nullable(),
  expiration_date: optionalDateInput,
  expiration_time: expirationTimeSchema,
  notes: z.string().max(5000).optional().nullable(),
  submitted_at: z.string().optional().nullable(),
  mutual_acceptance_at: z.string().optional().nullable(),
  contingencies: contingencyFormArraySchema.optional(),
});

/**
 * Create/edit a draft or in-progress offer round (UI: Offer tab, Add Counter-Offer sheet).
 */
export const offerRoundFormSchema = offerRoundObjectSchema
  .refine(
    (data) => {
      const c = data.closing_date ? parseLocalDate(data.closing_date) : null;
      const p = data.possession_date ? parseLocalDate(data.possession_date) : null;
      if (c && p && !Number.isNaN(c.getTime()) && !Number.isNaN(p.getTime())) {
        return p >= c;
      }
      return true;
    },
    { message: 'Possession date cannot be before closing date', path: ['possession_date'] }
  )
  .refine(
    (data) => {
      if (data.status !== 'draft' && data.status !== 'submitted') return true;
      if (!data.expiration_date) return true;
      const exp = parseLocalDate(data.expiration_date);
      if (Number.isNaN(exp.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      exp.setHours(0, 0, 0, 0);
      return exp >= today;
    },
    { message: 'Expiration date must be today or in the future', path: ['expiration_date'] }
  );

export type OfferRoundFormData = z.infer<typeof offerRoundObjectSchema>;

/**
 * Stricter validation when moving from draft → submitted.
 */
export const submitOfferRoundSchema = offerRoundObjectSchema
  .extend({
    status: z.literal('submitted'),
  })
  .refine(
    (data) => {
      const c = data.closing_date ? parseLocalDate(data.closing_date) : null;
      const p = data.possession_date ? parseLocalDate(data.possession_date) : null;
      if (c && p && !Number.isNaN(c.getTime()) && !Number.isNaN(p.getTime())) {
        return p >= c;
      }
      return true;
    },
    { message: 'Possession date cannot be before closing date', path: ['possession_date'] }
  )
  .refine(
    (data) => {
      if (!data.expiration_date || data.expiration_date.length === 0) return false;
      const exp = parseLocalDate(data.expiration_date);
      if (Number.isNaN(exp.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      exp.setHours(0, 0, 0, 0);
      return exp >= today;
    },
    { message: 'Expiration date must be today or in the future', path: ['expiration_date'] }
  )
  .refine(
    (data) => data.expiration_time != null && String(data.expiration_time).trim().length > 0,
    { message: 'Set an expiration time before submitting', path: ['expiration_time'] }
  );

export type SubmitOfferRoundData = z.infer<typeof submitOfferRoundSchema>;
