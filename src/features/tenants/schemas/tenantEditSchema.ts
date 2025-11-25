import * as z from 'zod';
import type { TFunction } from 'i18next';

/**
 * Tenant Edit Validation Schema
 * Zod schema for editing tenant and contract information
 * 
 * Used by EnhancedTenantEditDialog component
 */

export const getTenantEditSchema = (t: TFunction) => {
  return z.object({
    // Step 1: Tenant Info
    tenant: z.object({
      name: z.string().min(1, t('errors.tenant.nameRequired', 'Tenant name is required')),
      email: z.string()
        .email(t('errors.tenant.invalidEmail', 'Invalid email address'))
        .optional()
        .or(z.literal('')),
      phone: z.string().optional(),
      notes: z.string().optional(),
    }),
    
    // Step 2 & 3: Contract Details with Settings
    contract: z.object({
      property_id: z.string().min(1, t('errors.tenant.propertyRequired', 'Property selection is required')),
      start_date: z.string().min(1, t('errors.validation.required', 'Start date is required')),
      end_date: z.string().min(1, t('errors.validation.required', 'End date is required')),
      rent_amount: z.number().nullable().optional(),
      status: z.enum(['Active', 'Inactive', 'Archived']).default('Active'),
      rent_increase_reminder_enabled: z.boolean().default(false),
      rent_increase_reminder_days: z.number().default(90),
      expected_new_rent: z.number().nullable().optional(),
      reminder_notes: z.string().optional(),
    }),
  }).refine((data) => {
    // End date must be after start date
    if (data.contract.start_date && data.contract.end_date) {
      return new Date(data.contract.end_date) > new Date(data.contract.start_date);
    }
    return true;
  }, {
    message: t('enhanced.errors.endDateBeforeStart', 'End date must be after start date'),
    path: ['contract', 'end_date'],
  });
};

// Export TypeScript type
export type TenantEditFormData = z.infer<ReturnType<typeof getTenantEditSchema>>;

