# Sprint 1 — US Foundation: Gap Analysis & Implementation Plan

> **Source:** Sprint Audit: `/Users/jans/Projelerim/RealDesk-CRM/docs/sprint-audits.md` (Sprint 1)
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

## Current State vs Target

| Area | Completion | Remaining |
|------|-----------|-----------|
| DB / Migrations | 100% (US fields + encryption + indexes all exist) | Turkish fields retain — marked "Sprint 8" |
| Services | ~80% | exchangeRates.service.ts TRY anchor, 50+ TRY refs |
| Components / UI | ~60% | PropertyFormFields, currency selectors, inquiry schema |
| **Overall** | **75%** | **6 task groups below** |

---

## Task 1: US Address Fields in Property Dialog

### Problem
`PropertyFormFields.tsx` still uses old Turkish address format (single `address` textarea + `city` + `district`). DB columns `street_address, state, zip_code, mls_id, year_built` exist but are unreachable from the UI.

### Files to Change

#### 1a. `src/features/properties/propertySchemas.ts` (Schema Layer)
**Current (lines 6-14):**
```typescript
const basePropertySchema = (t) => z.object({
  owner_id: z.string().min(1, ...),
  address: z.string().min(1, ...),
  city: z.string().optional(),
  district: z.string().optional(),
  ...
});
```

**Target — Replace with US address fields:**
```typescript
const basePropertySchema = (t) => z.object({
  owner_id: z.string().min(1, ...),
  street_address: z.string().min(1, t('validations.addressRequired')),
  city: z.string().min(1, t('validations.cityRequired')),
  state: z.string().length(2, t('validations.invalidState')).refine(isValidState, ...),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, t('validations.invalidZip')).refine(isValidZipCode, ...),
  mls_id: z.string().optional(),
  year_built: z.number().int().min(1600).max(2026).optional().nullable(),
  notes: z.string().optional(),
  listing_url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
});
```

Also remove `district` from sale/rental schemas (extending basePropertySchema).

**Both `getRentalPropertySchema` and `getSalePropertySchema` need updating** — they extend basePropertySchema which currently has `address/city/district`.

**i18n keys needed** (add to `public/locales/en/properties.json`):
- `dialog.form.streetAddress`, `dialog.form.streetAddressPlaceholder`
- `dialog.form.state`, `dialog.form.statePlaceholder`
- `dialog.form.zipCode`, `dialog.form.zipCodePlaceholder`
- `dialog.form.mlsId`, `dialog.form.mlsIdPlaceholder`
- `dialog.form.yearBuilt`, `dialog.form.yearBuiltPlaceholder`
- `validations.stateRequired`, `validations.invalidState`
- `validations.zipRequired`, `validations.invalidZip`

#### 1b. `src/features/properties/components/PropertyFormFields.tsx` (UI Layer)
**Current (lines 50-86):**
```tsx
{/* Address Field */}
<Textarea id="address" ... />

{/* City and District Fields */}
<Input id="city" ... />
<Input id="district" ... />
```

**Target — Replace with US address layout:**
```tsx
{/* Street Address */}
<Input id="street_address" placeholder="123 Main St" ... />

{/* City */}
<Input id="city" placeholder="Austin" ... />

{/* State (US State Select) */}
<Select id="state" onValueChange={...}>
  {/* 50 states + DC options */}
</Select>

{/* Zip Code */}
<Input id="zip_code" placeholder="78701" ... />

{/* MLS ID (optional) */}
<Input id="mls_id" placeholder="MLS# (optional)" ... />

{/* Year Built (optional) */}
<Input id="year_built" type="number" placeholder="Year built (optional)" ... />
```

**Remove** the `district` field entirely.

**Also check** `usePropertyFormInitialization.ts` (lines 44, 57) — currently sets `currency` from old property data. This already handles `street_address` etc. if the DB has them, but verify.

#### 1c. `src/features/quick-add/quickAddSchema.ts` (Quick Add Schema)
**Current (lines 14-16):**
```typescript
address: z.string().min(3, ...),
city: z.string().optional(),
district: z.string().optional(),
```

**Target:** Replace with same US address fields as propertySchemas.

#### 1d. `public/locales/en/properties.json`
Add translation keys for all new field labels, placeholders, and validation messages.

