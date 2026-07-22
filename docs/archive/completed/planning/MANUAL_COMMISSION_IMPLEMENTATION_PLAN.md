# Manual Commission Input - Implementation Plan

## 📋 Executive Summary

This document outlines the step-by-step implementation plan for adding manual commission input to override the automatic "Commission = 1 Month Rent" calculation.

**Goal:** Allow users to manually enter commission amount. If provided, use it; otherwise, fall back to `rent_amount` (1 month rent).

**Key Decision:** Store `commission_amount` in `contracts` table (not `contract_details`) for trigger accessibility.

---

## 🎯 Architecture Decision

### **Storage Location: `contracts` Table**

**Decision:** Add `commission_amount` column to `contracts` table

**Rationale:**
1. ✅ Trigger fires immediately after `contracts` INSERT
2. ✅ No need to join `contract_details` (which may not exist yet)
3. ✅ Simpler trigger logic: `COALESCE(NEW.commission_amount, NEW.rent_amount)`
4. ✅ Direct access in trigger function
5. ✅ Backward compatible (NULL = use rent_amount)

**Alternative Considered:** `contract_details` table
- ❌ Requires JOIN in trigger (more complex)
- ❌ `contract_details` created AFTER contract (timing issue)
- ❌ Optional table (may not exist for all contracts)

---

## 📋 Implementation Tasks

### **Task 1: Database Schema Update**
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 30 minutes

**Objective:** Add `commission_amount` column to `contracts` table

**Files to Create/Modify:**
1. **New Migration:** `supabase/migrations/20260114000000_add_commission_amount_to_contracts.sql`

**Migration Content:**
```sql
-- Add commission_amount column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2);

-- Add comment
COMMENT ON COLUMN contracts.commission_amount IS 
'Manual commission amount. If NULL, commission trigger uses rent_amount (1 month rent).';

-- Create index for queries (optional, but helpful)
CREATE INDEX IF NOT EXISTS idx_contracts_commission_amount 
ON contracts(commission_amount) 
WHERE commission_amount IS NOT NULL;
```

**Validation:**
- ✅ Column is nullable (NULL = auto-calculate from rent_amount)
- ✅ Type: NUMERIC(10,2) - matches rent_amount type
- ✅ No default value (NULL by default = backward compatible)
- ✅ Index for performance (optional)

**Backward Compatibility:**
- ✅ Existing contracts have `commission_amount = NULL`
- ✅ NULL values trigger fallback to `rent_amount`
- ✅ No data migration needed

---

### **Task 2: Update Trigger Function**
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 45 minutes

**Objective:** Modify `create_rental_commission()` to use manual commission if provided

**Files to Modify:**
1. **New Migration:** `supabase/migrations/20260114000001_update_commission_trigger_manual_override.sql`

**Current Logic (Line 61):**
```sql
NEW.rent_amount, -- Commission = 1 month rent
```

**New Logic:**
```sql
COALESCE(NEW.commission_amount, NEW.rent_amount), -- Use manual if provided, else rent_amount
```

