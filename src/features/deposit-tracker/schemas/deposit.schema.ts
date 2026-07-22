import { z } from 'zod';

export const DEPOSIT_STATUSES = ['held', 'partially_returned', 'fully_returned', 'disputed'] as const;
export const HELD_BY_OPTIONS = ['landlord', 'escrow', 'government_agency', 'other'] as const;
export const DEDUCTION_CATEGORIES = ['damage', 'cleaning', 'unpaid_rent', 'late_fees', 'other'] as const;

export const depositSchema = z.object({
  property_id: z.string().uuid().optional().nullable(),
  tenant_id: z.string().uuid().optional().nullable(),
  contract_id: z.string().uuid().optional().nullable(),
  deposit_amount: z
    .number({ invalid_type_error: 'Deposit amount must be a number.' })
    .nonnegative('Deposit amount must be 0 or greater.'),
  held_by: z.enum(HELD_BY_OPTIONS).default('landlord'),
  held_by_other_description: z.string().optional().nullable(),
  return_deadline: z.string().min(1, 'Return deadline is required.'),
  return_date: z.string().optional().nullable(),
  status: z.enum(DEPOSIT_STATUSES).default('held'),
  interest_required: z.boolean().default(false),
  interest_amount: z
    .number({ invalid_type_error: 'Interest amount must be a number.' })
    .nonnegative()
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export type DepositFormValues = z.infer<typeof depositSchema>;

export const deductionSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number.' })
    .positive('Amount must be greater than 0.'),
  category: z.enum(DEDUCTION_CATEGORIES).optional().nullable(),
});

export type DeductionFormValues = z.infer<typeof deductionSchema>;
