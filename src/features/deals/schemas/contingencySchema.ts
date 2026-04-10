import { z } from 'zod';

/** Matches DB `offer_contingencies.contingency_type` CHECK */
export const contingencyTypeSchema = z.enum([
  'inspection_general',
  'financing',
  'appraisal',
  'title',
  'home_sale',
  'hoa_review',
  'condo_doc_review',
  'insurance',
  'attorney_review',
  'radon',
  'termite',
  'septic',
  'well_water',
  'survey',
  'lead_based_paint',
  'mold_environmental',
  'flood_insurance',
  'sale_of_other_property',
  'custom',
]);

export const contingencyStatusSchema = z.enum([
  'proposed',
  'active',
  'satisfied',
  'waived',
  'expired',
  'failed',
]);

export const contingencyResolutionTypeSchema = z.enum([
  'satisfied',
  'waived',
  'negotiated_out',
  'expired',
  'terminated_deal',
]);

const typeSpecificDataSchema = z.record(z.string(), z.unknown()).optional().nullable();

/**
 * Single contingency row (offer round child). Used in offer forms and contingency tab.
 */
export const contingencyFormSchema = z
  .object({
    contingency_type: contingencyTypeSchema,
    label_override: z.string().max(500).optional().nullable(),
    included_in_offer: z.boolean(),
    waived_at_offer: z.boolean(),
    days_offset: z.coerce.number().int().min(0).max(365).optional().nullable(),
    deadline_date: z.string().optional().nullable(),
    response_due_date: z.string().optional().nullable(),
    status: contingencyStatusSchema.default('proposed'),
    waived_after_acceptance: z.boolean().optional(),
    resolved_date: z.string().optional().nullable(),
    resolution_type: contingencyResolutionTypeSchema.optional().nullable(),
    notice_required: z.boolean().optional(),
    notice_sent_date: z.string().optional().nullable(),
    type_specific_data: typeSpecificDataSchema,
    notes: z.string().max(2000).optional().nullable(),
    business_days_only: z.boolean().optional(),
  })
  .refine(
    (data) => data.contingency_type !== 'custom' || (data.label_override != null && data.label_override.trim().length > 0),
    { message: 'Custom contingencies require a label', path: ['label_override'] }
  );

export type ContingencyFormData = z.infer<typeof contingencyFormSchema>;

export const contingencyFormArraySchema = z.array(contingencyFormSchema);