### Verification
- Open PropertyDialog → all 6 US address fields render
- Save property → DB columns `street_address, city, state, zip_code, mls_id, year_built` populated
- Edit property → all values load back correctly
- Quick-add dialog also shows US address format

---

## Task 2: Remove TRY Currency (50+ References → USD-only)

### Scope
The project is USD-only for V1. TRY appears in:
1. `propertySchemas.ts` — `currency: z.enum(['USD', 'TRY'])`
2. `PropertyFormFields.tsx` — TRY option in SelectItem
3. `MarkAsSoldDialog.tsx:154` — TRY SelectItem
4. `contractForm.schema.ts:151` — `z.enum(['USD', 'EUR', 'TRY'])`
5. `saleContractForm.schema.ts:38` — `z.enum(['TRY', 'USD', 'EUR'])`
6. `quickAddSchema.ts:23` — `z.enum(['TRY', 'USD', 'EUR'])`
7. `quickAddSchema.ts:37` — `contractCurrency: z.enum(['TRY', 'USD', 'EUR'])`
8. `usePropertyFormInitialization.ts:44,57` — `'USD' | 'TRY'` type assertion
9. `TenantSection.tsx:253` — TRY SelectItem
10. `exchangeRates.service.ts` — Entire TRY-anchor architecture

### Changes

#### 2a-2i. Change all `z.enum` to USD-only
Each file: replace `z.enum(['USD', 'TRY'])` or `z.enum(['TRY', 'USD', 'EUR'])` with `z.literal('USD')` or remove the enum entirely and default to 'USD'.

**Approach by file:**

| File | Line | Current | Target |
|------|------|---------|--------|
| `propertySchemas.ts` | 23, 33, 53 | `z.enum(['USD', 'TRY'])` | `z.literal('USD').default('USD')` |
| `PropertyFormFields.tsx` | 165, 199 | `${'USD' \| 'TRY'}` | `'USD'` (remove select, hardcode) |
| `MarkAsSoldDialog.tsx` | 154 | TRY SelectItem | Remove TRY, keep only USD |
| `contractForm.schema.ts` | 151 | `z.enum(['USD', 'EUR', 'TRY'])` | `z.literal('USD')` |
| `saleContractForm.schema.ts` | 38 | `z.enum(['TRY', 'USD', 'EUR']).default('TRY')` | `z.literal('USD').default('USD')` |
| `quickAddSchema.ts` | 23 | `z.enum(['TRY', 'USD', 'EUR'])` | `z.literal('USD')` |
| `quickAddSchema.ts` | 37 | `z.enum(['TRY', 'USD', 'EUR'])` | `z.literal('USD')` |
| `usePropertyFormInitialization.ts` | 44, 57 | `as 'USD' \| 'TRY'` | Remove cast, default to 'USD' |
| `TenantSection.tsx` | 253 | TRY SelectItem | Remove TRY |

#### 2j. `src/services/finance/exchangeRates.service.ts`
**Current:** 436 lines — entire TRY-anchor architecture: `getRateFromTry()`, `getRateForDate()`, `backfillRatesForDateRange()`, `formatCurrencyWithConversion()`, DB queries against `exchange_rates` table with `from_currency='TRY'`.

**Approach:** This service is already disabled at the top comment ("V1: Disabled — RealDesk US is USD-only. Preserved for V1.5."). **It is NOT imported anywhere.** So the fix is:
1. Verify it's truly not imported (grep for `exchangeRates` in imports)
2. If confirmed unused: add a more visible banner at the top
3. No code change needed — deployment-safe as-is

**But check `src/hooks/useCurrencyConversion.ts` and `src/lib/currency.ts` and `src/utils/currency.ts`** for TRY references too.

#### 2k. `src/hooks/useCurrencyConversion.ts`
Check for TRY; update to USD-only.

### Verification
- `grep -rn "TRY" src/` returns 0 results (excluding `exchangeRates.service.ts` which is V1.5 preserved)
- All currency selects show only USD
- No TypeScript errors after enum changes
- Property form saves with `currency: 'USD'`

---

## Task 3: Gate numberToTurkishText() for Legacy Contracts Only

