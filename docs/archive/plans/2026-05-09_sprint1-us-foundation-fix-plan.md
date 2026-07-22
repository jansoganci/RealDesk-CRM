# Sprint 1 — US Foundation: Gap Analysis & Implementation Plan

> **Source:** `docs/sprint-audits.md` → Sprint 1
> **Project Root:** `/Users/jans/Projelerim/RealDesk-CRM/`
> **Status:** Analysis complete, ready for implementation

## Özet (Türkçe)

Sprint 1'in kalan 6 eksiği var. Aşağıda her biri için hangi dosyada ne değişeceği adım adım yazılı. Cursor'a her task'ı tek tek vererek implement edebilirsin.

---

## Task 1: US Address Fields in PropertyDialog

### Problem
`src/features/properties/components/PropertyFormFields.tsx` still uses old Turkish-style fields:
- `address` (textarea), `city`, `district`
- DB has `street_address, city, state, zip_code, mls_id, year_built` but UI can't reach them

### Files

#### 1a. `src/features/properties/propertySchemas.ts`

**Replace lines 4-15** (basePropertySchema):
```typescript
const basePropertySchema = (t: (key: string, options?: any) => string) =>
  z.object({
    owner_id: z.string().min(1, t('validations.ownerRequired')),
    street_address: z.string().min(1, t('validations.addressRequired')),
    city: z.string().min(1, t('validations.cityRequired')),
    state: z
      .string()
      .length(2, t('validations.invalidState')),
    zip_code: z
      .string()
      .regex(/^\d{5}(-\d{4})?$/, t('validations.invalidZip')),
    mls_id: z.string().optional(),
    year_built: z
      .number()
      .int()
      .min(1600)
      .max(new Date().getFullYear() + 1)
      .optional()
      .nullable(),
    notes: z.string().optional(),
    listing_url: z
      .union([z.string().url(t('validations.invalidUrl')), z.literal('')])
      .optional()
      .nullable(),
  });
```

**Also update `getRentalInquirySchema` and `getSaleInquirySchema`** at the bottom of the file (lines 65-98) — same change: replace `preferred_city/preferred_district` with `preferred_state` (see Task 4 for full details).

#### 1b. `src/features/properties/components/PropertyFormFields.tsx`

**Replace lines 50-86** (Address + City/District section):
```tsx
{/* Street Address */}
<div className="space-y-2">
  <Label htmlFor="street_address">{t('dialog.form.streetAddress')} *</Label>
  <Input
    id="street_address"
    placeholder={t('dialog.form.streetAddressPlaceholder')}
    {...register('street_address')}
    disabled={loading}
  />
  {errors.street_address && (
    <p className={`text-sm ${COLORS.danger.text}`}>{errors.street_address.message as string}</p>
  )}
</div>

{/* City and State */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="city">{t('dialog.form.city')} *</Label>
    <Input
      id="city"
      placeholder={t('dialog.form.cityPlaceholder')}
      {...register('city')}
      disabled={loading}
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="state">{t('dialog.form.state')} *</Label>
    <Select
      value={watch('state')}
      onValueChange={(value) => setValue('state', value)}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('dialog.form.statePlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {US_STATE_CODES.map((state) => (
          <SelectItem key={state} value={state}>{state}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>

{/* Zip Code and MLS ID */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="zip_code">{t('dialog.form.zipCode')} *</Label>
    <Input
      id="zip_code"
      placeholder={t('dialog.form.zipCodePlaceholder')}
      {...register('zip_code')}
      disabled={loading}
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="mls_id">{t('dialog.form.mlsId')}</Label>
    <Input
      id="mls_id"
      placeholder={t('dialog.form.mlsIdPlaceholder')}
      {...register('mls_id')}
      disabled={loading}
    />
  </div>
</div>

{/* Year Built */}
<div className="space-y-2">
  <Label htmlFor="year_built">{t('dialog.form.yearBuilt')}</Label>
  <Input
    id="year_built"
    type="number"
    placeholder={t('dialog.form.yearBuiltPlaceholder')}
    {...register('year_built', { valueAsNumber: true })}
    disabled={loading}
  />
</div>
```

Note: Import `US_STATE_CODES` from constants/config file, or define inline.

**Also remove `district` field references** — they no longer exist in the schema.

**Also update currency section** (lines 161-216) — see Task 2.

#### 1c. `src/features/quick-add/quickAddSchema.ts`

Replace lines 14-16 with same US address fields as propertySchemas:
```typescript
address: z.string().min(3, ...),       // Keep as single line for quick-add simplicity
city: z.string().optional(),
state: z.string().length(2).optional(),  // Add state
zip_code: z.string().optional(),          // Add zip
// Remove district
```

#### 1d. `public/locales/en/properties.json`

