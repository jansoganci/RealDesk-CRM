# Contract Management System - 3-Version Implementation Plan

**Project:** Real Estate Contract Management CRM
**Feature:** Automated Contract Creation with Smart Entity Management
**Date:** November 20, 2025
**Strategy:** 3 Independent Versions (V1 → V2 → V3)

---

## 🎉 VERSION 1 COMPLETION STATUS

**Status:** ✅ **COMPLETE** - Tested and Verified
**Completed Date:** November 20, 2025
**Actual Time:** ~8 hours
**Testing Result:** ✅ ALL TESTS PASSED

### What Was Delivered:
- ✅ Database schema migrated successfully
- ✅ Encryption services (AES-256-GCM) working
- ✅ Phone normalization functional
- ✅ Address normalization with live preview
- ✅ Complete contract form with validation
- ✅ Turkish/English translations
- ✅ TypeScript compilation clean
- ✅ Production build successful

### User Testing Results:
- ✅ Form renders correctly
- ✅ TC validation working (rejected 10 digits correctly)
- ✅ IBAN validation working (rejected invalid format)
- ✅ Phone validation working
- ✅ Address preview updates in real-time
- ✅ Date pickers functional
- ✅ All fields accepting input correctly

### Git Status:
- ⏭️ Ready to commit
- ⏭️ Ready to tag as `v1-foundation`
- ⏭️ Ready for V2 development

---

## Implementation Strategy Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Version 1: Foundation (MVP) - 8 hours                      │
│  ✓ Database schema                                          │
│  ✓ Encryption services                                      │
│  ✓ Basic UI with manual creation                            │
│  ✓ NO auto-creation, NO RPC, NO duplicate detection         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Version 2: Atomic Transaction (Core Magic) - 7 hours       │
│  ✓ PostgreSQL RPC function                                  │
│  ✓ Smart auto-creation logic                                │
│  ✓ Service layer integration                                │
│  ✓ NO duplicate warnings, NO confirmations                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Version 3: Polish & Safety - 6 hours                       │
│  ✓ Duplicate detection                                      │
│  ✓ User confirmations                                        │
│  ✓ Database indexes                                         │
│  ✓ Production-ready                                         │
└─────────────────────────────────────────────────────────────┘
```

---

# VERSION 1: FOUNDATION (MVP)

**Time Estimate:** 8 hours
**Goal:** Build database schema, encryption services, and basic UI with manual entity creation
**Status:** Ready to start

---

## V1 Objectives

- ✅ Create database tables with encryption fields
- ✅ Implement encryption/decryption services
- ✅ Build phone normalization utility
- ✅ Build address normalization utility
- ✅ Create comprehensive contract form UI
- ✅ Manual creation: Form → Create owner → Create tenant → Create property → Create contract
- ❌ **NOT INCLUDED:** Auto-creation, RPC, duplicate detection

---

## V1.1 Database Schema (2 hours)

### Tasks

- [ ] **Create migration file** (20 min)
  - File: `supabase/migrations/20251120_contract_management_v1.sql`
  - Add property_owners table modifications
  - Add tenants table modifications
  - Add properties table modifications
  - Add contract_details table
  - Add basic indexes (non-performance critical)

- [ ] **Test migration locally** (10 min)
  - Run: `supabase db reset`
  - Verify tables created
  - Verify columns exist
  - Check RLS policies applied

- [ ] **Update TypeScript types** (30 min)
  - Run: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts`
  - Add custom types to `src/types/index.ts`
  - Add PropertyOwnerWithEncryption interface
  - Add TenantWithEncryption interface
  - Add PropertyWithComponents interface

- [ ] **Create type definitions** (30 min)
  - File: `src/types/contract.types.ts`
  - Add ContractFormData interface
  - Add ContractCreationResult interface
  - Add EncryptedOwner interface
  - Add EncryptedTenant interface

- [ ] **Document schema changes** (30 min)
  - Update: `docs/CONTRACT_MANAGEMENT_TECH_SPEC.md`
  - Add migration notes
  - Add rollback instructions

### Files to Create

```
supabase/migrations/20251120_contract_management_v1.sql
src/types/contract.types.ts
```

### Files to Modify

```
src/types/database.ts (regenerated)
src/types/index.ts
docs/CONTRACT_MANAGEMENT_TECH_SPEC.md
```

### SQL Migration Content

```sql
-- File: supabase/migrations/20251120_contract_management_v1.sql

-- 1. Add encryption fields to property_owners
ALTER TABLE property_owners
ADD COLUMN IF NOT EXISTS tc_encrypted text,
ADD COLUMN IF NOT EXISTS tc_hash text,
ADD COLUMN IF NOT EXISTS iban_encrypted text;

-- 2. Add encryption fields to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS tc_encrypted text,
ADD COLUMN IF NOT EXISTS tc_hash text;

-- 3. Modify properties table for component-based address
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS mahalle text,
ADD COLUMN IF NOT EXISTS cadde_sokak text,
ADD COLUMN IF NOT EXISTS bina_no text,
ADD COLUMN IF NOT EXISTS daire_no text,
ADD COLUMN IF NOT EXISTS ilce text,
ADD COLUMN IF NOT EXISTS il text,
ADD COLUMN IF NOT EXISTS full_address text,
ADD COLUMN IF NOT EXISTS normalized_address text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'apartment',
ADD COLUMN IF NOT EXISTS use_purpose text;

-- 4. Create contract_details table
CREATE TABLE IF NOT EXISTS contract_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  payment_day_of_month integer,
  payment_method text,

  -- Financial details
  annual_rent numeric(10,2),
  rent_increase_rate numeric(5,2),
  deposit_currency text DEFAULT 'TRY',

  -- Legal details
  special_conditions text,
  furniture_list text[],

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Basic indexes (performance indexes in V3)
CREATE INDEX IF NOT EXISTS idx_owners_tc_hash ON property_owners(tc_hash);
CREATE INDEX IF NOT EXISTS idx_tenants_tc_hash ON tenants(tc_hash);

-- 6. RLS policies for contract_details
ALTER TABLE contract_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contract details"
  ON contract_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contract details"
  ON contract_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contract details"
  ON contract_details FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contract details"
  ON contract_details FOR DELETE
  USING (auth.uid() = user_id);
```

### Testing Checklist

- [ ] Tables created successfully
- [ ] Columns added to existing tables
- [ ] RLS policies active
- [ ] TypeScript types generated without errors
- [ ] No existing data corrupted

### Git Commit

```bash
git add supabase/migrations/20251120_contract_management_v1.sql
git add src/types/
git commit -m "feat(contracts): add V1 database schema with encryption fields

- Add tc_encrypted, tc_hash, iban_encrypted to property_owners
- Add tc_encrypted, tc_hash to tenants
- Add component-based address fields to properties
- Create contract_details table
- Add basic indexes and RLS policies

Part of Contract Management V1 (Foundation)"
```

---

## V1.2 Encryption Service (1.5 hours)

### Tasks

- [ ] **Create encryption service** (45 min)
  - File: `src/services/encryption.service.ts`
  - Implement `encrypt()` function
  - Implement `decrypt()` function
  - Implement `hashTC()` function
  - Add error handling
  - Add TypeScript types

- [ ] **Add environment variable** (15 min)
  - Add `VITE_ENCRYPTION_KEY` to `.env`
  - Generate 32-byte key: `openssl rand -hex 32`
  - Add to `.env.example` with placeholder
  - Document in README

- [ ] **Write unit tests** (30 min)
  - File: `src/services/encryption.service.test.ts`
  - Test encrypt/decrypt roundtrip
  - Test hash consistency
  - Test error handling
  - Test invalid inputs

### Files to Create

```
src/services/encryption.service.ts
.env (add VITE_ENCRYPTION_KEY)
```

### Files to Modify

```
.env.example
README.md (add encryption key setup)
```

### Encryption Service Code