### Problem
`useContractPdfHandler.ts` (line 95-97, 106-107) calls `numberToTurkishText()` for rent/deposit amounts on ALL contracts, and uses `date-fns/locale/tr` for date formatting (line 101). This makes new US contracts display Turkish number words and Turkish date formats.

### Files to Change

#### `src/features/contracts/hooks/useContractPdfHandler.ts`
**Current (line 14):**
```typescript
import { numberToTurkishText } from '@/lib/numberToText';
import { tr } from 'date-fns/locale';
```

**Target — Gate by property locale/legacy flag:**
```typescript
import { numberToEnglishText } from '@/lib/numberToText'; // Create this
// Conditionally use locale based on contract type
const locale = formData.is_legacy_contract ? tr : enUS;
```

**Changes:**
1. Line 95: `monthlyRentText: numberToTurkishText(monthlyRent)` → Make conditional:
   ```typescript
   monthlyRentText: pdfData.useTurkishText 
     ? numberToTurkishText(monthlyRent) 
     : numberToEnglishText(monthlyRent),
   ```
2. Line 101: `locale: tr` → conditional based on `is_legacy_contract`
3. Remove the Turkish file name `Kira_Sozlesmesi_` prefix (line 145, 168) → use `Lease_Agreement_` for US contracts
4. Import `numberToEnglishText` and `enUS` locale

#### `src/lib/numberToText.ts`
Add `numberToEnglishText()` function:
```typescript
export function numberToEnglishText(n: number): string {
  // Convert number to English words (e.g., 1500 → "one thousand five hundred")
  // Use existing library or implement
}
```

#### `src/types/contract.types.ts`
Check if `is_legacy_contract` or similar flag exists on form data. If not, consider adding it, OR use a simpler heuristic: if `formData.state` is a US state code → English, else → Turkish.

### Verification
- New US contracts → PDF shows "one thousand five hundred" not "bin beş yüz"
- New US contracts → dates format as "January 15, 2026" not "15 Ocak 2026"
- File name: "Lease_Agreement_ABC123.pdf" not "Kira_Sozlesmesi_ABC123.pdf"
- Legacy Turkish contracts (if any) → still use Turkish text and date format

---

## Task 4: preferred_city/preferred_district → preferred_state

### Problem
- `inquirySchema.ts` (lines 22-23) uses `preferred_city` + `preferred_district` (legacy Turkish style)
- Lead schema (`lead-form.ts`) already uses `preferred_state` (correct US format)
- DB has both column sets — they're inconsistent

### Files to Change

#### 4a. `src/features/inquiries/inquirySchema.ts`
**Current (lines 22-23):**
```typescript
preferred_city: z.string().optional(),
preferred_district: z.string().optional(),
```

**Target:**
```typescript
preferred_state: z.string()
  .length(2, t('validations.invalidState'))
  .refine(isValidState, { message: t('validations.invalidState') })
  .optional(),
preferred_city: z.string().optional(), // Keep city, remove district
```

#### 4b. `src/features/inquiries/InquiryDialog.tsx`
Update form UI from city/district inputs to a state selector + city input. If `InquiryDialog.tsx` uses `useForm` with the inquiry schema, it should inherit the new fields automatically. But check the JSX for hardcoded city/district fields.

#### 4c. `src/features/properties/propertySchemas.ts`
The inquiry schemas at the bottom (`getRentalInquirySchema`, `getSaleInquirySchema`) also use `preferred_city/preferred_district` — align them with the new inquiry schema.

### Verification
- InquiryDialog shows State dropdown + City input (not City + District)
- Lead schema and Inquiry schema both use `preferred_state`
- Legacy data migration handled separately (DB columns retained for now)

---

## Task 5: Fix `: any` TypeScript Violations (~17 known, audit says ~40)

### Scope
`grep -c "as any\|: any" src/ --include="*.ts" --include="*.tsx"` returns ~17 non-test/non-definition occurrences concentrated in:

| File | Count | Pattern |
|------|-------|---------|
| `InquiryDialog.tsx` | ~12 | `register('field' as any)`, `(errors as any).field`, `(inquiry as any).prop` |
| `InquiryMatchesDialog.tsx` | 1 | `(inquiry as any).currency_type` |
| `InquiryTableRow.tsx` | 1 | `(inquiry as any).currency_type` |
| `AuthContext.tsx` | 2 | `as any` for `maybeSingle()`, `catch (error: any)` |
| `organization/TeamMembersList.tsx` | 2 | `catch (error: any)` |
| Various | ~6 | `as any` on react-hook-form registration |

