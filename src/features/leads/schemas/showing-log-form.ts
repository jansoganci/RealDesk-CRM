/**
 * Showing Log Form Validation Schema
 * Zod schema for recording property showings
 */

import { z } from 'zod';

// ============================================================================
// Feedback Enum & Options
// ============================================================================

export const showingFeedbackSchema = z.enum(['loved', 'interested', 'pass']);

export const SHOWING_FEEDBACK_OPTIONS = [
  { value: 'loved', label: 'Loved', emoji: '🏠' },
  { value: 'interested', label: 'Interested', emoji: '👍' },
  { value: 'pass', label: 'Pass', emoji: '👎' },
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

  feedback: showingFeedbackSchema.default('interested'),

  interest_level: z.string().optional(),
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

  feedback: showingFeedbackSchema.optional(),

  interest_level: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateShowingLogFormData = z.infer<typeof createShowingLogSchema>;
export type UpdateShowingLogFormData = z.infer<typeof updateShowingLogSchema>;
