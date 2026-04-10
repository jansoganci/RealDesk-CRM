import { z } from 'zod';

export const brokerSettingsSchema = z
  .object({
    broker_model: z.enum(['split_with_cap', 'traditional_split', 'flat_fee_100pct']),
    broker_split_pct: z.number().min(0).max(100),
    annual_cap_amount: z.number().nullable(),
    cap_anniversary_date: z.string().nullable(),
    franchise_fee_enabled: z.boolean(),
    franchise_fee_pct: z.number().nullable(),
    franchise_fee_cap: z.number().nullable(),
    default_transaction_fee: z.number().min(0),
    eo_fee_type: z.enum(['per_deal', 'monthly', 'annual_excluded']),
    eo_fee_amount: z.number().min(0),
    default_tc_fee: z.number().min(0),
    default_rental_commission_type: z.enum(['one_month', 'annual_pct', 'flat_fee']),
    default_rental_commission_rate: z.number().nullable(),
    default_rental_flat_fee: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.broker_model === 'split_with_cap' && (!data.annual_cap_amount || data.annual_cap_amount <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['annual_cap_amount'],
        message: 'Annual cap amount is required for split-with-cap model.',
      });
    }

    if (data.default_rental_commission_type === 'annual_pct' && (!data.default_rental_commission_rate || data.default_rental_commission_rate <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['default_rental_commission_rate'],
        message: 'Rental annual percentage rate is required.',
      });
    }

    if (data.default_rental_commission_type === 'flat_fee' && (!data.default_rental_flat_fee || data.default_rental_flat_fee <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['default_rental_flat_fee'],
        message: 'Rental flat fee is required.',
      });
    }
  });

export type BrokerSettingsFormValues = z.infer<typeof brokerSettingsSchema>;
