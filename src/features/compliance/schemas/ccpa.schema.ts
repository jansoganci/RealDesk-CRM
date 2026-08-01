import { z } from 'zod';

export const REQUEST_TYPES = ['know', 'delete', 'opt_out_sale', 'opt_out_share', 'correct'] as const;
export const RELATIONSHIP_TYPES = ['tenant', 'buyer', 'seller', 'lead', 'other'] as const;
export const REQUEST_STATUSES = [
  'pending',
  'in_review',
  'verification_sent',
  'processing',
  'completed',
  'denied',
] as const;

export const submitRequestSchema = z.object({
  request_type: z.enum(REQUEST_TYPES, { required_error: 'Request type is required' }),
  requester_name: z.string().min(2, 'Name must be at least 2 characters'),
  requester_email: z.string().email('Valid email address required'),
  requester_phone: z.string().optional().nullable(),
  relationship_to_org: z.enum(RELATIONSHIP_TYPES, { required_error: 'Relationship is required' }),
  relationship_description: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
});

export type SubmitRequestFormValues = z.infer<typeof submitRequestSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES),
  status_notes: z.string().optional().nullable(),
});

export type UpdateStatusFormValues = z.infer<typeof updateStatusSchema>;