**Complete Function Update:**
```sql
CREATE OR REPLACE FUNCTION create_rental_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_commission_amount NUMERIC;
BEGIN
    -- Only create commission for active contracts with rent amount
    IF NEW.status = 'Active' AND NEW.rent_amount > 0 THEN
        -- Check if commission already exists for this contract
        IF NOT EXISTS (
            SELECT 1 FROM commissions
            WHERE contract_id = NEW.id AND type = 'rental'
        ) THEN
            -- Get org_id from contract or property
            SELECT COALESCE(NEW.org_id, p.org_id) INTO v_org_id
            FROM properties p
            WHERE p.id = NEW.property_id
            LIMIT 1;
            
            -- Validate org_id exists
            IF v_org_id IS NULL THEN
                RAISE WARNING 'Cannot create commission: org_id not found for contract %', NEW.id;
                RETURN NEW;
            END IF;
            
            -- Calculate commission amount: manual if provided, else rent_amount
            v_commission_amount := COALESCE(NEW.commission_amount, NEW.rent_amount);
            
            -- Skip if commission amount is zero or negative
            IF v_commission_amount <= 0 THEN
                RETURN NEW;
            END IF;
            
            INSERT INTO commissions (
                property_id,
                contract_id,
                type,
                amount,              -- ← Uses calculated amount (manual or rent_amount)
                currency,
                property_address,
                notes,
                user_id,
                org_id
            )
            SELECT
                NEW.property_id,
                NEW.id,
                'rental',
                v_commission_amount, -- ← Manual commission or rent_amount fallback
                NEW.currency,
                p.address,
                CASE 
                    WHEN NEW.commission_amount IS NOT NULL THEN 
                        'Commission from rental contract (manual amount)'
                    ELSE 
                        'Commission from rental contract'
                END,
                (SELECT user_id FROM properties WHERE id = NEW.property_id LIMIT 1),
                v_org_id
            FROM properties p
            WHERE p.id = NEW.property_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Key Changes:**
- ✅ Line 61: Changed from `NEW.rent_amount` to `COALESCE(NEW.commission_amount, NEW.rent_amount)`
- ✅ Added validation: Skip if commission_amount <= 0
- ✅ Updated notes field to indicate manual vs auto
- ✅ Maintains all existing logic (org_id, duplicate check, etc.)

**Testing Scenarios:**
- ✅ `commission_amount = NULL` → Uses `rent_amount` (backward compatible)
- ✅ `commission_amount = 0` → Skips commission creation
- ✅ `commission_amount = 5000` → Uses 5000 instead of rent_amount
- ✅ `commission_amount = rent_amount` → Same result as before

---

### **Task 3: Update TypeScript Types**
**Priority:** 🟡 HIGH  
**Estimated Time:** 15 minutes

**Objective:** Add `commission_amount` to TypeScript interfaces

**Files to Modify:**
1. `src/types/contract.types.ts`

**Changes:**
```typescript
// Add to ContractFormData interface (around line 180)
export interface ContractFormData {
  // ... existing fields ...
  rent_amount: number;
  deposit: number;
  currency: 'TRY' | 'USD' | 'EUR';
  commission_amount?: number;  // ← NEW: Optional manual commission
  // ... rest of fields ...
}
```

**Also Update:**
- `ContractDetails` interface (if needed for edit flow)
- Database types (if using generated types from Supabase)

**Validation:**
- ✅ Field is optional (`?`)
- ✅ Type: `number` (matches form input)
- ✅ No breaking changes to existing code

---

### **Task 4: Update Form Schema (Zod Validation)**
**Priority:** 🟡 HIGH  
**Estimated Time:** 20 minutes

**Objective:** Add `commission_amount` to Zod validation schema

**Files to Modify:**
1. `src/features/contracts/schemas/contractForm.schema.ts`

**Changes:**
```typescript
// Add after rent_amount field (around line 133)
rent_amount: z.number({
  required_error: t('rentRequired'),
  invalid_type_error: t('validNumber'),
})
.min(1, t('rentGreaterThanZero'))
.max(1000000000, t('invalidAmount')),