Add these keys:
```json
{
  "dialog": {
    "form": {
      "streetAddress": "Street Address",
      "streetAddressPlaceholder": "123 Main St",
      "state": "State",
      "statePlaceholder": "Select state",
      "zipCode": "ZIP Code",
      "zipCodePlaceholder": "78701",
      "mlsId": "MLS ID",
      "mlsIdPlaceholder": "MLS# (optional)",
      "yearBuilt": "Year Built",
      "yearBuiltPlaceholder": "e.g. 2005"
    }
  },
  "validations": {
    "cityRequired": "City is required",
    "invalidState": "Please select a valid US state",
    "invalidZip": "Please enter a valid ZIP code (e.g., 78701 or 78701-1234)"
  }
}
```

---

## Task 2: Remove TRY Currency (USD-only)

### 2a. `src/features/properties/propertySchemas.ts`
- Line 23: `currency: z.enum(['USD', 'TRY'])` → `currency: z.literal('USD').default('USD')`
- Line 33: same
- Line 53: `currency: z.enum(['USD', 'TRY']).optional().nullable()` → `currency: z.literal('USD').default('USD').optional()`

### 2b. `src/features/properties/components/PropertyFormFields.tsx`
- Lines 161-179: Remove the entire currency Select block in the rental section
- Lines 198-216: Remove the entire currency Select block in the sale section
- Remove `const selectedCurrency = watch('currency');` on line 46
- Remove `selectedCurrency || ''` usage

### 2c. `src/features/properties/MarkAsSoldDialog.tsx`
- Line 154: Remove `<SelectItem value="TRY">TRY (₺)</SelectItem>`
- Line ~151: Change `z.enum(['USD', 'TRY'])` in the schema to `z.literal('USD')`

### 2d. `src/features/contracts/schemas/contractForm.schema.ts`
- Line 151: `z.enum(['USD', 'EUR', 'TRY'])` → `z.literal('USD')`

### 2e. `src/features/contractsSale/schemas/saleContractForm.schema.ts`
- Line 38: `z.enum(['TRY', 'USD', 'EUR']).default('TRY')` → `z.literal('USD').default('USD')`

### 2f. `src/features/quick-add/quickAddSchema.ts`
- Line 23: `z.enum(['TRY', 'USD', 'EUR'])` → `z.literal('USD')`
- Line 37: `z.enum(['TRY', 'USD', 'EUR'])` → `z.literal('USD')`

### 2g. `src/features/properties/hooks/usePropertyFormInitialization.ts`
- Lines 44, 57: Remove `as 'USD' | 'TRY'` cast, default to `'USD'`

### 2h. `src/features/quick-add/sections/TenantSection.tsx`
- Line 253: Remove `<SelectItem value="TRY">{t('currencies.TRY')}</SelectItem>`

### 2i. `src/services/finance/exchangeRates.service.ts`
This file is already commented as "V1: Disabled" at the top. **Verify it's not imported** by grepping:
```
grep -rn "exchangeRates" src/ --include="*.ts" --include="*.tsx" | grep -v "exchangeRates.service.ts"
```
If no results → no code change needed (preserved for V1.5).

### 2j. Also check `src/hooks/useCurrencyConversion.ts` and `src/lib/currency.ts` and `src/utils/currency.ts`
Search for TRY in these and update to USD-only.

---

## Task 3: Gate numberToTurkishText() for Legacy Contracts

### File: `src/features/contracts/hooks/useContractPdfHandler.ts`

**Changes needed:**

1. Line 14: Change import:
```typescript
// Remove: import { numberToTurkishText } from '@/lib/numberToText';
// Remove: import { tr } from 'date-fns/locale';
import { numberToTurkishText, numberToEnglishText } from '@/lib/numberToText';
import { tr, enUS } from 'date-fns/locale';
```

2. Lines 95-97 (preparePdfData function):
```typescript
// Current:
monthlyRentText: numberToTurkishText(monthlyRent),
yearlyRentText: numberToTurkishText(yearlyRent),

// Change to conditional:
const isLegacy = !formData.state || formData.state.length !== 2; // heuristic
monthlyRentText: isLegacy ? numberToTurkishText(monthlyRent) : numberToEnglishText(monthlyRent),
yearlyRentText: isLegacy ? numberToTurkishText(yearlyRent) : numberToEnglishText(yearlyRent),
```

3. Lines 100-101 (date formatting):
```typescript
// Current:
startDate: format(new Date(formData.start_date), 'dd MMMM yyyy', { locale: tr }),

// Change to:
startDate: format(new Date(formData.start_date), 'MMMM dd, yyyy', { locale: isLegacy ? tr : enUS }),
```

4. Line 145, 168: File name:
```typescript
// Current:
const fileName = `Kira_Sozlesmesi_${contractId.slice(0, 8)}.pdf`;

// Change to:
const fileName = isLegacy
  ? `Kira_Sozlesmesi_${contractId.slice(0, 8)}.pdf`
  : `Lease_Agreement_${contractId.slice(0, 8)}.pdf`;
```

