/**
 * Showing Log Form Validation Schema
 * Zod schema for recording property showings
 */

import { z } from 'zod';

// ============================================================================
// Interest Level Enum & Options
// ============================================================================

export const interestLevelSchema = z.enum(['high', 'medium', 'low', 'none']);

export const INTEREST_LEVEL_OPTIONS = [
  { value: 'high', label: 'High Interest' },
  { value: 'medium', label: 'Medium Interest' },
  { value: 'low', label: 'Low Interest' },
  { value: 'none', label: 'No Interest' },
] as const;

// ============================================================================
// Create Showing Log Schema
// ============================================================================

export const createShowingLogSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),

  property_id: z.string().uuid('Invalid property ID'),

  showing_date: z.date({
    required_error: 'Showing date is required',
  }),

  duration_minutes: z.coerce
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .max(480, 'Duration cannot exceed 8 hours (480 minutes)')
    .optional()
    .nullable(),

  feedback: z
    .string()
    .max(1000, 'Feedback must be less than 1000 characters')
    .optional()
    .or(z.literal('')),

  interest_level: interestLevelSchema.optional().nullable(),
});

// ============================================================================
// Update Showing Log Schema
// ============================================================================

export const updateShowingLogSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),

  property_id: z.string().uuid('Invalid property ID'),

  showing_date: z.date().optional(),

  duration_minutes: z.coerce
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be positive')
    .max(480, 'Duration cannot exceed 8 hours (480 minutes)')
    .optional()
    .nullable(),

  feedback: z
    .string()
    .max(1000, 'Feedback must be less than 1000 characters')
    .optional()
    .or(z.literal('')),

  interest_level: interestLevelSchema.optional().nullable(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateShowingLogFormData = z.infer<typeof createShowingLogSchema>;
export type UpdateShowingLogFormData = z.infer<typeof updateShowingLogSchema>;