// NEW: Commission amount (optional)
commission_amount: z.number({
  invalid_type_error: t('validNumber'),
})
.min(0, t('commissionNonNegative'))
.max(1000000000, t('invalidAmount'))
.optional()
.or(z.literal('')),
```

**Validation Rules:**
- ✅ Optional field (can be empty)
- ✅ Must be >= 0 (non-negative)
- ✅ Must be <= 1,000,000,000 (reasonable max)
- ✅ Allows empty string (for form clearing)

**Translation Keys Needed:**
- `commissionNonNegative`: "Komisyon tutarı negatif olamaz" / "Commission amount cannot be negative"

---

### **Task 5: Add Frontend Form Field**
**Priority:** 🟡 HIGH  
**Estimated Time:** 30 minutes

**Objective:** Add "Komisyon Tutarı" input field to contract form

**Files to Modify:**
1. `src/features/contracts/components/form-sections/ContractDetailsSection.tsx`

**Location:** After "Deposit" field, before "Currency" field (around line 190-228)

**Implementation:**
```typescript
{/* Commission Amount (Optional) */}
<div>
  <Label htmlFor="commission_amount">
    {t('create.fields.commission_amount')}
  </Label>
  <Input
    id="commission_amount"
    type="number"
    placeholder={t('create.placeholders.commission_amount')}
    {...form.register('commission_amount', { valueAsNumber: true })}
  />
  <p className="text-xs text-muted-foreground mt-1">
    {t('create.helpers.commission_amount')}
  </p>
  {form.formState.errors.commission_amount && (
    <p className="text-sm text-red-600 mt-1">
      {form.formState.errors.commission_amount.message}
    </p>
  )}
