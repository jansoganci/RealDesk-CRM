/**
 * Contract Form Validation Schema
 * Zod schema for contract creation form
 */

import { z } from 'zod';
import { isValidTC, isValidIBAN } from '@/lib/serviceProxy';
import { isValidPhone } from '@/lib/serviceProxy';

// ============================================================================
// Contract Form Schema
// ============================================================================

export const contractFormSchema = z.object({
  // ============================================================================
  // Owner Section
  // ============================================================================
  owner_name: z.string()
    .min(2, 'En az 2 karakter gerekli')
    .max(100, 'En fazla 100 karakter'),

  owner_tc: z.string()
    .length(11, 'TC Kimlik No 11 haneli olmalı')
    .regex(/^\d+$/, 'Sadece rakam giriniz')
    .refine((tc) => isValidTC(tc), {
      message: 'Geçersiz TC Kimlik No formatı',
    }),

  owner_iban: z.string()
    .regex(/^TR\d{24}$/, 'Geçerli IBAN giriniz (TR + 24 rakam)')
    .refine((iban) => isValidIBAN(iban), {
      message: 'Geçersiz IBAN formatı',
    }),

  owner_phone: z.string()
    .min(10, 'Geçerli telefon numarası giriniz')
    .refine((phone) => isValidPhone(phone), {
      message: 'Geçersiz telefon numarası (5XX XXX XX XX formatında olmalı)',
    }),

  owner_email: z.string()
    .email('Geçerli email adresi giriniz')
    .optional()
    .or(z.literal('')),

  // ============================================================================
  // Tenant Section
  // ============================================================================
  tenant_name: z.string()
    .min(2, 'En az 2 karakter gerekli')
    .max(100, 'En fazla 100 karakter'),

  tenant_tc: z.string()
    .length(11, 'TC Kimlik No 11 haneli olmalı')
    .regex(/^\d+$/, 'Sadece rakam giriniz')
    .refine((tc) => isValidTC(tc), {
      message: 'Geçersiz TC Kimlik No formatı',
    }),

  tenant_phone: z.string()
    .min(10, 'Geçerli telefon numarası giriniz')
    .refine((phone) => isValidPhone(phone), {
      message: 'Geçersiz telefon numarası (5XX XXX XX XX formatında olmalı)',
    }),

  tenant_email: z.string()
    .email('Geçerli email adresi giriniz')
    .optional()
    .or(z.literal('')),

  tenant_address: z.string()
    .min(10, 'Tam adres giriniz (en az 10 karakter)'),

  // ============================================================================
  // Property Section
  // ============================================================================
  mahalle: z.string()
    .min(2, 'Mahalle gerekli')
    .max(100, 'En fazla 100 karakter'),

  cadde_sokak: z.string()
    .min(2, 'Cadde/Sokak gerekli')
    .max(100, 'En fazla 100 karakter'),

  bina_no: z.string()
    .min(1, 'Bina no gerekli')
    .max(20, 'En fazla 20 karakter'),

  daire_no: z.string()
    .max(20, 'En fazla 20 karakter')
    .optional()
    .or(z.literal('')),

  ilce: z.string()
    .min(2, 'İlçe gerekli')
    .max(50, 'En fazla 50 karakter'),

  il: z.string()
    .min(2, 'İl gerekli')
    .max(50, 'En fazla 50 karakter'),

  property_type: z.enum(['apartment', 'house', 'commercial'], {
    errorMap: () => ({ message: 'Geçerli mülk tipi seçiniz' }),
  }),

  use_purpose: z.string()
    .max(100, 'En fazla 100 karakter')
    .optional()
    .or(z.literal('')),

  // ============================================================================
  // Contract Section
  // ============================================================================
  start_date: z.date({
    required_error: 'Başlangıç tarihi gerekli',
    invalid_type_error: 'Geçerli tarih giriniz',
  }),

  end_date: z.date({
    required_error: 'Bitiş tarihi gerekli',
    invalid_type_error: 'Geçerli tarih giriniz',
  }),

  rent_amount: z.number({
    required_error: 'Kira tutarı gerekli',
    invalid_type_error: 'Geçerli sayı giriniz',
  })
    .min(1, 'Kira tutarı 0\'dan büyük olmalı')
    .max(1000000000, 'Geçersiz tutar'),

  deposit: z.number({
    required_error: 'Depozito gerekli',
    invalid_type_error: 'Geçerli sayı giriniz',
  })
    .min(0, 'Depozito 0 veya daha fazla olmalı')
    .max(1000000000, 'Geçersiz tutar'),

  // ============================================================================
  // Optional Details Section
  // ============================================================================
  payment_day_of_month: z.number()
    .min(1, 'Gün 1-31 arası olmalı')
    .max(31, 'Gün 1-31 arası olmalı')
    .optional(),

  payment_method: z.string()
    .max(100, 'En fazla 100 karakter')
    .optional()
    .or(z.literal('')),

  special_conditions: z.string()
    .max(1000, 'En fazla 1000 karakter')
    .optional()
    .or(z.literal('')),

}).refine((data) => data.end_date > data.start_date, {
  message: 'Bitiş tarihi başlangıç tarihinden sonra olmalı',
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
  payment_method: '',
  special_conditions: '',
};