```typescript
// File: src/services/encryption.service.ts

/**
 * Encryption Service for TC Kimlik No and IBAN
 * Uses AES-256-GCM for encryption
 * Uses SHA-256 for hashing (lookups)
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Get encryption key from environment
 * Must be 32 bytes (256 bits)
 */
function getEncryptionKey(): CryptoKey {
  const keyHex = import.meta.env.VITE_ENCRYPTION_KEY;

  if (!keyHex || keyHex.length !== 64) {
    throw new Error('VITE_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  // Convert hex to Uint8Array
  const keyData = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: iv:authTag:ciphertext (all hex-encoded)
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedText = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encodedText
    );

    // Convert to hex
    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const ciphertextHex = Array.from(new Uint8Array(ciphertext))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return `${ivHex}:${ciphertextHex}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt ciphertext
 * Input format: iv:ciphertext (hex-encoded)
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    const [ivHex, encryptedHex] = ciphertext.split(':');

    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid ciphertext format');
    }

    const key = await getEncryptionKey();

    // Convert from hex
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const encrypted = new Uint8Array(
      encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash TC Kimlik No for lookups
 * Uses SHA-256 (one-way, cannot be reversed)
 */
export async function hashTC(tc: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(tc);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Validate TC Kimlik No format
 */
export function isValidTC(tc: string): boolean {
  return /^\d{11}$/.test(tc);
}

/**
 * Validate IBAN format (Turkey)
 */
export function isValidIBAN(iban: string): boolean {
  return /^TR\d{24}$/.test(iban);
}
```

### Testing Checklist

- [ ] Encryption/decryption roundtrip works
- [ ] Hash produces consistent output
- [ ] Invalid key throws error
- [ ] Invalid format throws error
- [ ] TC validation works
- [ ] IBAN validation works

### Git Commit

```bash
git add src/services/encryption.service.ts
git add .env.example
git commit -m "feat(contracts): add encryption service for TC and IBAN

- Implement AES-256-GCM encryption/decryption
- Implement SHA-256 hashing for lookups
- Add TC and IBAN validation
- Add environment variable for encryption key

Part of Contract Management V1 (Foundation)"
```

---

## V1.3 Utility Services (1 hour)

### Tasks

- [ ] **Create phone normalization service** (15 min)
  - File: `src/services/phone.service.ts`
  - Implement `normalizePhone()` function
  - Add tests for various formats

- [ ] **Create address normalization service** (30 min)
  - File: `src/services/address.service.ts`
  - Implement `normalizeAddress()` function
  - Implement `generateFullAddress()` function
  - Add tests

- [ ] **Add to service proxy** (15 min)
  - Update: `src/lib/serviceProxy.ts`
  - Export encryption service
  - Export phone service
  - Export address service

### Files to Create

```
src/services/phone.service.ts
src/services/address.service.ts
```

### Files to Modify

```
src/lib/serviceProxy.ts
```

### Phone Service Code

```typescript
// File: src/services/phone.service.ts

/**
 * Phone Number Normalization Service
 * Converts all formats to: "5392174782"
 */

/**
 * Normalize phone number to standard format
 * Removes: +90, 0, spaces, dashes, parentheses
 *
 * Examples:
 * - "0539 217 47 82" → "5392174782"
 * - "+90 539 217 47 82" → "5392174782"
 * - "539-217-47-82" → "5392174782"
 * - "(0539) 217 47 82" → "5392174782"
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading 0 if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Remove country code +90 if present
  if (cleaned.startsWith('90')) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Format phone for display
 * "5392174782" → "0539 217 47 82"
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone);

  if (normalized.length !== 10) {
    return phone; // Return original if invalid
  }

  return `0${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 8)} ${normalized.substring(8, 10)}`;
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^5\d{9}$/.test(normalized); // Turkish mobile: starts with 5, 10 digits
}
```

### Address Service Code

```typescript
// File: src/services/address.service.ts

/**
 * Address Normalization Service
 * Component-based address handling
 */

export interface AddressComponents {
  mahalle: string;
  cadde_sokak: string;
  bina_no: string;
  daire_no?: string;
  ilce: string;
  il: string;
}

/**
 * Normalize address for matching
 * Converts: "Moda Mahallesi Atatürk Caddesi No:123 D:5 Kadıköy/İstanbul"
 * To: "moda mah atatürk cad 123 5 kadıköy istanbul"
 */
export function normalizeAddress(components: AddressComponents): string {
  return [
    components.mahalle,
    components.cadde_sokak,
    components.bina_no,
    components.daire_no,
    components.ilce,
    components.il
  ]
    .filter(Boolean) // Remove undefined/empty
    .join(' ')
    .toLowerCase()
    .replace(/mahallesi/g, 'mah')
    .replace(/caddesi/g, 'cad')
    .replace(/sokak/g, 'sok')
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Generate full address for display
 * Returns: "Moda Mahallesi Atatürk Caddesi No:123 D:5, Kadıköy/İstanbul"
 */
export function generateFullAddress(components: AddressComponents): string {
  const parts = [
    components.mahalle,
    components.cadde_sokak,
    `No:${components.bina_no}`
  ];

  if (components.daire_no) {
    parts.push(`D:${components.daire_no}`);
  }

  const street = parts.join(' ');
  const location = `${components.ilce}/${components.il}`;

  return `${street}, ${location}`;
}

/**
 * Parse full address into components (for reverse operation)
 */
export function parseAddress(fullAddress: string): Partial<AddressComponents> {
  // This is a simple parser - can be enhanced later
  const parts = fullAddress.split(',');

  if (parts.length < 2) {
    return {}; // Invalid format
  }

  const streetPart = parts[0].trim();
  const locationPart = parts[1].trim();

  const [ilce, il] = locationPart.split('/').map(s => s.trim());

  return {
    ilce,
    il
    // Other fields require more complex parsing
  };
}
```

### Service Proxy Update

```typescript
// File: src/lib/serviceProxy.ts (add these lines)

export { encrypt, decrypt, hashTC, isValidTC, isValidIBAN } from '../services/encryption.service';
export { normalizePhone, formatPhoneForDisplay, isValidPhone } from '../services/phone.service';
export { normalizeAddress, generateFullAddress, parseAddress } from '../services/address.service';
export type { AddressComponents } from '../services/address.service';
```

### Testing Checklist

- [ ] Phone normalization works for all formats
- [ ] Phone validation works
- [ ] Address normalization produces consistent output
- [ ] Full address generation formats correctly
- [ ] Services exported from proxy

### Git Commit

```bash
git add src/services/phone.service.ts
git add src/services/address.service.ts
git add src/lib/serviceProxy.ts
git commit -m "feat(contracts): add phone and address normalization services

- Add phone normalization (removes +90, 0, formatting)
- Add phone validation for Turkish mobile numbers
- Add address normalization for matching
- Add full address generation for display
- Export from service proxy

Part of Contract Management V1 (Foundation)"
```

---

## V1.4 Contract Form UI (3.5 hours)

### Tasks

- [ ] **Create contract form component** (2 hours)
  - File: `src/features/contracts/components/ContractCreateForm.tsx`
  - Owner section (name, TC, IBAN, phone, email)
  - Tenant section (name, TC, phone, email, address)
  - Property section (component-based address fields)
  - Contract section (dates, rent, deposit)
  - Form validation with Zod
  - Loading states

- [ ] **Create address input component** (45 min)
  - File: `src/features/contracts/components/AddressInput.tsx`
  - Separate fields for mahalle, cadde_sokak, etc.
  - Real-time full address preview
  - Validation

- [ ] **Create form validation schema** (30 min)
  - File: `src/features/contracts/schemas/contractForm.schema.ts`
  - Zod schema for all fields
  - Custom validators for TC, IBAN, phone

- [ ] **Add translations** (45 min)
  - Update: `public/locales/tr/contracts.json`
  - Update: `public/locales/en/contracts.json`
  - Add form labels, placeholders, errors

### Files to Create

```
src/features/contracts/components/ContractCreateForm.tsx
src/features/contracts/components/AddressInput.tsx
src/features/contracts/schemas/contractForm.schema.ts
```

### Files to Modify

```
public/locales/tr/contracts.json
public/locales/en/contracts.json
```

### Form Schema Code

```typescript
// File: src/features/contracts/schemas/contractForm.schema.ts

import { z } from 'zod';
import { isValidTC, isValidIBAN } from '@/services/encryption.service';
import { isValidPhone } from '@/services/phone.service';

export const contractFormSchema = z.object({
  // Owner
  owner_name: z.string().min(2, 'En az 2 karakter'),
  owner_tc: z.string()
    .length(11, 'TC Kimlik No 11 haneli olmalı')
    .regex(/^\d+$/, 'Sadece rakam')
    .refine(tc => isValidTC(tc), 'Geçersiz TC Kimlik No'),
  owner_iban: z.string()
    .regex(/^TR\d{24}$/, 'Geçerli IBAN giriniz (TR + 24 rakam)')
    .refine(iban => isValidIBAN(iban), 'Geçersiz IBAN'),
  owner_phone: z.string()
    .min(10, 'Geçerli telefon numarası')
    .refine(phone => isValidPhone(phone), 'Geçersiz telefon numarası'),
  owner_email: z.string().email('Geçerli email').optional().or(z.literal('')),

  // Tenant
  tenant_name: z.string().min(2, 'En az 2 karakter'),
  tenant_tc: z.string()
    .length(11, 'TC Kimlik No 11 haneli olmalı')
    .regex(/^\d+$/, 'Sadece rakam')
    .refine(tc => isValidTC(tc), 'Geçersiz TC Kimlik No'),
  tenant_phone: z.string()
    .min(10, 'Geçerli telefon numarası')
    .refine(phone => isValidPhone(phone), 'Geçersiz telefon numarası'),
  tenant_email: z.string().email('Geçerli email').optional().or(z.literal('')),
  tenant_address: z.string().min(10, 'Tam adres giriniz'),

  // Property
  mahalle: z.string().min(2, 'Mahalle gerekli'),
  cadde_sokak: z.string().min(2, 'Cadde/Sokak gerekli'),
  bina_no: z.string().min(1, 'Bina no gerekli'),
  daire_no: z.string().optional().or(z.literal('')),
  ilce: z.string().min(2, 'İlçe gerekli'),
  il: z.string().min(2, 'İl gerekli'),
  property_type: z.enum(['apartment', 'house', 'commercial']),
  use_purpose: z.string().optional().or(z.literal('')),

  // Contract
  start_date: z.date(),
  end_date: z.date(),
  rent_amount: z.number().min(1, 'Kira tutarı gerekli'),
  deposit: z.number().min(0, 'Depozito 0 veya daha fazla olmalı'),

  // Details (optional for V1)
  payment_day_of_month: z.number().min(1).max(31).optional(),
  payment_method: z.string().optional(),
  special_conditions: z.string().optional()
}).refine(data => data.end_date > data.start_date, {
  message: 'Bitiş tarihi başlangıç tarihinden sonra olmalı',
  path: ['end_date']
});

export type ContractFormData = z.infer<typeof contractFormSchema>;
```

### Translation Updates

```json
// File: public/locales/tr/contracts.json (add to existing)

{
  "create": {
    "title": "Yeni Sözleşme Oluştur",
    "subtitle": "Kira sözleşmesi bilgilerini doldurun",
    "sections": {
      "owner": "Ev Sahibi Bilgileri",
      "tenant": "Kiracı Bilgileri",
      "property": "Mülk Bilgileri",
      "contract": "Sözleşme Detayları"
    },
    "fields": {
      "owner_name": "Ev Sahibi Adı Soyadı",
      "owner_tc": "TC Kimlik No",
      "owner_iban": "IBAN",
      "owner_phone": "Telefon",
      "owner_email": "Email (Opsiyonel)",
      "tenant_name": "Kiracı Adı Soyadı",
      "tenant_tc": "TC Kimlik No",
      "tenant_phone": "Telefon",
      "tenant_email": "Email (Opsiyonel)",
      "tenant_address": "Mevcut Adresi",
      "mahalle": "Mahalle",
      "cadde_sokak": "Cadde/Sokak",
      "bina_no": "Bina No",
      "daire_no": "Daire No (Opsiyonel)",
      "ilce": "İlçe",
      "il": "İl",
      "property_type": "Mülk Tipi",
      "use_purpose": "Kullanım Amacı",
      "start_date": "Başlangıç Tarihi",
      "end_date": "Bitiş Tarihi",
      "rent_amount": "Aylık Kira (TRY)",
      "deposit": "Depozito (TRY)",
      "payment_day": "Ödeme Günü",
      "payment_method": "Ödeme Yöntemi",
      "special_conditions": "Özel Şartlar"
    },
    "placeholders": {
      "owner_name": "Ali Yılmaz",
      "owner_tc": "12345678901",
      "owner_iban": "TR123456789012345678901234",
      "owner_phone": "0539 217 47 82",
      "tenant_name": "Ayşe Demir",
      "mahalle": "Moda Mahallesi",
      "cadde_sokak": "Atatürk Caddesi",
      "bina_no": "123",
      "daire_no": "5",
      "ilce": "Kadıköy",
      "il": "İstanbul"
    },
    "propertyTypes": {
      "apartment": "Daire",
      "house": "Müstakil Ev",
      "commercial": "İşyeri"
    },
    "buttons": {
      "submit": "Sözleşme Oluştur",
      "cancel": "İptal",
      "reset": "Formu Temizle"
    },
    "preview": {
      "fullAddress": "Tam Adres Önizleme"
    }
  }
}
```

### Testing Checklist

- [ ] Form renders correctly
- [ ] All fields accept input
- [ ] Validation works on submit
- [ ] TC validation prevents invalid input
- [ ] IBAN validation works
- [ ] Phone validation works
- [ ] Address preview updates in real-time
- [ ] Date validation prevents end < start
- [ ] Translations load correctly

### Git Commit

```bash
git add src/features/contracts/components/
git add src/features/contracts/schemas/
git add public/locales/
git commit -m "feat(contracts): add contract creation form UI

- Create comprehensive contract form with sections
- Add address input component with preview
- Add Zod validation schema
- Add Turkish/English translations
- Validate TC, IBAN, phone formats

Part of Contract Management V1 (Foundation)"
```

---

## V1 Testing & Validation

### End-to-End Testing Checklist

- [ ] **Database**
  - [ ] Tables created
  - [ ] Columns exist
  - [ ] RLS policies active
  - [ ] Can insert test data via SQL

- [ ] **Services**
  - [ ] Encryption roundtrip works
  - [ ] Phone normalization works
  - [ ] Address normalization works
  - [ ] All exports available from serviceProxy

- [ ] **UI**
  - [ ] Form renders
  - [ ] Validation errors show
  - [ ] Can fill all fields
  - [ ] Translations work (TR/EN)

- [ ] **Build**
  - [ ] `npm run typecheck` passes
  - [ ] `npm run build` succeeds
  - [ ] No console errors in dev mode

### Manual Test Procedure

1. Open form at `/contracts/create`
2. Fill owner section with test data
3. Fill tenant section with test data
4. Fill property section with test address
5. Fill contract section with dates/amounts
6. Click submit (will fail in V1 - expected)
7. Check form validation catches errors
8. Check translations display correctly

---

## V1 Git Workflow

### Final V1 Commit

```bash
# Ensure all changes committed
git status

# Tag version
git tag -a v1-foundation -m "Contract Management V1: Foundation

- Database schema with encryption fields
- Encryption service (AES-256-GCM)
- Phone/address normalization
- Contract form UI with validation

Total time: 8 hours
Status: Ready for V2 integration"

# Push to remote
git push origin main --tags
```

---

## V1 Rollback Plan

### If V1 Fails

**Symptoms:**
- Database migration fails
- TypeScript errors
- Form doesn't render
- Encryption errors

**Rollback Steps:**

```bash
# 1. Revert database migration
supabase db reset

# 2. Revert code changes
git reset --hard HEAD~N  # N = number of commits to undo

# 3. Clean up
npm run typecheck
npm run build

# 4. Restart from last stable point
git checkout main
```

**Restore Database:**

```sql
-- If needed, drop new tables
DROP TABLE IF EXISTS contract_details CASCADE;

-- Remove added columns
ALTER TABLE property_owners
DROP COLUMN IF EXISTS tc_encrypted,
DROP COLUMN IF EXISTS tc_hash,
DROP COLUMN IF EXISTS iban_encrypted;

ALTER TABLE tenants
DROP COLUMN IF EXISTS tc_encrypted,
DROP COLUMN IF EXISTS tc_hash;

ALTER TABLE properties
DROP COLUMN IF EXISTS mahalle,
DROP COLUMN IF EXISTS cadde_sokak,
-- ... etc
```

---

## V1 Deferred to V2

- ❌ Auto-creation logic
- ❌ PostgreSQL RPC function
- ❌ Service layer for contract creation
- ❌ Duplicate detection
- ❌ User confirmations
- ❌ Performance indexes

---

## V1 Success Criteria

✅ Database schema complete with encryption fields
✅ Encryption service working (encrypt/decrypt/hash)
✅ Phone normalization working
✅ Address normalization working
✅ Form UI complete and validated
✅ TypeScript types generated
✅ All translations added
✅ Build succeeds without errors

**When all checkboxes above are complete, V1 is DONE. Proceed to V2.**

---

# VERSION 2: ATOMIC TRANSACTION (CORE MAGIC)

**Time Estimate:** 7 hours
**Goal:** Implement smart auto-creation logic with PostgreSQL RPC
**Status:** Blocked until V1 complete

---

## V2 Objectives

- ✅ Create PostgreSQL RPC function for atomic transaction
- ✅ Implement service layer for contract creation
- ✅ Hook up form to auto-creation logic
- ✅ Show success feedback with creation summary
- ❌ **NOT INCLUDED:** Duplicate warnings, user confirmations, performance indexes

---

## V2.1 PostgreSQL RPC Function (3 hours)

### Tasks

- [ ] **Create RPC migration file** (2 hours)
  - File: `supabase/migrations/20251121_contract_atomic_transaction.sql`
  - Create `create_contract_atomic` function
  - Add error handling
  - Add transaction logic
  - Test with sample data

- [ ] **Test RPC locally** (30 min)
  - Run migration
  - Test with Supabase SQL editor
  - Test success case (all new entities)
  - Test reuse case (existing owner)
  - Test partial reuse (existing owner, new tenant)
  - Test error case (invalid data)

- [ ] **Document RPC function** (30 min)
  - Update: `docs/CONTRACT_MANAGEMENT_TECH_SPEC.md`
  - Add usage examples
  - Add error codes

### Files to Create

```
supabase/migrations/20251121_contract_atomic_transaction.sql
```

### Files to Modify

```
docs/CONTRACT_MANAGEMENT_TECH_SPEC.md
```

### RPC Function Code

```sql
-- File: supabase/migrations/20251121_contract_atomic_transaction.sql

CREATE OR REPLACE FUNCTION create_contract_atomic(
  owner_data jsonb,
  tenant_data jsonb,
  property_data jsonb,
  contract_data jsonb,
  contract_details_data jsonb,
  user_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  tenant_id uuid;
  property_id uuid;
  contract_id uuid;
  contract_details_id uuid;
  result jsonb;
  owner_created boolean := false;
  tenant_created boolean := false;
  property_created boolean := false;
BEGIN
  -- Security check
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  -- Validate required fields
  IF owner_data->>'name' IS NULL OR owner_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Owner data incomplete';
  END IF;

  IF tenant_data->>'name' IS NULL OR tenant_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Tenant data incomplete';
  END IF;

  IF property_data->>'normalized_address' IS NULL THEN
    RAISE EXCEPTION 'Property data incomplete';
  END IF;

  -- 1. Get or create owner
  SELECT id INTO owner_id
  FROM property_owners
  WHERE tc_hash = owner_data->>'tc_hash'
    AND user_id = user_id_param
  LIMIT 1;

  IF owner_id IS NULL THEN
    INSERT INTO property_owners (
      user_id,
      name,
      tc_encrypted,
      tc_hash,
      iban_encrypted,
      phone,
      email
    )
    VALUES (
      user_id_param,
      owner_data->>'name',
      owner_data->>'tc_encrypted',
      owner_data->>'tc_hash',
      owner_data->>'iban_encrypted',
      owner_data->>'phone',
      owner_data->>'email'
    )
    RETURNING id INTO owner_id;

    owner_created := true;
  ELSE
    -- Update owner data if exists (phone/email may have changed)
    UPDATE property_owners
    SET
      phone = owner_data->>'phone',
      email = owner_data->>'email',
      iban_encrypted = owner_data->>'iban_encrypted',
      updated_at = now()
    WHERE id = owner_id;
  END IF;

  -- 2. Get or create tenant
  SELECT id INTO tenant_id
  FROM tenants
  WHERE tc_hash = tenant_data->>'tc_hash'
    AND user_id = user_id_param
  LIMIT 1;

  IF tenant_id IS NULL THEN
    INSERT INTO tenants (
      user_id,
      name,
      tc_encrypted,
      tc_hash,
      phone,
      email,
      address
    )
    VALUES (
      user_id_param,
      tenant_data->>'name',
      tenant_data->>'tc_encrypted',
      tenant_data->>'tc_hash',
      tenant_data->>'phone',
      tenant_data->>'email',
      tenant_data->>'address'
    )
    RETURNING id INTO tenant_id;

    tenant_created := true;
  ELSE
    -- Update tenant data if exists
    UPDATE tenants
    SET
      address = tenant_data->>'address',
      phone = tenant_data->>'phone',
      email = tenant_data->>'email',
      updated_at = now()
    WHERE id = tenant_id;
  END IF;

  -- 3. Get or create property
  SELECT id INTO property_id
  FROM properties
  WHERE normalized_address = property_data->>'normalized_address'
    AND owner_id = owner_id
    AND user_id = user_id_param
  LIMIT 1;

  IF property_id IS NULL THEN
    INSERT INTO properties (
      user_id,
      owner_id,
      mahalle,
      cadde_sokak,
      bina_no,
      daire_no,
      ilce,
      il,
      full_address,
      normalized_address,
      type,
      use_purpose,
      address,
      status
    )
    VALUES (
      user_id_param,
      owner_id,
      property_data->>'mahalle',
      property_data->>'cadde_sokak',
      property_data->>'bina_no',
      property_data->>'daire_no',
      property_data->>'ilce',
      property_data->>'il',
      property_data->>'full_address',
      property_data->>'normalized_address',
      COALESCE(property_data->>'type', 'apartment'),
      property_data->>'use_purpose',
      property_data->>'full_address',
      'Occupied'
    )
    RETURNING id INTO property_id;

    property_created := true;
  ELSE
    -- Update property status to Occupied
    UPDATE properties
    SET
      status = 'Occupied',
      updated_at = now()
    WHERE id = property_id;
  END IF;

  -- 4. Create contract (always new)
  INSERT INTO contracts (
    user_id,
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    deposit,
    status
  )
  VALUES (
    user_id_param,
    tenant_id,
    property_id,
    (contract_data->>'start_date')::date,
    (contract_data->>'end_date')::date,
    (contract_data->>'rent_amount')::numeric,
    (contract_data->>'deposit')::numeric,
    'active'
  )
  RETURNING id INTO contract_id;

  -- 5. Create contract details (if provided)
  IF contract_details_data IS NOT NULL THEN
    INSERT INTO contract_details (
      contract_id,
      user_id,
      payment_day_of_month,
      payment_method,
      annual_rent,
      rent_increase_rate,
      deposit_currency,
      special_conditions,
      furniture_list
    )
    VALUES (
      contract_id,
      user_id_param,
      (contract_details_data->>'payment_day_of_month')::integer,
      contract_details_data->>'payment_method',
      (contract_details_data->>'annual_rent')::numeric,
      (contract_details_data->>'rent_increase_rate')::numeric,
      COALESCE(contract_details_data->>'deposit_currency', 'TRY'),
      contract_details_data->>'special_conditions',
      CASE
        WHEN contract_details_data->>'furniture_list' IS NOT NULL
        THEN ARRAY(SELECT jsonb_array_elements_text(contract_details_data->'furniture_list'))
        ELSE NULL
      END
    )
    RETURNING id INTO contract_details_id;
  END IF;

  -- Return all IDs and creation flags
  result := jsonb_build_object(
    'success', true,
    'owner_id', owner_id,
    'tenant_id', tenant_id,
    'property_id', property_id,
    'contract_id', contract_id,
    'contract_details_id', contract_details_id,
    'created_owner', owner_created,
    'created_tenant', tenant_created,
    'created_property', property_created,
    'message', 'Contract created successfully'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Any error triggers automatic ROLLBACK
    RAISE EXCEPTION 'Contract creation failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_contract_atomic TO authenticated;
```

### Testing Checklist

- [ ] RPC function created
- [ ] Can call from SQL editor
- [ ] All new entities: creates 3 records + contract
- [ ] Existing owner: reuses owner, creates rest
- [ ] Existing tenant: reuses tenant, creates rest
- [ ] Error handling works (rollback on failure)
- [ ] Returns correct creation flags

### Git Commit

```bash
git add supabase/migrations/20251121_contract_atomic_transaction.sql
git commit -m "feat(contracts): add atomic transaction RPC function

- Create create_contract_atomic PostgreSQL function
- Implement get-or-create logic for owner/tenant/property
- Add automatic rollback on errors
- Return creation flags for UI feedback
- Add SECURITY DEFINER for RLS bypass

Part of Contract Management V2 (Atomic Transaction)"
```

---

## V2.2 Service Layer Integration (2 hours)

### Tasks

- [ ] **Create contract creation service** (1.5 hours)
  - File: `src/services/contractCreation.service.ts`
  - Implement `createContractWithEntities()` function
  - Prepare data for RPC call
  - Handle encryption
  - Handle normalization
  - Error handling

- [ ] **Export from service proxy** (15 min)
  - Update: `src/lib/serviceProxy.ts`
  - Export contractCreation service

- [ ] **Add TypeScript types** (15 min)
  - File: `src/types/contract.types.ts`
  - Add ContractCreationResult type
  - Add RPC response type

### Files to Create

```
src/services/contractCreation.service.ts
```

### Files to Modify

```
src/lib/serviceProxy.ts
src/types/contract.types.ts
```

### Service Code

```typescript
// File: src/services/contractCreation.service.ts

import { supabase } from '@/config/supabase';
import { encrypt, hashTC } from './encryption.service';
import { normalizePhone } from './phone.service';
import { normalizeAddress, generateFullAddress } from './address.service';
import type { ContractFormData } from '@/features/contracts/schemas/contractForm.schema';

export interface ContractCreationResult {
  success: boolean;
  owner_id: string;
  tenant_id: string;
  property_id: string;
  contract_id: string;
  contract_details_id?: string;
  created_owner: boolean;
  created_tenant: boolean;
  created_property: boolean;
  message: string;
}

/**
 * Create contract with automatic entity creation
 * Uses atomic PostgreSQL transaction via RPC
 */
export async function createContractWithEntities(
  formData: ContractFormData,
  userId: string
): Promise<ContractCreationResult> {
  try {
    // Prepare owner data
    const ownerData = {
      name: formData.owner_name,
      tc_encrypted: await encrypt(formData.owner_tc),
      tc_hash: await hashTC(formData.owner_tc),
      iban_encrypted: await encrypt(formData.owner_iban),
      phone: normalizePhone(formData.owner_phone),
      email: formData.owner_email || null
    };

    // Prepare tenant data
    const tenantData = {
      name: formData.tenant_name,
      tc_encrypted: await encrypt(formData.tenant_tc),
      tc_hash: await hashTC(formData.tenant_tc),
      phone: normalizePhone(formData.tenant_phone),
      email: formData.tenant_email || null,
      address: formData.tenant_address
    };

    // Prepare property data
    const addressComponents = {
      mahalle: formData.mahalle,
      cadde_sokak: formData.cadde_sokak,
      bina_no: formData.bina_no,
      daire_no: formData.daire_no,
      ilce: formData.ilce,
      il: formData.il
    };

    const fullAddress = generateFullAddress(addressComponents);
    const normalizedAddressStr = normalizeAddress(addressComponents);

    const propertyData = {
      mahalle: formData.mahalle,
      cadde_sokak: formData.cadde_sokak,
      bina_no: formData.bina_no,
      daire_no: formData.daire_no || null,
      ilce: formData.ilce,
      il: formData.il,
      full_address: fullAddress,
      normalized_address: normalizedAddressStr,
      type: formData.property_type,
      use_purpose: formData.use_purpose || null
    };

    // Prepare contract data
    const contractData = {
      start_date: formData.start_date.toISOString().split('T')[0],
      end_date: formData.end_date.toISOString().split('T')[0],
      rent_amount: formData.rent_amount,
      deposit: formData.deposit
    };

    // Prepare contract details (optional)
    const contractDetailsData = formData.payment_day_of_month
      ? {
          payment_day_of_month: formData.payment_day_of_month,
          payment_method: formData.payment_method || null,
          annual_rent: formData.rent_amount * 12,
          rent_increase_rate: null, // TODO: Add to form if needed
          deposit_currency: 'TRY',
          special_conditions: formData.special_conditions || null,
          furniture_list: null // TODO: Add to form if needed
        }
      : null;

    // Call RPC function (atomic transaction)
    const { data, error } = await supabase.rpc('create_contract_atomic', {
      owner_data: ownerData,
      tenant_data: tenantData,
      property_data: propertyData,
      contract_data: contractData,
      contract_details_data: contractDetailsData,
      user_id_param: userId
    });

    if (error) {
      console.error('RPC error:', error);
      throw new Error(`Contract creation failed: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Contract creation failed: No data returned');
    }

    return data as ContractCreationResult;
  } catch (error) {
    console.error('Contract creation error:', error);
    throw error;
  }
}

/**
 * Get contract with full details
 */
export async function getContractWithDetails(contractId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      tenant:tenants(*),
      property:properties(
        *,
        owner:property_owners(*)
      ),
      details:contract_details(*)
    `)
    .eq('id', contractId)
    .single();

  if (error) throw error;
  return data;
}
```

### Type Definitions

```typescript
// File: src/types/contract.types.ts (add to existing)

export interface ContractCreationResult {
  success: boolean;
  owner_id: string;
  tenant_id: string;
  property_id: string;
  contract_id: string;
  contract_details_id?: string;
  created_owner: boolean;
  created_tenant: boolean;
  created_property: boolean;
  message: string;
}

export interface ContractWithDetails {
  id: string;
  tenant: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  property: {
    id: string;
    full_address: string;
    owner: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit: number;
  status: string;
  details?: {
    payment_day_of_month?: number;
    payment_method?: string;
    special_conditions?: string;
  };
}
```

### Testing Checklist

- [ ] Service compiles without errors
- [ ] Can import from serviceProxy
- [ ] Encryption called correctly
- [ ] Normalization called correctly
- [ ] RPC receives correct data format

### Git Commit

```bash
git add src/services/contractCreation.service.ts
git add src/types/contract.types.ts
git add src/lib/serviceProxy.ts
git commit -m "feat(contracts): add contract creation service layer

- Implement createContractWithEntities service
- Prepare data for RPC call with encryption/normalization
- Add getContractWithDetails query
- Add TypeScript types for RPC responses

Part of Contract Management V2 (Atomic Transaction)"
```

---

## V2.3 Form Integration (1.5 hours)

### Tasks

- [ ] **Hook up form to service** (45 min)
  - Update: `src/features/contracts/components/ContractCreateForm.tsx`
  - Add onSubmit handler
  - Call createContractWithEntities
  - Add loading state
  - Add error handling

- [ ] **Add success feedback** (30 min)
  - Show toast with creation summary
  - "✓ Yeni ev sahibi oluşturuldu"
  - "✓ Yeni kiracı oluşturuldu"
  - "✓ Yeni mülk oluşturuldu"
  - "✓ Sözleşme oluşturuldu"
  - Navigate to contract detail page

- [ ] **Add route for contract creation** (15 min)
  - Update: `src/App.tsx`
  - Add `/contracts/create` route
  - Add navigation from contracts list

### Files to Modify

```
src/features/contracts/components/ContractCreateForm.tsx
src/App.tsx
```

### Form Integration Code

```typescript
// File: src/features/contracts/components/ContractCreateForm.tsx (add to existing)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createContractWithEntities } from '@/lib/serviceProxy';
import { contractFormSchema, type ContractFormData } from '../schemas/contractForm.schema';

export function ContractCreateForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      // ... default values
    }
  });

  const onSubmit = async (formData: ContractFormData) => {
    if (!user?.id) {
      toast.error('Kullanıcı oturumu bulunamadı');
      return;
    }

    setIsSubmitting(true);

    try {
      toast.info('Sözleşme oluşturuluyor...');

      const result = await createContractWithEntities(formData, user.id);

      // Build success message
      const messages: string[] = [];
      if (result.created_owner) {
        messages.push('✓ Yeni ev sahibi oluşturuldu');
      }
      if (result.created_tenant) {
        messages.push('✓ Yeni kiracı oluşturuldu');
      }
      if (result.created_property) {
        messages.push('✓ Yeni mülk oluşturuldu');
      }
      messages.push('✓ Sözleşme oluşturuldu');

      toast.success(messages.join('\n'), {
        duration: 5000
      });

      // Navigate to contract detail (or contracts list)
      navigate(`/contracts`);

    } catch (error) {
      console.error('Contract creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Sözleşme oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... form fields ... */}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Oluşturuluyor...' : 'Sözleşme Oluştur'}
      </Button>
    </form>
  );
}
```

### Testing Checklist

- [ ] Form submits successfully
- [ ] Loading state shows during submission
- [ ] Success toast shows with correct flags
- [ ] Navigates after success
- [ ] Error toast shows on failure
- [ ] Can create contract with all new entities
- [ ] Can create contract with existing owner

### Git Commit

```bash
git add src/features/contracts/components/ContractCreateForm.tsx
git add src/App.tsx
git commit -m "feat(contracts): integrate form with auto-creation service

- Hook up form submit to createContractWithEntities
- Add loading states and error handling
- Show success feedback with creation flags
- Navigate to contracts list after creation
- Add /contracts/create route

Part of Contract Management V2 (Atomic Transaction)"
```

---

## V2 Testing & Validation

### End-to-End Testing Checklist

- [ ] **Happy Path: All New**
  - [ ] Fill form with new owner/tenant/property
  - [ ] Submit form
  - [ ] See 4 success messages (owner, tenant, property, contract)
  - [ ] Check database: 4 new records created
  - [ ] Check encryption: TC and IBAN encrypted

- [ ] **Reuse Owner**
  - [ ] Create first contract (owner: Ali Yılmaz, TC: 12345678901)
  - [ ] Create second contract (same owner TC, different property/tenant)
  - [ ] See 3 success messages (tenant, property, contract)
  - [ ] Check database: owner reused, 3 new records

- [ ] **Reuse Tenant**
  - [ ] Create first contract
  - [ ] Create second contract (same tenant TC, different owner/property)
  - [ ] See 3 success messages (owner, property, contract)

- [ ] **Reuse Property**
  - [ ] Create first contract
  - [ ] Try creating second contract (same address, same owner, different tenant)
  - [ ] Property reused, property status updated to "Occupied"

- [ ] **Error Handling**
  - [ ] Submit with invalid TC → validation error
  - [ ] Submit with end_date < start_date → validation error
  - [ ] Database failure → rollback (no partial records)

### Performance Testing

- [ ] Form submits in < 2 seconds
- [ ] No console errors
- [ ] No network errors
- [ ] Encryption doesn't slow down submission

---

## V2 Git Workflow

### Final V2 Commit

```bash
git status
git tag -a v2-atomic-transaction -m "Contract Management V2: Atomic Transaction

- PostgreSQL RPC function for atomic creation
- Smart get-or-create logic
- Service layer integration
- Form connected to auto-creation
- Success feedback with flags

Total time: 7 hours
Status: Ready for V3 polish"

git push origin main --tags
```

---

## V2 Rollback Plan

### If V2 Fails

**Symptoms:**
- RPC function errors
- Contract not created
- Partial records left in database
- Encryption errors

**Rollback Steps:**

```bash
# 1. Revert to V1
git reset --hard v1-foundation

# 2. Drop RPC function
supabase db reset

# 3. Verify V1 still works
npm run dev
# Test form (won't create, but should validate)
```

**Database Cleanup:**

```sql
-- Remove RPC function
DROP FUNCTION IF EXISTS create_contract_atomic;

-- Clean up test data
DELETE FROM contracts WHERE created_at > '2025-11-20';
DELETE FROM contract_details WHERE created_at > '2025-11-20';
```

---

## V2 Deferred to V3

- ❌ Duplicate name warnings
- ❌ Data change confirmations
- ❌ Multiple contracts warnings
- ❌ User confirmation dialogs
- ❌ Performance indexes
- ❌ Advanced error messages

---

## V2 Success Criteria

✅ RPC function created and tested
✅ Service layer working
✅ Form creates contract with all new entities
✅ Form reuses existing owner/tenant/property
✅ Success feedback shows creation flags
✅ No partial records on error
✅ Property status updates to "Occupied"
✅ Build succeeds without errors

**When all checkboxes above are complete, V2 is DONE. Proceed to V3.**

---

# VERSION 3: POLISH & SAFETY

**Time Estimate:** 6 hours
**Goal:** Add duplicate detection, user confirmations, and performance indexes
**Status:** Blocked until V2 complete

---

## V3 Objectives

- ✅ Add duplicate detection service
- ✅ Add user confirmation dialogs
- ✅ Add database performance indexes
- ✅ Add loading states and polish
- ✅ Production-ready

---

## V3.1 Duplicate Detection Service (2 hours)

### Tasks

- [ ] **Create duplicate check service** (1.5 hours)
  - File: `src/services/duplicateCheck.service.ts`
  - Implement `checkDuplicateName()`
  - Implement `checkDataChanges()`
  - Implement `checkMultipleContracts()`
  - Add TypeScript types

- [ ] **Export from service proxy** (15 min)
  - Update: `src/lib/serviceProxy.ts`

- [ ] **Add translations** (15 min)
  - Update: `public/locales/tr/contracts.json`
  - Add warning messages

### Files to Create

```
src/services/duplicateCheck.service.ts
```

### Files to Modify

```
src/lib/serviceProxy.ts
public/locales/tr/contracts.json
```

### Duplicate Check Service Code

```typescript
// File: src/services/duplicateCheck.service.ts

import { supabase } from '@/config/supabase';

export interface DuplicateNameCheck {
  hasDuplicate: boolean;
  count?: number;
  message?: string;
}

export interface DataChangesCheck {
  hasChanges: boolean;
  changes?: string[];
  message?: string;
  existingData?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

export interface MultipleContractsCheck {
  hasMultiple: boolean;
  count?: number;
  contracts?: Array<{
    id: string;
    property_address: string;
    start_date: string;
    end_date: string;
  }>;
  message?: string;
}

/**
 * Check if same name exists with different TC
 * Warns: "⚠️ Ali Yılmaz ismiyle 2 farklı kişi daha var (farklı TC No)"
 */
export async function checkDuplicateName(
  name: string,
  tcHash: string,
  entityType: 'owner' | 'tenant'
): Promise<DuplicateNameCheck> {
  const table = entityType === 'owner' ? 'property_owners' : 'tenants';

  const { data, error } = await supabase
    .from(table)
    .select('name, tc_hash')
    .ilike('name', name)
    .neq('tc_hash', tcHash);

  if (error) {
    console.error('Duplicate name check failed:', error);
    return { hasDuplicate: false };
  }

  if (data && data.length > 0) {
    return {
      hasDuplicate: true,
      count: data.length,
      message: `⚠️ "${name}" ismiyle ${data.length} farklı kişi daha var sistemde (farklı TC No)`
    };
  }

  return { hasDuplicate: false };
}

/**
 * Check if data changed for existing entity
 * Warns: "⚠️ Sistemdeki bilgiler değişti: Telefon: 5392174782 → 5551234567"
 */
export async function checkDataChanges(
  tcHash: string,
  newData: { phone: string; email?: string; address?: string },
  entityType: 'owner' | 'tenant'
): Promise<DataChangesCheck> {
  const table = entityType === 'owner' ? 'property_owners' : 'tenants';

  const { data: existing, error } = await supabase
    .from(table)
    .select('*')
    .eq('tc_hash', tcHash)
    .single();

  if (error || !existing) {
    return { hasChanges: false };
  }

  const changes: string[] = [];

  if (existing.phone !== newData.phone) {
    changes.push(`Telefon: ${existing.phone} → ${newData.phone}`);
  }

  if (existing.email !== newData.email) {
    changes.push(`Email: ${existing.email || 'yok'} → ${newData.email || 'yok'}`);
  }

  if (entityType === 'tenant' && existing.address !== newData.address) {
    changes.push(`Adres değişti`);
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    existingData: {
      phone: existing.phone,
      email: existing.email,
      address: existing.address
    },
    message: changes.length > 0
      ? `⚠️ Sistemdeki bilgiler değişti:\n${changes.join('\n')}\n\nGüncellensin mi?`
      : undefined
  };
}

/**
 * Check if tenant has multiple active contracts
 * Warns: "⚠️ Bu kiracının 2 aktif sözleşmesi var"
 */
export async function checkMultipleContracts(
  tcHash: string
): Promise<MultipleContractsCheck> {
  // First get tenant by TC hash
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('tc_hash', tcHash)
    .single();

  if (!tenant) {
    return { hasMultiple: false };
  }

  // Then get active contracts
  const { data: activeContracts, error } = await supabase
    .from('contracts')
    .select(`
      id,
      start_date,
      end_date,
      property:properties (
        full_address
      )
    `)
    .eq('tenant_id', tenant.id)
    .eq('status', 'active');

  if (error || !activeContracts || activeContracts.length === 0) {
    return { hasMultiple: false };
  }

  const addresses = activeContracts
    .map(c => c.property?.full_address || 'Bilinmeyen adres')
    .join('\n- ');

  return {
    hasMultiple: activeContracts.length > 0,
    count: activeContracts.length,
    contracts: activeContracts.map(c => ({
      id: c.id,
      property_address: c.property?.full_address || 'Bilinmeyen',
      start_date: c.start_date,
      end_date: c.end_date
    })),
    message: `⚠️ Bu kiracının ${activeContracts.length} aktif sözleşmesi var:\n- ${addresses}\n\nDevam edilsin mi?`
  };
}
```

### Testing Checklist

- [ ] Duplicate name check works
- [ ] Data changes check works
- [ ] Multiple contracts check works
- [ ] All functions handle errors gracefully

### Git Commit

```bash
git add src/services/duplicateCheck.service.ts
git add src/lib/serviceProxy.ts
git commit -m "feat(contracts): add duplicate detection service

- Check for duplicate names with different TC
- Check for data changes on existing entities
- Check for multiple active contracts
- Add warning messages in Turkish

Part of Contract Management V3 (Polish & Safety)"
```

---

## V3.2 User Confirmation Dialogs (2 hours)

### Tasks

- [ ] **Create confirmation dialog component** (45 min)
  - File: `src/features/contracts/components/ConfirmationDialog.tsx`
  - Use AlertDialog from Radix UI
  - Support multi-line messages
  - Confirm/Cancel buttons

- [ ] **Integrate confirmations into form** (1 hour)
  - Update: `src/features/contracts/components/ContractCreateForm.tsx`
  - Add pre-submit checks
  - Show warnings before RPC call
  - Allow user to cancel

- [ ] **Add translations** (15 min)
  - Update: `public/locales/tr/contracts.json`
  - Add confirmation messages

### Files to Create

```
src/features/contracts/components/ConfirmationDialog.tsx
```

### Files to Modify

```
src/features/contracts/components/ContractCreateForm.tsx
public/locales/tr/contracts.json
```

### Confirmation Dialog Code

```typescript
// File: src/features/contracts/components/ConfirmationDialog.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Devam Et',
  cancelText = 'İptal'
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Form Integration with Confirmations

```typescript
// File: src/features/contracts/components/ContractCreateForm.tsx (update onSubmit)

import { useState } from 'react';
import { hashTC } from '@/lib/serviceProxy';
import {
  checkDuplicateName,
  checkDataChanges,
  checkMultipleContracts
} from '@/lib/serviceProxy';
import { ConfirmationDialog } from './ConfirmationDialog';

export function ContractCreateForm() {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirmation = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title,
        message,
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, open: false }));
          resolve(true);
        }
      });
    });
  };

  const onSubmit = async (formData: ContractFormData) => {
    if (!user?.id) return;

    try {
      // Step 1: Check owner duplicates
      toast.info('Ev sahibi kontrol ediliyor...');
      const ownerTcHash = await hashTC(formData.owner_tc);
      const ownerDuplicateCheck = await checkDuplicateName(
        formData.owner_name,
        ownerTcHash,
        'owner'
      );

      if (ownerDuplicateCheck.hasDuplicate) {
        toast.warning(ownerDuplicateCheck.message);
      }

      // Step 2: Check tenant duplicates
      toast.info('Kiracı kontrol ediliyor...');
      const tenantTcHash = await hashTC(formData.tenant_tc);
      const tenantDuplicateCheck = await checkDuplicateName(
        formData.tenant_name,
        tenantTcHash,
        'tenant'
      );

      if (tenantDuplicateCheck.hasDuplicate) {
        toast.warning(tenantDuplicateCheck.message);
      }

      // Step 3: Check data changes for owner
      const ownerChanges = await checkDataChanges(
        ownerTcHash,
        {
          phone: normalizePhone(formData.owner_phone),
          email: formData.owner_email
        },
        'owner'
      );

      if (ownerChanges.hasChanges) {
        const confirmed = await showConfirmation(
          'Ev Sahibi Bilgileri Değişti',
          ownerChanges.message!
        );
        if (!confirmed) return;
      }

      // Step 4: Check data changes for tenant
      const tenantChanges = await checkDataChanges(
        tenantTcHash,
        {
          phone: normalizePhone(formData.tenant_phone),
          email: formData.tenant_email,
          address: formData.tenant_address
        },
        'tenant'
      );

      if (tenantChanges.hasChanges) {
        const confirmed = await showConfirmation(
          'Kiracı Bilgileri Değişti',
          tenantChanges.message!
        );
        if (!confirmed) return;
      }

      // Step 5: Check multiple contracts
      const multipleContracts = await checkMultipleContracts(tenantTcHash);

      if (multipleContracts.hasMultiple) {
        const confirmed = await showConfirmation(
          'Birden Fazla Aktif Sözleşme',
          multipleContracts.message!
        );
        if (!confirmed) return;
      }

      // Step 6: Final confirmation
      const summary = `
Ev Sahibi: ${formData.owner_name}
Kiracı: ${formData.tenant_name}
Mülk: ${formData.mahalle} ${formData.cadde_sokak} No:${formData.bina_no}
Kira: ${formData.rent_amount} TRY/ay
Başlangıç: ${formData.start_date.toLocaleDateString('tr-TR')}
      `;

      const finalConfirm = await showConfirmation(
        'Sözleşme Oluşturulsun mu?',
        summary
      );

      if (!finalConfirm) return;

      // Step 7: Create contract
      setIsSubmitting(true);
      toast.info('Sözleşme oluşturuluyor...');

      const result = await createContractWithEntities(formData, user.id);

      // ... success handling ...

    } catch (error) {
      // ... error handling ...
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* ... form fields ... */}
      </form>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </>
  );
}
```

### Testing Checklist

- [ ] Duplicate name warning shows
- [ ] Data change confirmation shows
- [ ] Multiple contracts warning shows
- [ ] User can cancel at each step
- [ ] User can continue after warnings
- [ ] Final summary confirmation works

### Git Commit

```bash
git add src/features/contracts/components/
git add public/locales/
git commit -m "feat(contracts): add user confirmation dialogs

- Create confirmation dialog component
- Integrate duplicate detection into form flow
- Show warnings before contract creation
- Allow user to cancel at each step
- Add final confirmation with summary

Part of Contract Management V3 (Polish & Safety)"
```

---

## V3.3 Performance Indexes (1 hour)

### Tasks

- [ ] **Create performance indexes migration** (45 min)
  - File: `supabase/migrations/20251122_performance_indexes.sql`
  - Add all critical indexes
  - Add compound indexes where needed
  - Test performance improvement

- [ ] **Document index strategy** (15 min)
  - Update: `docs/CONTRACT_MANAGEMENT_TECH_SPEC.md`
  - Add performance benchmarks

### Files to Create

```
supabase/migrations/20251122_performance_indexes.sql
```

### Files to Modify

```
docs/CONTRACT_MANAGEMENT_TECH_SPEC.md
```

### Performance Indexes Migration

```sql
-- File: supabase/migrations/20251122_performance_indexes.sql

-- Property Owners Indexes
CREATE INDEX IF NOT EXISTS idx_owners_phone ON property_owners(phone);
CREATE INDEX IF NOT EXISTS idx_owners_user_id ON property_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_owners_name_gin ON property_owners USING gin(to_tsvector('turkish', name));

-- Tenants Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON tenants(phone);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_name_gin ON tenants USING gin(to_tsvector('turkish', name));

-- Properties Indexes
CREATE INDEX IF NOT EXISTS idx_properties_normalized_address ON properties(normalized_address);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Contracts Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);

-- Contract Details Indexes
CREATE INDEX IF NOT EXISTS idx_contract_details_contract_id ON contract_details(contract_id);

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contracts_user_status ON contracts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_user_status ON properties(user_id, status);

-- Performance optimization: ANALYZE tables
ANALYZE property_owners;
ANALYZE tenants;
ANALYZE properties;
ANALYZE contracts;
ANALYZE contract_details;
```

### Testing Checklist

- [ ] Indexes created successfully
- [ ] Query performance improved
- [ ] No duplicate indexes
- [ ] ANALYZE completed

### Git Commit

```bash
git add supabase/migrations/20251122_performance_indexes.sql
git commit -m "feat(contracts): add performance indexes

- Add indexes on foreign keys
- Add indexes on search fields (phone, name)
- Add GIN indexes for full-text search
- Add compound indexes for common queries
- Run ANALYZE for query optimization

Part of Contract Management V3 (Polish & Safety)"
```

---

## V3.4 Final Polish (1 hour)

### Tasks

- [ ] **Add loading states** (20 min)
  - Spinner during checks
  - Disabled buttons during submission
  - Progress indicators

- [ ] **Error handling improvements** (20 min)
  - Better error messages
  - Retry logic
  - Network error handling

- [ ] **UI polish** (20 min)
  - Form layout improvements
  - Better spacing
  - Accessibility improvements
  - Mobile responsiveness

### Files to Modify

```
src/features/contracts/components/ContractCreateForm.tsx
```

### Testing Checklist

- [ ] Loading states show correctly
- [ ] Buttons disabled during submission
- [ ] Error messages clear and helpful
- [ ] Form responsive on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

### Git Commit

```bash
git add src/features/contracts/components/
git commit -m "feat(contracts): final UI polish and error handling

- Add loading states and spinners
- Improve error messages
- Add retry logic for network errors
- Improve form layout and spacing
- Add accessibility improvements
- Ensure mobile responsiveness

Part of Contract Management V3 (Polish & Safety)"
```

---

## V3 Testing & Validation

### End-to-End Testing Checklist

- [ ] **Full Flow with Warnings**
  - [ ] Fill form with duplicate name → see warning
  - [ ] Continue → see data change confirmation
  - [ ] Continue → see final confirmation
  - [ ] Confirm → contract created

- [ ] **Cancel at Each Step**
  - [ ] Cancel at duplicate warning
  - [ ] Cancel at data change confirmation
  - [ ] Cancel at final confirmation
  - [ ] Verify no records created

- [ ] **Performance**
  - [ ] Form submission < 2 seconds
  - [ ] Duplicate checks < 500ms
  - [ ] No UI lag during checks

- [ ] **Error Handling**
  - [ ] Network error → clear error message
  - [ ] Database error → rollback successful
  - [ ] Validation error → helpful message

---

## V3 Git Workflow

### Final V3 Commit

```bash
git status
git tag -a v3-production-ready -m "Contract Management V3: Production Ready

- Duplicate detection service
- User confirmation dialogs
- Performance indexes
- Loading states and polish
- Error handling improvements

Total time: 6 hours
Status: PRODUCTION READY ✅"

git push origin main --tags
```

---

## V3 Rollback Plan

### If V3 Fails

**Symptoms:**
- Confirmations not showing
- Performance issues
- Index errors

**Rollback Steps:**

```bash
# Revert to V2
git reset --hard v2-atomic-transaction

# Remove performance indexes if causing issues
DROP INDEX IF EXISTS idx_owners_name_gin;
# ... etc
```

---

## V3 Success Criteria

✅ Duplicate detection working
✅ User confirmations showing
✅ Performance indexes created
✅ Loading states polished
✅ Error handling complete
✅ Build succeeds without errors
✅ All tests passing
✅ Production ready

**When all checkboxes above are complete, V3 is DONE. Feature is COMPLETE.**

---

# OVERALL PROJECT SUCCESS CRITERIA

## All 3 Versions Complete

✅ **V1: Foundation**
- Database schema
- Encryption services
- Form UI

✅ **V2: Atomic Transaction**
- RPC function
- Auto-creation logic
- Service integration

✅ **V3: Polish & Safety**
- Duplicate detection
- User confirmations
- Performance indexes

## Final Testing Checklist

- [ ] Can create contract with all new entities
- [ ] Can create contract with existing owner
- [ ] Can create contract with existing tenant
- [ ] Can create contract with existing property
- [ ] Warnings show for duplicates
- [ ] Confirmations work at each step
- [ ] Performance acceptable (< 2s)
- [ ] Mobile responsive
- [ ] Translations complete (TR/EN)
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] No console errors

## Deployment Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Encryption key generated
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Backup taken
- [ ] Rollback plan documented

---

# APPENDIX

## Time Tracking

| Version | Estimated | Actual | Status |
|---------|-----------|--------|--------|
| V1      | 8h        | __h    | ⬜ Not started |
| V2      | 7h        | __h    | ⬜ Not started |
| V3      | 6h        | __h    | ⬜ Not started |
| **Total** | **21h** | **__h** | |

## Common Issues & Solutions

### Issue: Encryption key not found
**Solution:** Add `VITE_ENCRYPTION_KEY` to `.env`

### Issue: RPC function not found
**Solution:** Run `supabase db reset` to apply migrations

### Issue: TypeScript errors after migration
**Solution:** Regenerate types with `npx supabase gen types`

### Issue: Slow form submission
**Solution:** Check if indexes created, run `ANALYZE` on tables

---

**END OF IMPLEMENTATION PLAN**

Total Pages: 50+
Total Checkboxes: 200+
Total Commits: 15+
Total Files: 30+

Ready to start with Version 1!