</div>
```

**UI Considerations:**
- ✅ Place after Deposit field (logical grouping)
- ✅ Show helper text: "Boş bırakılırsa 1 aylık kira tutarı kullanılır"
- ✅ Optional field (no required asterisk)
- ✅ Number input with proper formatting

**Translation Keys Needed:**
- `create.fields.commission_amount`: "Komisyon Tutarı"
- `create.placeholders.commission_amount`: "Manuel komisyon tutarı (opsiyonel)"
- `create.helpers.commission_amount`: "Boş bırakılırsa 1 aylık kira tutarı otomatik kullanılır"

---

### **Task 6: Update Service Layer**
**Priority:** 🟡 HIGH  
**Estimated Time:** 20 minutes

**Objective:** Pass `commission_amount` from form to database

**Files to Modify:**
1. `src/services/contractCreation.service.ts`

**Changes:**
```typescript
// Around line 111-117, update contractData:
const contractData = {
  start_date: toISODate(formData.start_date),
  end_date: toISODate(formData.end_date),
  rent_amount: formData.rent_amount,
  deposit: formData.deposit,
  currency: formData.currency || 'TRY',
  commission_amount: formData.commission_amount || null,  // ← NEW: Pass commission_amount
};
```

**RPC Call:**
- No changes needed - RPC already accepts `contract_data` JSONB
- `commission_amount` will be included in JSONB automatically

**Validation:**
- ✅ Pass `null` if undefined/empty (triggers fallback)
- ✅ Pass number if provided
- ✅ RPC handles JSONB extraction automatically

---

### **Task 7: Update RPC Function**
**Priority:** 🟡 HIGH  
**Estimated Time:** 30 minutes

**Objective:** Extract and store `commission_amount` in contracts INSERT

**Files to Modify:**
1. `supabase/migrations/20260114000002_update_contract_rpc_commission.sql`

**Current RPC INSERT (around line 202-224):**
```sql
INSERT INTO contracts (
  user_id,
  tenant_id,
  property_id,
  start_date,
  end_date,
  rent_amount,
  deposit,
  currency,
  status
)
VALUES (
  user_id_param,
  v_tenant_id,
  v_property_id,
  (contract_data->>'start_date')::date,
  (contract_data->>'end_date')::date,
  (contract_data->>'rent_amount')::numeric,
  (contract_data->>'deposit')::numeric,
  'TRY',
  'Active'
)
```

**Updated RPC INSERT:**
```sql
INSERT INTO contracts (
  user_id,
  tenant_id,
  property_id,
  start_date,
  end_date,
  rent_amount,
  deposit,
  currency,
  status,
  commission_amount  -- ← NEW column
)
VALUES (
  user_id_param,
  v_tenant_id,
  v_property_id,
  (contract_data->>'start_date')::date,
  (contract_data->>'end_date')::date,
  (contract_data->>'rent_amount')::numeric,
  (contract_data->>'deposit')::numeric,
  COALESCE((contract_data->>'currency')::text, 'TRY'),  -- Use provided currency
  'Active',
  NULLIF((contract_data->>'commission_amount')::numeric, 0)  -- ← NEW: NULL if 0 or missing
)
```

**Key Points:**
- ✅ Use `NULLIF(..., 0)` to convert 0 to NULL (triggers fallback)
- ✅ Use `COALESCE` for currency (already should be there)
- ✅ NULL values = backward compatible (uses rent_amount)

**Files to Update:**
- `supabase/migrations/20251222_fix_contract_rpc_currency.sql` (latest RPC version)
- OR create new migration that updates all RPC versions

---

### **Task 8: Update Contract Edit Flow**
**Priority:** 🟡 HIGH  
**Estimated Time:** 30 minutes

**Objective:** Load and save `commission_amount` in edit flow

**Files to Modify:**
1. `src/features/contracts/hooks/useContractEditData.ts`

**Changes:**
```typescript
// Around line 207, add commission_amount to formData:
const formData: ContractFormData = {
  // ... existing fields ...
  rent_amount: contract.rent_amount || 0,
  deposit: contract.deposit || 0,
  currency: (contractDetails?.deposit_currency as 'TRY' | 'USD' | 'EUR') || 'TRY',
  commission_amount: contract.commission_amount || undefined,  // ← NEW: Load from contract
  // ... rest of fields ...
};
```

**Also Update:**
2. `src/services/contractUpdate.service.ts`
   - Ensure `commission_amount` is included in update payload
   - Check if service updates contracts table directly

**Validation:**
- ✅ Loads `commission_amount` from database
- ✅ Displays in form correctly
- ✅ Saves changes back to database

---

### **Task 9: Add Multilanguage Support**
**Priority:** 🟢 MEDIUM  
**Estimated Time:** 15 minutes

**Objective:** Add translation keys for commission field

**Files to Modify:**
1. `public/locales/tr/contracts.json`
2. `public/locales/en/contracts.json`

**Translation Keys:**
```json
{
  "create": {
    "fields": {
      "commission_amount": "Komisyon Tutarı"
    },
    "placeholders": {
      "commission_amount": "Manuel komisyon tutarı (opsiyonel)"
    },
    "helpers": {
      "commission_amount": "Boş bırakılırsa 1 aylık kira tutarı otomatik kullanılır"
    }
  },
  "validation": {
    "commissionNonNegative": "Komisyon tutarı negatif olamaz"
  }
}
```

**English Equivalents:**
- "Commission Amount"
- "Manual commission amount (optional)"
- "If left empty, 1 month rent will be used automatically"
- "Commission amount cannot be negative"

---

### **Task 10: Update Database Type Definitions**
**Priority:** 🟢 MEDIUM  
**Estimated Time:** 15 minutes

**Objective:** Regenerate TypeScript types from Supabase schema

**Files to Update:**
1. `src/types/database.types.ts` (if using Supabase CLI generation)

**Action:**
- Run Supabase type generation command (if available)
- OR manually add `commission_amount?: number | null` to contracts type

**Manual Update (if needed):**
```typescript
contracts: {
  Row: {
    // ... existing fields ...
    rent_amount: number | null;
    deposit: number | null;
    currency: string | null;
    commission_amount: number | null;  // ← NEW
    // ... rest of fields ...
  }
}
```

---

### **Task 11: Testing & Validation**
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 1-2 hours

**Objective:** Comprehensive testing of manual commission feature

**Test Scenarios:**

1. **Create Contract - No Commission (Backward Compatible)**
   - Leave commission_amount empty
   - Expected: Commission = rent_amount
   - Verify: commissions.amount = contracts.rent_amount
   - Verify: financial_transactions.amount = rent_amount

2. **Create Contract - Manual Commission**
   - Enter commission_amount = 5000 (rent_amount = 10000)
   - Expected: Commission = 5000
   - Verify: commissions.amount = 5000
   - Verify: financial_transactions.amount = 5000

3. **Create Contract - Commission = 0**
   - Enter commission_amount = 0
   - Expected: No commission created (trigger skips)
   - Verify: No record in commissions table

4. **Create Contract - Commission = Rent Amount**
   - Enter commission_amount = rent_amount
   - Expected: Commission = rent_amount (same as before)
   - Verify: Same behavior as auto-calculation

5. **Edit Contract - Add Commission**
   - Load existing contract (no commission_amount)
   - Add commission_amount = 5000
   - Save
   - Expected: Commission updated (if trigger fires on UPDATE)
   - Verify: commissions.amount = 5000

6. **Edit Contract - Remove Commission**
   - Load contract with commission_amount = 5000
   - Clear commission_amount field
   - Save
   - Expected: commission_amount = NULL, commission = rent_amount

7. **Edge Cases:**
   - Very large commission amount
   - Negative commission (should be prevented by validation)
   - Commission > rent_amount (should be allowed)
   - Commission < rent_amount (should be allowed)

---

## 🔄 Complete Data Flow (After Implementation)

### **New Flow with Manual Commission:**

```
User Input (Frontend)
  ↓
