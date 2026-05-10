# Sprint 6A — Batch I: Lease Wizard Minor Gaps

> **Audit Source:** `docs/sprint-audits.md` → Sprint 6A (Gaps #1, #2, #4)
> **Gap #3 (PDF clause language)** → accepted as MVP, deferred
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task I1: State-Specific Deposit Return Days

### Problem
`leaseAgreementFormDefaults.ts` line 69 defaults `security_deposit_return_days` to **21** regardless of property state. Each state has different statutory requirements. No auto-population occurs when state changes in Step 1.

### What Needs to Change

#### I1a. Add state deposit map to `leaseWizardStepSchemas.ts` (or a shared constants file)

```typescript
// State-specific security deposit return deadlines (statutory)
export const STATE_DEPOSIT_RETURN_DAYS: Record<string, number> = {
  AL: 35, AK: 14, AZ: 14, AR: 60, CA: 21, CO: 30, CT: 30,
  DE: 20, FL: 15, GA: 30, HI: 14, ID: 30, IL: 45, IN: 45,
  IA: 30, KS: 30, KY: 30, LA: 30, ME: 30, MD: 45, MA: 30,
  MI: 30, MN: 21, MS: 45, MO: 30, MT: 30, NE: 30, NV: 30,
  NH: 30, NJ: 30, NM: 30, NY: 14, NC: 30, ND: 30, OH: 30,
  OK: 30, OR: 31, PA: 30, RI: 20, SC: 30, SD: 30, TN: 30,
  TX: 30, UT: 30, VT: 14, VA: 45, WA: 30, WV: 30, WI: 30,
  WY: 30, DC: 30,
};
```

Place this in a shared location — either at the top of `leaseWizardStepSchemas.ts` or in `src/config/constants.ts` (preferred, so it's reusable).

#### I1b. `src/features/contracts/leaseWizard/steps/Step4Financials.tsx`

**Add watch for property_state and auto-set deposit return days when it changes:**

```typescript
import { STATE_DEPOSIT_RETURN_DAYS } from '@/config/constants';

// Inside Step4Financials component, after other watches:
const propertyState = watch('property_state');

// Add useEffect to auto-populate deposit return days when state changes:
useEffect(() => {
  if (propertyState && STATE_DEPOSIT_RETURN_DAYS[propertyState]) {
    const defaultDays = STATE_DEPOSIT_RETURN_DAYS[propertyState];
    const currentValue = watch('security_deposit_return_days');
    // Only auto-set if user hasn't manually changed it (still at default 21 or null)
    if (!currentValue || currentValue === 21) {
      setValue('security_deposit_return_days', defaultDays);
    }
  }
}, [propertyState]);
```

Also add a small hint text showing the state requirement:
```typescript
// After the security_deposit_return_days field, add:
{propertyState && STATE_DEPOSIT_RETURN_DAYS[propertyState] && (
  <p className="text-xs text-muted-foreground mt-1">
    {t('leaseWizard.step4.stateReturnHint', '{{state}} requires {{days}} days', {
      state: propertyState,
      days: STATE_DEPOSIT_RETURN_DAYS[propertyState],
    })}
  </p>
)}
```

**Add import:**
```typescript
import { useEffect } from 'react'; // if not already imported
import { STATE_DEPOSIT_RETURN_DAYS } from '@/config/constants';
```

---

## Task I2: Deposit Amount Caps by State

### Problem
No validation on `security_deposit_amount` against state-specific maximums. For example:
- CA: max 2× rent (unfurnished) / 3× (furnished)
- NY: max 1× rent
- TX: no statutory limit (but good to allow)

### What Needs to Change

#### I2a. Add state deposit cap map to constants

```typescript
// State-specific security deposit maximums (as multiplier of monthly rent)
// null = no statutory limit
export const STATE_DEPOSIT_CAP_MULTIPLIER: Record<string, number | null> = {
  AL: 1, AK: 2, AZ: 1.5, AR: 2, CA: 2,          // CA: 2× unfurnished, 3× furnished
  CO: 2, CT: 2, DE: 1, FL: null, GA: null,
  HI: 1, ID: null, IL: null, IN: null, IA: 2,
  KS: 1, KY: null, LA: 1, ME: 2, MD: 2,
  MA: null, MI: 1.5, MN: null, MS: null, MO: 2,
  MT: null, NE: 1, NV: 3, NH: 1, NJ: 1.5,
  NM: 1, NY: 1, NC: 2, ND: 1, OH: null,
  OK: null, OR: null, PA: 2, RI: 1, SC: null,
  SD: 1, TN: null, TX: null, UT: null, VT: null,
  VA: 2, WA: null, WV: null, WI: null, WY: null,
  DC: 1,
};
```

Add this next to `STATE_DEPOSIT_RETURN_DAYS` in the same constants file.

#### I2b. `src/features/contracts/leaseWizard/leaseWizardStepSchemas.ts`

**Add a superRefine rule in Step 4 schema to validate deposit cap:**

In the Step 4 schema section (around line 225-240 where security_deposit is validated), add:
```typescript
// Deposit cap check (if enabled and rent amount is known)
if (data.security_deposit_enabled && data.security_deposit_amount != null && data.rent_amount) {
  const capMultiplier = STATE_DEPOSIT_CAP_MULTIPLIER[data.property_state || ''];
  if (capMultiplier != null) {
    const maxDeposit = data.rent_amount * capMultiplier;
    if (data.security_deposit_amount > maxDeposit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: lt('step4.depositCapExceeded', {
          defaultValue: 'Deposit cannot exceed {{amount}} ({{multiplier}}× rent) in {{state}}',
          amount: formatCurrency(maxDeposit, 'USD'),
          multiplier: capMultiplier,
          state: data.property_state,
        }),
        path: ['security_deposit_amount'],
      });
    }
  }
}
```

**Import the constant:**
```typescript
import { STATE_DEPOSIT_CAP_MULTIPLIER } from '@/config/constants';
```

#### I2c. Show cap hint in Step4Financials.tsx

Add a hint below the deposit input showing the max allowed:
```typescript
// After security_deposit_amount FormField, add:
{securityEnabled && propertyState && STATE_DEPOSIT_CAP_MULTIPLIER[propertyState] != null && rentAmount > 0 && (
  <p className="text-xs text-muted-foreground mt-1">
    {t('leaseWizard.step4.depositCapHint', 'Max {{cap}}× rent = {{amount}} in {{state}}', {
      cap: STATE_DEPOSIT_CAP_MULTIPLIER[propertyState],
      amount: formatCurrency(rentAmount * STATE_DEPOSIT_CAP_MULTIPLIER[propertyState]!, 'USD'),
      state: propertyState,
    })}
  </p>
)}
```

---

## Task I4: Auto-Set lead_paint_disclosure_required

### Problem
`Step8NoticesDisclosures.tsx` correctly detects pre-1978 (`showLeadPaintDisclosure()`) and shows the disclosure section. But the `lead_paint_disclosure_required` boolean field is never auto-set to `true` when the section is displayed. It remains `false` in the form data.

The DB column exists and `leaseAgreementForm.schema.ts` includes the field (`z.boolean()`). It just needs to be set when the disclosure section is shown.

### Files to Change

#### I4a. `src/features/contracts/leaseWizard/steps/Step8NoticesDisclosures.tsx`

**Add `useEffect` to auto-set `lead_paint_disclosure_required`:**

```typescript
// Add after showLeadPaint declaration:
const { setValue } = useFormContext<LeaseAgreementFormValues>();

// Auto-set the disclosure flag
useEffect(() => {
  setValue('lead_paint_disclosure_required', showLeadPaint, { shouldDirty: false });
}, [showLeadPaint, setValue]);
```

**Add the import:**
```typescript
import { useEffect } from 'react'; // add if not already imported at top
```

The `useFormContext` is already imported (used via `{ control, watch }`), but we need to destructure `setValue` from it as well.

---

## Total Files Changed (Batch I)

| File | Task | Lines |
|------|------|-------|
| `src/config/constants.ts` | I1+I2 | +100 (two state maps) |
| `src/features/contracts/leaseWizard/steps/Step4Financials.tsx` | I1+I2 | ~20 (auto-populate + caps hint) |
| `src/features/contracts/leaseWizard/leaseWizardStepSchemas.ts` | I2 | ~15 (deposit cap superRefine) |
| `src/features/contracts/leaseWizard/steps/Step8NoticesDisclosures.tsx` | I4 | ~5 (auto-set disclosure flag) |

**Estimated time in Cursor:** ~15-20 minutes

---

## Deferred (Gap #3)
- **PDF outputs value summaries, not full clause language** → accepted as MVP-appropriate. Can be enhanced later with a template/clause layer.

---

## Verification

- Select CA in Step 1 → Step 4 shows "CA requires 21 days" and auto-fills 21
- Select NY in Step 1 → Step 4 auto-fills 14
- Enter rent = $2000 → deposit cap shows "Max 2× rent = $4,000 in CA"
- Try to enter $5000 deposit in CA → validation error on submit
- Pre-1978 property in Step 1 → Step 8 auto-shows disclosure, `lead_paint_disclosure_required` = true in form data
- Post-1978 property → no disclosure shown, `lead_paint_disclosure_required` = false
