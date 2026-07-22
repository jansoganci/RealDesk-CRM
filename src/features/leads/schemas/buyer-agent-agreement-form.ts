/**
 * Buyer-Agent Agreement Form Validation Schema
 * Zod schema for creating buyer-agent agreements
 */

import { z } from 'zod';

// ============================================================================
// Commission Type Enum & Options
// ============================================================================

export const commissionTypeSchema = z.enum(['percentage', 'flat_fee', 'tiered']);

export const COMMISSION_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage of Sale Price' },
  { value: 'flat_fee', label: 'Flat Fee' },
  { value: 'tiered', label: 'Tiered Commission' },
] as const;

// ============================================================================
// Agreement Status Enum & Options
// ============================================================================

export const agreementStatusSchema = z.enum([
  'draft',
  'sent',
  'signed',
  'active',
  'expired',
  'terminated',
]);

export const AGREEMENT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
] as const;

// ============================================================================
// Create Buyer-Agent Agreement Schema
// ============================================================================

export const createBuyerAgentAgreementSchema = z
  .object({
    lead_id: z.string().uuid('Invalid lead ID'),

    signed_date: z.string().min(1, 'Signed date is required'),

    expiration_date: z.string().min(1, 'Expiration date is required'),

    commission_type: commissionTypeSchema,

    commission_rate: z.coerce
      .number()
      .min(0, 'Commission rate cannot be negative')
      .max(100, 'Commission rate cannot exceed 100%')
      .optional()
      .nullable(),

    flat_fee_amount: z.coerce
      .number()
      .positive('Flat fee must be positive')
      .optional()
      .nullable(),

    pdf_url: z.string().url('Invalid URL').optional().or(z.literal('')),

    status: agreementStatusSchema.default('draft'),
  })
  .refine(
    (data) => {
      // If percentage, require commission_rate
      if (data.commission_type === 'percentage') {
        return data.commission_rate !== undefined && data.commission_rate !== null && data.commission_rate > 0;
      }
      return true;
    },
    {
      message: 'Commission rate is required for percentage-based agreements',
      path: ['commission_rate'],
    }
  )
  .refine(
    (data) => {
      // If flat_fee, require flat_fee_amount
      if (data.commission_type === 'flat_fee') {
        return data.flat_fee_amount !== undefined && data.flat_fee_amount !== null && data.flat_fee_amount > 0;
      }
      return true;
    },
    {
      message: 'Flat fee amount is required for flat-fee agreements',
      path: ['flat_fee_amount'],
    }
  )
  .refine(
    (data) => {
      // Expiration must be after signed date
      return data.expiration_date > data.signed_date;
    },
    {
      message: 'Expiration date must be after signed date',
      path: ['expiration_date'],
    }
  );

// ============================================================================
// Update Buyer-Agent Agreement Schema
// ============================================================================

export const updateBuyerAgentAgreementSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),

  signed_date: z.string().optional(),

  expiration_date: z.string().optional(),

  commission_type: commissionTypeSchema.optional(),

  commission_rate: z.coerce
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(100, 'Commission rate cannot exceed 100%')
    .optional()
    .nullable(),

  flat_fee_amount: z.coerce
    .number()
    .positive('Flat fee must be positive')
    .optional()
    .nullable(),

  pdf_url: z.string().url('Invalid URL').optional().or(z.literal('')),

  status: agreementStatusSchema.optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateBuyerAgentAgreementFormData = z.infer<typeof createBuyerAgentAgreementSchema>;
export type UpdateBuyerAgentAgreementFormData = z.infer<typeof updateBuyerAgentAgreementSchema>;
