import { z } from 'zod';
import { financingTypeSchema, offeredBySchema } from './offerRoundSchema';

const emptyToUndef = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : v;

const optionalNonNegMoney = z.preprocess(
  emptyToUndef,
  z.coerce.number().min(0).optional().nullable()
);

const optionalDateStr = z.preprocess(
  emptyToUndef,
  z.string().min(8).optional().nullable()
);

/**
 * Create first offer or counter-offer from the deal detail sheet (T13).
 * Maps to `CreateFirstOfferInput` / `AddCounterOfferInput`.
 */
export const firstOfferFormSchema = z.object({
  offer_price: z.coerce.number().positive('Enter a valid offer price'),
  offered_by: offeredBySchema,
  emd_amount: optionalNonNegMoney,
  closing_date: optionalDateStr,
  possession_date: optionalDateStr,
  seller_credits: optionalNonNegMoney,
  appraisal_gap_coverage: optionalNonNegMoney,
  personal_property_notes: z.string().max(5000).optional().nullable(),
  financing_type: financingTypeSchema.optional().nullable(),
  expiration_date: optionalDateStr,
  expiration_time: z.union([z.literal(''), z.string()]).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type FirstOfferFormData = z.infer<typeof firstOfferFormSchema>;
