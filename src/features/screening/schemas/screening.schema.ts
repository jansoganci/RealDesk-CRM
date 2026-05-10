import { z } from 'zod';

export const SCREENING_STATUSES = ['pending', 'in_review', 'approved', 'rejected', 'flagged'] as const;

export const screeningSchema = z.object({
  applicant_name: z.string().min(1, 'Full name is required.'),
  applicant_email: z
    .string()
    .email('Enter a valid email address.')
    .optional()
    .or(z.literal('')),
  applicant_phone: z.string().optional().or(z.literal('')),
  screening_status: z.enum(SCREENING_STATUSES).default('pending'),
  property_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  desired_move_in_date: z.string().optional().nullable(),
  monthly_income: z
    .number({ invalid_type_error: 'Monthly income must be a number.' })
    .positive('Monthly income must be a positive number.')
    .optional()
    .nullable(),
  credit_score: z
    .number({ invalid_type_error: 'Credit score must be a number.' })
    .int()
    .min(300, 'Credit score must be between 300 and 850.')
    .max(850, 'Credit score must be between 300 and 850.')
    .optional()
    .nullable(),
  background_check: z.boolean().default(false),
  credit_check: z.boolean().default(false),
  employment_verification: z.boolean().default(false),
  landlord_reference: z.boolean().default(false),
  income_verification: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export type ScreeningFormValues = z.infer<typeof screeningSchema>;
