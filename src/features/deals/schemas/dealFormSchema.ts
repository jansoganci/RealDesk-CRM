import { z } from 'zod';

export const dealTypeSchema = z.enum(['sale', 'rental']);

export const clientRoleSchema = z.enum(['buyer', 'seller', 'dual']);

export const dealStageSchema = z.enum([
  'offer_prep',
  'submitted',
  'negotiating',
  'verbal_accepted',
  'mutual_acceptance',
  'under_contract',
  'pending',
  'closing_scheduled',
  'closed_won',
  'fell_through',
]);

export const dealFinancingTypeSchema = z.enum([
  'cash',
  'conventional',
  'fha',
  'va',
  'usda',
  'seller_financing',
  'other',
]);

export const preapprovalStatusSchema = z.enum(['not_started', 'in_progress', 'approved', 'denied']);

/** Snapshot when property is entered manually (no `property_id`) */
export const propertySnapshotSchema = z
  .object({
    street_address: z.string().max(500).optional(),
    city: z.string().max(200).optional(),
    state: z.string().length(2).toUpperCase().optional(),
    zip_code: z.string().max(20).optional(),
    mls_id: z.string().max(50).optional(),
    list_price: z.number().positive().optional(),
  })
  .optional()
  .nullable();

function parseLocalDate(d: string): Date {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? new Date(NaN) : x;
}

const emptyToUndef = (v: unknown) =>
  v === '' || v === null || v === undefined ? undefined : v;

const optionalPositiveMoney = z.preprocess(
  emptyToUndef,
  z.coerce.number().positive().optional().nullable()
);

const optionalNonNegativeMoney = z.preprocess(
  emptyToUndef,
  z.coerce.number().min(0).optional().nullable()
);

const dealFormObjectSchema = z.object({
  deal_name: z.string().min(1, 'Deal name is required').max(300),
  deal_type: dealTypeSchema.default('sale'),
  client_role: clientRoleSchema,
  deal_stage: dealStageSchema.optional(),
  /** Earning agent of record (org member user id). */
  user_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  property_snapshot: propertySnapshotSchema,
  financing_type: dealFinancingTypeSchema.optional().nullable(),
  preapproval_status: preapprovalStatusSchema.optional().nullable(),
  buyer_agent_agreement_id: z.string().uuid().optional().nullable(),
  list_price: optionalPositiveMoney,
  intended_offer_price: optionalPositiveMoney,
  earnest_money_planned: optionalNonNegativeMoney,
  projected_close_date: z.string().optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

const dealFormRefinements = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .refine(
      (data: z.infer<typeof dealFormObjectSchema>) => {
        if (data.projected_close_date == null || data.projected_close_date === '') return true;
        const d = parseLocalDate(data.projected_close_date);
        if (Number.isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      },
      { message: 'Projected close date cannot be in the past', path: ['projected_close_date'] }
    )
    .refine(
      (data: z.infer<typeof dealFormObjectSchema>) => {
        if (
          data.intended_offer_price != null &&
          data.earnest_money_planned != null &&
          data.intended_offer_price > 0
        ) {
          return data.earnest_money_planned <= data.intended_offer_price;
        }
        return true;
      },
      { message: 'Earnest money cannot exceed intended offer price', path: ['earnest_money_planned'] }
    );

/**
 * Deal Creation Sheet + standalone new deal (Sprint 3 §3.2).
 * `org_id` comes from auth context; optional `user_id` is the earning agent.
 */
export const dealFormSchema = dealFormRefinements(dealFormObjectSchema);

export type DealFormData = z.infer<typeof dealFormSchema>;

/**
 * When editing an existing deal from detail (stage transitions validated in service).
 */
export const dealUpdateFormSchema = dealFormRefinements(
  dealFormObjectSchema.partial().extend({
    deal_name: z.string().min(1).max(300).optional(),
  })
);

export type DealUpdateFormData = z.infer<typeof dealUpdateFormSchema>;
