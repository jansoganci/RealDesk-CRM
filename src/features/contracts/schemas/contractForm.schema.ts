/**
 * Contract Form Validation Schema
 * Zod schema for contract creation form
 */

import { z } from 'zod';
import i18n from '@/i18n';
import { isValidTC, isValidIBAN } from '@/lib/serviceProxy';
import { isValidPhone } from '@/lib/serviceProxy';

// ============================================================================
// Contract Form Schema
// ============================================================================

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`contracts:validation.${key}`, options);

export const contractFormSchema = z.object({
  // ============================================================================
  // Owner Section
  // ============================================================================
  owner_name: z.string()
    .min(2, t('minChars', { min: 2 }))
    .max(100, t('maxChars', { max: 100 })),

  owner_tc: z.string()
    .length(11, t('tcLengthStrict', { length: 11 }))
    .regex(/^\d+$/, t('digitsOnly'))
    .refine((tc) => isValidTC(tc), {
      message: t('invalidTcFormat'),
    }),

  owner_iban: z.string()
    .regex(/^TR\d{24}$/, t('ibanFormat'))
    .refine((iban) => isValidIBAN(iban), {
      message: t('invalidIbanFormat'),
    }),

  owner_phone: z.string()
    .min(10, t('phoneMin'))
    .refine((phone) => isValidPhone(phone), {
      message: t('invalidPhoneFormat'),
    }),

  owner_email: z.string()
    .email(t('validEmail'))
    .optional()
    .or(z.literal('')),

  // ============================================================================
  // Tenant Section
  // ============================================================================
  tenant_name: z.string()
    .min(2, t('minChars', { min: 2 }))
    .max(100, t('maxChars', { max: 100 })),

  tenant_tc: z.string()
    .length(11, t('tcLengthStrict', { length: 11 }))
    .regex(/^\d+$/, t('digitsOnly'))
    .refine((tc) => isValidTC(tc), {
      message: t('invalidTcFormat'),
    }),

  tenant_phone: z.string()
    .min(10, t('phoneMin'))
    .refine((phone) => isValidPhone(phone), {
      message: t('invalidPhoneFormat'),
    }),

  tenant_email: z.string()
    .email(t('validEmail'))
    .optional()
    .or(z.literal('')),

  tenant_address: z.string()
    .min(10, t('fullAddressMin', { min: 10 })),

  // ============================================================================
  // Property Section
  // ============================================================================
  mahalle: z.string()
    .min(2, t('neighborhoodRequired'))
    .max(100, t('maxChars', { max: 100 })),

  cadde_sokak: z.string()
    .min(2, t('streetRequired'))
    .max(100, t('maxChars', { max: 100 })),

  bina_no: z.string()
    .min(1, t('buildingNoRequired'))
    .max(20, t('maxChars', { max: 20 })),

  daire_no: z.string()
    .max(20, t('maxChars', { max: 20 }))
    .optional()
    .or(z.literal('')),

  ilce: z.string()
    .min(2, t('districtRequired'))
    .max(50, t('maxChars', { max: 50 })),

  il: z.string()
    .min(2, t('cityRequired'))
    .max(50, t('maxChars', { max: 50 })),

  property_type: z.enum(['apartment', 'house', 'commercial'], {
    errorMap: () => ({ message: t('propertyTypeRequired') }),
  }),

  use_purpose: z.string()
    .max(100, t('maxChars', { max: 100 }))
    .optional()
    .or(z.literal('')),

  // ============================================================================
  // Contract Section
  // ============================================================================
  start_date: z.date({
    required_error: t('startDateRequired'),
    invalid_type_error: t('validDate'),
  }),

  end_date: z.date({
    required_error: t('endDateRequired'),
    invalid_type_error: t('validDate'),
  }),

  rent_amount: z.number({
    required_error: t('rentRequired'),
    invalid_type_error: t('validNumber'),
  })
    .min(1, t('rentGreaterThanZero'))
    .max(1000000000, t('invalidAmount')),

  deposit: z.number({
    required_error: t('depositRequired'),
    invalid_type_error: t('validNumber'),
  })
    .min(0, t('depositNonNegative'))
    .max(1000000000, t('invalidAmount')),

  currency: z.enum(['TRY', 'USD', 'EUR'], {
    errorMap: () => ({ message: t('currencyRequired') }),
  }).default('TRY'),

  commission_amount: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.number({
      invalid_type_error: t('validNumber'),
    })
      .min(0, t('commissionNonNegative'))
      .max(1000000000, t('invalidAmount'))
      .optional()
  ),

  // ============================================================================
  // Optional Details Section
  // ============================================================================
  payment_day_of_month: z.number()
    .min(1, t('paymentDayRange'))
    .max(31, t('paymentDayRange'))
    .optional(),

  payment_method: z.string()
    .max(100, t('maxChars', { max: 100 }))
    .optional()
    .or(z.literal('')),

  special_conditions: z.string()
    .max(1000, t('maxChars', { max: 1000 }))
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const items = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
      // Check max number of items (20)
      if (items.length > 20) return false;
      // Check max length per item (50 characters)
      if (items.some(item => item.length > 50)) return false;
      return true;
    }, {
      message: t('fixtures.maxItemsOrLength'),
    })
    .optional()
    .or(z.literal('')),

  // ============================================================================
  // Clause Overrides (Editable Clauses Feature)
  // ============================================================================
  clauseOverrides: z.array(z.object({
    clause_type: z.enum(['GENEL_SARTLAR', 'OZEL_SARTLAR', 'TAHLIYE_TAAHHUTNAMESI']),
    clause_index: z.number().int().min(0),
    custom_content: z.string().min(1, t('clauseContentRequired')),
  })).optional(),

}).refine((data) => data.end_date > data.start_date, {
  message: t('endDateAfterStartStrict'),
  path: ['end_date'],
});

// ============================================================================
// TypeScript Type
// ============================================================================

export type ContractFormData = z.infer<typeof contractFormSchema>;

// ============================================================================
// Default Values
// ============================================================================

export const contractFormDefaultValues: Partial<ContractFormData> = {
  owner_name: '',
  owner_tc: '',
  owner_iban: '',
  owner_phone: '',
  owner_email: '',
  tenant_name: '',
  tenant_tc: '',
  tenant_phone: '',
  tenant_email: '',
  tenant_address: '',
  mahalle: '',
  cadde_sokak: '',
  bina_no: '',
  daire_no: '',
  ilce: '',
  il: 'İstanbul', // Default to Istanbul
  property_type: 'apartment',
  use_purpose: '',
  currency: 'TRY',
  payment_method: '',
  special_conditions: '',
  clauseOverrides: [],
};