ContractDetailsSection.tsx
  - rent_amount: 10000
  - commission_amount: 5000 (optional)
  ↓
ContractFormData
  - rent_amount: 10000
  - commission_amount: 5000
  ↓
contractCreation.service.ts
  - contractData.commission_amount = 5000
  ↓
RPC: create_contract_atomic()
  - INSERT INTO contracts (commission_amount = 5000)
  ↓
[TRIGGER 1] create_rental_commission()
  - v_commission_amount = COALESCE(5000, 10000) = 5000
  - INSERT INTO commissions (amount = 5000)
  ↓
[TRIGGER 2] create_commission_transaction()
  - INSERT INTO financial_transactions (amount = 5000)
  ↓
Final Result: Commission = 5000 (manual override)
```

### **Fallback Flow (No Manual Commission):**

```
User Input (Frontend)
  ↓
ContractDetailsSection.tsx
  - rent_amount: 10000
  - commission_amount: (empty)
  ↓
ContractFormData
  - rent_amount: 10000
  - commission_amount: undefined
  ↓
contractCreation.service.ts
  - contractData.commission_amount = null
  ↓
RPC: create_contract_atomic()
  - INSERT INTO contracts (commission_amount = NULL)
  ↓
[TRIGGER 1] create_rental_commission()
  - v_commission_amount = COALESCE(NULL, 10000) = 10000
  - INSERT INTO commissions (amount = 10000)
  ↓
[TRIGGER 2] create_commission_transaction()
  - INSERT INTO financial_transactions (amount = 10000)
  ↓