### Approach
Fix **by pattern** (not by file count):

**Pattern A: `register('field' as any, { valueAsNumber: true })`** (InquiryDialog.tsx)
→ Fix: Use `register` with proper path typing. React Hook Form supports `register('field_name', { valueAsNumber: true })` natively with proper generics.

**Pattern B: `(errors as any).field.message`** (InquiryDialog.tsx)
→ Fix: Access via `errors.field?.message` if typed properly, or use `get(errors, 'field.message')`.

**Pattern C: `catch (error: any)`**
→ Fix: Use `catch (error: unknown)` and narrow with `error instanceof Error`.

**Pattern D: `(inquiry as any).currency_type`**
→ Fix: Add `currency_type` to the type definition or use optional chaining with proper types.

### Verification
- `tsc --noEmit` passes with zero `any`-related errors
- All forms still submit correctly

---

## Task 6: NANP Phone Validation in Lease/Purchase Wizards

### Problem
`phone.service.ts` exists with `isValidPhone()` (NANP 10-digit + `+1` E.164 normalization). But the lease/purchase wizards don't call it for tenant phone fields.

### Files to Change

#### Lease Wizard

**`src/features/contracts/leaseWizard/leaseWizardStepSchemas.ts`**
Search for phone validation in Step 2 (Parties). If tenant phone uses `z.string().min(1)` without `.refine(isValidPhone)`, add the refinement:
```typescript
tenant1Phone: z.string()
  .min(1, t('step2.validations.tenant1PhoneRequired'))
  .refine(isValidPhone, { message: t('step2.validations.invalidPhone') }),
```

Similarly for `tenant2Phone` and `cosignerPhone` fields.

#### Purchase Wizard

**`src/features/contracts/purchaseWizard/purchaseWizardStepSchemas.ts`**
Search Step 2 (Parties) for buyer/seller phone fields. Add `.refine(isValidPhone)` where missing.

### Verification
- Lease wizard Step 2: enter "555" → validation error "Invalid US phone number"
- Lease wizard Step 2: enter "+15125551234" → passes
- Purchase wizard same test
- `isValidPhone` imported from `@/services/phone.service` or `@/lib/serviceProxy`

---

## Execution Priority

| Order | Task | Effort | Risk | Impact |
|-------|------|--------|------|--------|
| 1 | Task 1: US Address Fields | Medium | Low | High (core UI gap) |
| 2 | Task 2: Remove TRY (schemas) | Small | Low | High (50+ refs) |
| 3 | Task 2: exchangeRates verification | Small | Low | Medium |
| 4 | Task 4: Inquiry city→state | Small | Low | Medium |
| 5 | Task 6: Phone validation | Small | Low | Medium |
| 6 | Task 3: Turkish text gating | Medium | Low | Medium |
| 7 | Task 5: `: any` types | Medium | Low | Low-Medium |

### Recommended Execution Order
Do tasks in parallel where files don't conflict:
- **Batch 1 (no conflicts):** Task 2, Task 4, Task 5, Task 6
- **Batch 2 (after Batch 1):** Task 1 (new schema + UI)
- **Batch 3 (after Batch 2):** Task 3 (PDF handler, depends on new form shape)

---

## Test Scenarios (Post-Implementation)

```typescript
// 1. Property form creates with US address
// - Open PropertyDialog → select rental
// - Fill: street_address, city, state, zip_code
// - Save → verify DB has fields
// - Edit → verify all fields load back

// 2. Currency is USD-only
// - Open PropertyDialog → currency is hidden/hardcoded to USD
// - Open contract form → currency is USD-only
// - No TRY option visible anywhere

// 3. PDF has English text
// - Create US lease → PDF shows "one thousand five hundred"
// - Date formats as "January 15, 2026"
// - File name: "Lease_Agreement_..."

// 4. Inquiry uses preferred_state
// - Same schema shape as lead-form.ts

// 5. TypeScript compiles clean
// - npm run typecheck → 0 errors

// 6. Phone validation works
// - Invalid phone → error shown
// - Valid NANP phone → passes
```