5. Also add `numberToEnglishText()` function to `src/lib/numberToText.ts`:
```typescript
export function numberToEnglishText(n: number): string {
  // Simple implementation or use a library
  // For MVP: return n.toLocaleString('en-US') as a fallback
  // Better: use a number-to-words library
  return n.toLocaleString('en-US');
}
```

---

## Task 4: preferred_city/preferred_district → preferred_state

### 4a. `src/features/inquiries/inquirySchema.ts`

**Lines 9-25** (baseInquirySchema parameter + fields):
```typescript
// Current: (t: (key: string, options?: any) => string)
// Keep the : any for now (see Task 5)

// Lines 22-23: Replace:
preferred_city: z.string().optional(),
preferred_district: z.string().optional(),

// With:
preferred_state: z.string().length(2).optional(),
preferred_city: z.string().optional(),
```

### 4b. `src/features/inquiries/InquiryDialog.tsx`
Search for `preferred_city` and `preferred_district` in the JSX. Replace city/district fields with a state selector. The existing budget fields stay as-is.

### 4c. `src/features/properties/propertySchemas.ts` (inquiry schemas at bottom)
Lines 65-98 — `getRentalInquirySchema` and `getSaleInquirySchema` also use the old preferred_city/preferred_district fields (they extend/use baseInquirySchema-like patterns). Same fix.

---

## Task 5: Fix `: any` TypeScript Violations

### 5a. `src/features/inquiries/InquiryDialog.tsx`
Replace all `as any` patterns:

```typescript
// Pattern: register('field' as any, { valueAsNumber: true })
// → Fix: remove 'as any', react-hook-form supports it with proper typing
{...register('min_rent_budget', { valueAsNumber: true })}

// Pattern: (errors as any).min_rent_budget
// → Fix: use typed errors
{errors.min_rent_budget && (
  <p>{errors.min_rent_budget.message}</p>
)}

// Pattern: (inquiry as any).min_rent_budget
// → Fix: cast properly or use type-guard
const existingData = inquiry as InquiryFormData;
// or use optional chaining with proper type
```

### 5b. `src/contexts/AuthContext.tsx`
Line 101: `as any` on Supabase response — add proper type annotation
Line 397: `catch (error: any)` → `catch (error: unknown)` + `error instanceof Error`

### 5c. `src/features/organization/TeamMembersList.tsx`
Lines 153, 178: `catch (error: any)` → `catch (error: unknown)`

---

## Task 6: NANP Phone Validation in Wizards

### 6a. Lease Wizard — `src/features/contracts/leaseWizard/leaseWizardStepSchemas.ts`

Find Step 2 phone fields (tenant1, tenant2, cosigner). Add refinement:
```typescript
import { isValidPhone } from '@/services/phone.service';

// In the step 2 schema:
tenant1Phone: z.string()
  .min(1, t('step2.validations.tenant1PhoneRequired'))
  .refine(isValidPhone, { message: t('step2.validations.invalidPhone') }),
// Same for tenant2Phone, cosignerPhone
```

### 6b. Purchase Wizard — `src/features/contracts/purchaseWizard/purchaseWizardStepSchemas.ts`

Find Step 2 phone fields (buyer1, buyer2, seller1, seller2). Same refinement pattern.

Note: `isValidPhone()` is already importable from `@/services/phone.service` or via `@/lib/serviceProxy`.

---

## Execution Order (Cursor için)

| Sıra | Task | Dosya Sayısı | Tahmini Süre |
|------|------|-------------|-------------|
| 1 | Task 2: TRY temizliği (tüm schema+UI) | ~10 | 15 dk |
| 2 | Task 4: Inquiry city→state | 2 | 10 dk |
| 3 | Task 6: Phone validation | 2 | 10 dk |
| 4 | Task 5: `: any` temizliği | 4 | 15 dk |
| 5 | Task 1: US adres alanları | 4 | 30 dk |
| 6 | Task 3: PDF Türkçe metin | 2 | 15 dk |

---

## Doğrulama (Implementation sonrası)

Her task bittiğinde şunları kontrol et:

**Task 1:** `npm run typecheck` → 0 hata → PropertyDialog'da yeni alanlar görünüyor
**Task 2:** `grep -rn "'TRY'" src/` → 0 sonuç (exchangeRates.service.ts hariç)
**Task 3:** Yeni ABD kontratı PDF'te "one thousand" yazıyor, "January" formatında tarih
**Task 4:** InquiryDialog'da state dropdown var, city+district yok
**Task 5:** `npm run typecheck` → 0 hata (any ile ilgili)
**Task 6:** Wizard'da geçersiz telefon girince hata gösteriyor

**Final:** `npm run build` → başarılı
