import { z } from 'zod';

export const commissionSheetSchema = z.object({
  sale_price: z.number().min(0).nullable(),
  commission_type: z.enum(['percentage', 'flat_fee']),
  commission_rate: z.number().min(0).max(100).nullable(),
  flat_fee_amount: z.number().min(0).nullable(),
  commission_side: z.enum(['listing', 'buyer', 'dual', 'rental_listing', 'rental_tenant']),
  referral_enabled: z.boolean(),
  referral_pct: z.number().min(0).max(100).nullable(),
  referral_to: z.string().trim().nullable(),
  tc_fee: z.number().min(0).nullable(),
  other_fees: z.number().min(0).nullable(),
  closing_date: z.string().min(1),
  override_broker_settings: z.boolean(),
})
  .superRefine((value, ctx) => {
    if (value.commission_type === 'percentage' && (value.commission_rate == null || value.commission_rate <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['commission_rate'],
        message: 'Commission rate is required.',
      });
    }

    if (value.commission_type === 'flat_fee' && (value.flat_fee_amount == null || value.flat_fee_amount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['flat_fee_amount'],
        message: 'Flat fee amount is required.',
      });
    }

    if (value.referral_enabled && (value.referral_pct == null || value.referral_pct <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referral_pct'],
        message: 'Referral fee percent is required.',
      });
    }

    const closeDate = new Date(`${value.closing_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (closeDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closing_date'],
        message: 'Closing date cannot be in the future.',
      });
    }
  });

export type CommissionSheetFormValues = z.infer<typeof commissionSheetSchema>;