Final Result: Commission = 10000 (rent_amount fallback)
```

---

## 📊 Task Summary Table

| Task | Priority | Time | Files | Status |
|------|----------|------|-------|--------|
| Task 1: Database Schema | 🔴 CRITICAL | 30 min | Migration SQL | ⏳ Pending |
| Task 2: Update Trigger | 🔴 CRITICAL | 45 min | Migration SQL | ⏳ Pending |
| Task 3: TypeScript Types | 🟡 HIGH | 15 min | contract.types.ts | ⏳ Pending |
| Task 4: Form Schema | 🟡 HIGH | 20 min | contractForm.schema.ts | ⏳ Pending |
| Task 5: Frontend Field | 🟡 HIGH | 30 min | ContractDetailsSection.tsx | ⏳ Pending |
| Task 6: Service Layer | 🟡 HIGH | 20 min | contractCreation.service.ts | ⏳ Pending |
| Task 7: RPC Function | 🟡 HIGH | 30 min | Migration SQL | ⏳ Pending |
| Task 8: Edit Flow | 🟡 HIGH | 30 min | useContractEditData.ts | ⏳ Pending |
| Task 9: Translations | 🟢 MEDIUM | 15 min | contracts.json (TR/EN) | ⏳ Pending |
| Task 10: DB Types | 🟢 MEDIUM | 15 min | database.types.ts | ⏳ Pending |
| Task 11: Testing | 🔴 CRITICAL | 1-2 hours | All files | ⏳ Pending |

**Total Estimated Time:** 4-5 hours

---

## ✅ Backward Compatibility Strategy

### **1. Database Level**
- ✅ `commission_amount` column is **NULLABLE**
- ✅ Existing contracts have `commission_amount = NULL`
- ✅ Trigger uses `COALESCE(NULL, rent_amount)` = `rent_amount`
- ✅ **Result:** Existing contracts work exactly as before

### **2. Application Level**
- ✅ Form field is **optional** (no required validation)
- ✅ Service layer passes `null` if undefined
- ✅ RPC handles `NULL` values correctly
- ✅ **Result:** No breaking changes to existing code

### **3. Data Migration**
- ✅ **No migration needed** - NULL values are valid
- ✅ Existing commissions remain unchanged
- ✅ New contracts can use manual commission
- ✅ **Result:** Zero downtime deployment

---

## 🎯 Success Criteria

### **Functional Requirements:**
- ✅ User can enter manual commission amount
- ✅ If empty, system uses rent_amount (1 month rent)
- ✅ Commission record created with correct amount
- ✅ Financial transaction created with correct amount
- ✅ Edit flow loads and saves commission_amount
- ✅ Backward compatible with existing contracts

### **Technical Requirements:**
- ✅ Database schema updated
- ✅ Trigger logic updated
- ✅ Frontend form updated
- ✅ Service layer updated
- ✅ Type definitions updated
- ✅ Multilanguage support added

### **Quality Requirements:**
- ✅ Validation prevents invalid values
- ✅ Clear user feedback (helper text)
- ✅ Error messages translated
- ✅ All test scenarios pass

---

## 🚀 Recommended Execution Order

### **Phase 1: Database Foundation (1.5 hours)**
1. Task 1: Database Schema Update
2. Task 2: Update Trigger Function
3. Task 7: Update RPC Function

### **Phase 2: Application Layer (1.5 hours)**
4. Task 3: TypeScript Types
5. Task 4: Form Schema
6. Task 6: Service Layer

### **Phase 3: Frontend Integration (1 hour)**
7. Task 5: Frontend Form Field
8. Task 9: Multilanguage Support

### **Phase 4: Edit Flow & Polish (1 hour)**
9. Task 8: Contract Edit Flow
10. Task 10: Database Type Definitions

### **Phase 5: Quality Assurance (1-2 hours)**
11. Task 11: Testing & Validation

---

## 📝 Implementation Notes

### **Important Considerations:**

1. **Trigger Timing:**
   - Trigger fires AFTER INSERT on contracts
   - `commission_amount` must be in contracts table at trigger time
   - ✅ Storing in contracts table ensures availability

2. **NULL vs 0:**
   - NULL = use rent_amount (fallback)
   - 0 = skip commission creation (validation)
   - Use `NULLIF(value, 0)` to convert 0 to NULL if needed

3. **Currency:**
   - Commission uses same currency as contract
   - No separate commission currency field needed
   - ✅ Already handled in trigger

4. **Update Behavior:**
   - Trigger fires on UPDATE too
   - If commission_amount changes, new commission created?
   - ✅ Duplicate check prevents multiple commissions
   - ⚠️ May need to handle UPDATE case differently

5. **Validation:**
   - Frontend: Prevent negative values
   - Schema: Min 0, max reasonable limit
   - Database: Trigger skips if amount <= 0

---

## 🔧 Future Enhancements (Out of Scope)

1. **Commission Percentage:**
   - Calculate as percentage of rent_amount
   - UI: "10% of rent" option

2. **Commission Sharing:**
   - Multiple agents per commission
   - Split commission amounts

3. **Commission Templates:**
   - Save common commission amounts
   - Quick apply templates

4. **Commission History:**
   - Track commission changes
   - Audit trail

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-13  
**Status:** Ready for Implementation
