# Sprint 2 — Batch C: InquiryDialog lead_source + pre_approved Field

> **Audit Source:** `docs/sprint-audits.md` → Sprint 2 (Gaps #6 and #8)
> **Gap #6:** InquiryDialog missing `lead_source` field
> **Gap #8:** `pre_approved` field exists in DB/schema but no form input surfaces it
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task C1: Add `lead_source` to InquiryDialog

### Current State
`inquirySchema.ts` has NO `lead_source` field. The newer `lead-form.ts` (used by the Leads feature) has `lead_source: leadSourceSchema` with all 8 source options (zillow, realtor_com, referral, etc.). The legacy InquiryDialog still doesn't capture how the lead was sourced.

### Files to Change

#### C1a. `src/features/inquiries/inquirySchema.ts`

**In the `inquiryFields` object (around line 37, after `preferred_city`), add:**
```typescript
lead_source: z
  .enum([
    'zillow',
    'realtor_com',
    'referral',
    'sign_call',
    'social_media',
    'cold_call',
    'open_house',
    'other',
  ])
  .optional(),
```

**Also add the LEAD_SOURCE_OPTIONS export (at bottom of file, before the type exports):**
```typescript
export const LEAD_SOURCE_OPTIONS = [
  { value: 'zillow', label: 'Zillow' },
  { value: 'realtor_com', label: 'Realtor.com' },
  { value: 'referral', label: 'Referral' },
  { value: 'sign_call', label: 'Sign Call' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'open_house', label: 'Open House' },
  { value: 'other', label: 'Other' },
] as const;
```

**Also update the `emptyDefaults` handle — ensure `lead_source` defaults to undefined.** The `emptyDefaults` are in `InquiryDialog.tsx`, not in the schema file.

#### C1b. `src/features/inquiries/InquiryDialog.tsx`

**Add `lead_source` to default values (line 56-70, emptyDefaults):**
```typescript
const emptyDefaults = useMemo(
  (): InquiryDialogFormValues => ({
    name: '',
    phone: '',
    email: '',
    preferred_city: '',
    preferred_state: undefined,
    inquiry_type: 'rental',
    lead_source: undefined, // ADD THIS
    min_rent_budget: undefined,
    max_rent_budget: undefined,
    min_sale_budget: undefined,
    max_sale_budget: undefined,
    notes: '',
  }),
  [],
);
```

**Add `lead_source` to the form reset for existing inquiry (around line 94, after preferred_state):**
```typescript
lead_source: (inquiry as any).lead_source || undefined,
```

**Add `lead_source` to the onSubmit payload (around line 111-121):**
```typescript
lead_source: (data as any).lead_source || undefined,
```

**Add UI for lead_source — insert BEFORE the preferred_city/preferred_state grid (before line 189):**
```tsx
{/* Lead Source */}
<div className="space-y-2">
  <Label htmlFor="lead_source">{t('dialog.form.leadSource')}</Label>
  <Select
    value={watch('lead_source') || '__none__'}
    onValueChange={(value) =>
      setValue(
        'lead_source',
        value === '__none__' ? undefined : (value as any),
        { shouldValidate: true },
      )
    }
    disabled={loading}
  >
    <SelectTrigger id="lead_source">
      <SelectValue placeholder={t('dialog.form.leadSourcePlaceholder')} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">
        {t('dialog.form.leadSourceAny', 'Select source (optional)')}
      </SelectItem>
      {LEAD_SOURCE_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Add import at top (line 30 area):**
```typescript
import { getInquirySchema, LEAD_SOURCE_OPTIONS, type InquiryDialogFormValues, type InquirySubmitPayload } from './inquirySchema';
```

#### C1c. `public/locales/en/leads.json`

Add keys:
```json
{
  "dialog": {
    "form": {
      "leadSource": "Lead Source",
      "leadSourcePlaceholder": "How did this lead find you?",
      "leadSourceAny": "Select source (optional)"
    }
  }
}
```

---

## Task C2: Add `pre_approved` Checkbox to InquiryDialog

### Current State
`lead-form.ts` (the newer lead schema) already has `pre_approved: z.boolean().default(false)` at lines 182 and 287. The DB column exists. But:
- `inquirySchema.ts` doesn't have this field
- `InquiryDialog.tsx` doesn't have a checkbox for it
- The Lead form page also might not surface it

### Files to Change

#### C2a. `src/features/inquiries/inquirySchema.ts`

**Add pre_approved to inquiryFields (around line 37, after preferred_city):**
```typescript
pre_approved: z.boolean().default(false).optional(),
```

#### C2b. `src/features/inquiries/InquiryDialog.tsx`

**Add to emptyDefaults (line 56-70):**
```typescript
pre_approved: false,
```

**Add to form reset for existing inquiry (around line 94):**
```typescript
pre_approved: (inquiry as any).pre_approved ?? false,
```

**Add to onSubmit payload (around line 111-121):**
```typescript
pre_approved: (data as any).pre_approved ?? false,
```

**Add pre_approved checkbox UI — insert after the preferred_city/lead_source block, before budget fields:**
```tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="pre_approved"
    className="h-4 w-4 rounded border-gray-300"
    {...register('pre_approved')}
    disabled={loading}
  />
  <Label htmlFor="pre_approved" className="text-sm cursor-pointer">
    {t('dialog.form.preApproved', 'Pre-approved for financing')}
  </Label>
</div>
```

*Note: React Hook Form `register` handles checkboxes by default — it sets the value to `true`/`false`. This should work out of the box with the boolean schema.*

**Alternatively, if the checkbox looks out of place, use a Switch component from the UI library:**
```tsx
<div className="flex items-center justify-between py-2">
  <Label htmlFor="pre_approved" className="text-sm">
    {t('dialog.form.preApproved', 'Pre-approved for financing')}
  </Label>
  <Switch
    id="pre_approved"
    checked={watch('pre_approved') ?? false}
    onCheckedChange={(checked) => setValue('pre_approved', checked, { shouldValidate: true })}
    disabled={loading}
  />
</div>
```

Check if `@/components/ui/switch` exists in the project first:
```
ls src/components/ui/switch.tsx
```
If it exists, use the Switch pattern. Otherwise, use the checkbox pattern.

#### C2c. `public/locales/en/leads.json`

Add key:
```json
{
  "dialog": {
    "form": {
      "preApproved": "Pre-approved for financing"
    }
  }
}
```

---

## Total Files Changed (Batch C)

| File | Lines Changed |
|------|-------------|
| `src/features/inquiries/inquirySchema.ts` | ~10 (add lead_source + pre_approved fields + export LEAD_SOURCE_OPTIONS) |
| `src/features/inquiries/InquiryDialog.tsx` | ~25 (defaults + reset + payload + lead_source Select UI + pre_approved checkbox UI) |
| `public/locales/en/leads.json` | ~5 keys |

**Estimated time in Cursor:** ~10-15 minutes

---

## Verification

- Open InquiryDialog (new inquiry) → see "Lead Source" dropdown + "Pre-approved" checkbox
- Fill form, submit → DB has `lead_source` and `pre_approved` values
- Open existing inquiry → values load back correctly
- No lead_source selected → `null` in DB (not required)
- pre_approved unchecked → `false` in DB
