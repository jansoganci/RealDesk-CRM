# Contract Creation → Finance Transaction Integration Analysis

**Date:** 2025-01-XX  
**Goal:** Understand how to automatically create finance transactions when rental contracts are created

---

## 📋 Executive Summary

**Current State:**
- ✅ Tenant creation (via `rpc_create_tenant_with_contract`) → Automatically creates finance transaction
- ❌ Contract creation (via `create_contract_atomic`) → **DOES NOT** create finance transaction

**Root Cause:**
The trigger chain exists but may not be firing correctly for the `create_contract_atomic` path, OR the user wants a direct transaction (not via commission).

**Expected Behavior:**
- Contract created with 35,000 TL monthly rent → Automatically create 35,000 TL income transaction
- Realtor income = Monthly rent amount (1:1 ratio)

---

## 1️⃣ Finance Module Structure

### 1a. Database Table

**Table Name:** `financial_transactions`

**Schema Location:**
```sql
supabase/migrations/20251111130000_create_financial_transactions_table.sql
```

**Key Fields:**
```sql
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_date DATE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  description TEXT NOT NULL,
  notes TEXT,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'completed',
  property_id UUID REFERENCES properties(id),
  contract_id UUID REFERENCES contracts(id),  -- ✅ Can link to contract
  commission_id UUID REFERENCES commissions(id),
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20),
  recurring_day INTEGER,
  recurring_end_date DATE,
  parent_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Important:** The table has a `contract_id` field that can link transactions directly to contracts.

---

### 1b. Service Function

**File:** `src/services/finance/transactions.service.ts`

**Function Signature:**
```typescript
export const createTransaction = async (
  data: CreateFinancialTransactionInput
): Promise<FinancialTransaction>
```

**Location:** Lines 99-129

**Code:**
```99:129:src/services/finance/transactions.service.ts
export const createTransaction = async (
  data: CreateFinancialTransactionInput
): Promise<FinancialTransaction> => {
  const userId = await getAuthenticatedUserId();

  const transaction = await insertRow('financial_transactions', {
    user_id: userId,
    transaction_date: data.transaction_date,
    type: data.type,
    category: data.category,
    subcategory: data.subcategory || null,
    amount: data.amount,
    currency: data.currency || 'TRY',
    description: data.description,
    notes: data.notes || null,
    payment_method: data.payment_method || null,
    payment_status: data.payment_status || 'completed',
    property_id: data.property_id || null,
    contract_id: data.contract_id || null,
    commission_id: data.commission_id || null,
    receipt_url: data.receipt_url || null,
    invoice_number: data.invoice_number || null,
    is_recurring: data.is_recurring || false,
    recurring_frequency: data.recurring_frequency || null,
    recurring_day: data.recurring_day || null,
    recurring_end_date: data.recurring_end_date || null,
    parent_transaction_id: data.parent_transaction_id || null,
  });

  return transaction as FinancialTransaction;
};
```

---

### 1c. Transaction Data Structure

**File:** `src/types/financial.ts`

**Interface:**
```65:86:src/types/financial.ts
export interface CreateFinancialTransactionInput {
  transaction_date: string;
  type: TransactionType;
  category: string;
  subcategory?: string | null;
  amount: number;
  currency?: string;
  description: string;
  notes?: string | null;
  payment_method?: PaymentMethod | null;
  payment_status?: PaymentStatus;
  property_id?: string | null;
  contract_id?: string | null;  // ✅ Can link to contract
  commission_id?: string | null;
  receipt_url?: string | null;
  invoice_number?: string | null;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency | null;
  recurring_day?: number | null;
  recurring_end_date?: string | null;
  parent_transaction_id?: string | null;
}
```

**Required Fields:**
- `transaction_date`: ISO date string
- `type`: 'income' | 'expense'
- `category`: string (e.g., "Rental Income", "Rental Commissions")
- `amount`: number
- `description`: string

**Optional but Useful:**
- `contract_id`: Link to contract
- `property_id`: Link to property
- `subcategory`: More specific categorization

---

### 1d. Supabase RPC Functions

**No direct RPC functions for finance operations found.**  
All finance operations go through the TypeScript service layer.

---

## 2️⃣ Existing Tenant Creation Logic

### 2a. File/Function That Triggers Finance Transaction

**File:** `supabase/migrations/20250110000000_create_commissions_table.sql`

**Trigger Chain:**
1. Contract created → `trigger_create_rental_commission` fires
2. Commission created → `trigger_commission_to_transaction` fires
3. Transaction created automatically

**Trigger Function:**
```52:86:supabase/migrations/20250110000000_create_commissions_table.sql
CREATE OR REPLACE FUNCTION create_rental_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create commission for active contracts with rent amount
    IF NEW.status = 'Active' AND NEW.rent_amount > 0 THEN
        -- Check if commission already exists for this contract
        IF NOT EXISTS (
            SELECT 1 FROM commissions
            WHERE contract_id = NEW.id AND type = 'rental'
        ) THEN
            INSERT INTO commissions (
                property_id,
                contract_id,
                type,
                amount,
                currency,
                property_address,
                notes,
                user_id
            )
            SELECT
                NEW.property_id,
                NEW.id,
                'rental',
                NEW.rent_amount, -- Commission = 1 month rent
                NEW.currency,
                p.address,
                'Commission from rental contract',
                (SELECT user_id FROM properties WHERE id = NEW.property_id LIMIT 1)
            FROM properties p
            WHERE p.id = NEW.property_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger Definition:**
```89:94:supabase/migrations/20250110000000_create_commissions_table.sql
DROP TRIGGER IF EXISTS trigger_create_rental_commission ON contracts;
CREATE TRIGGER trigger_create_rental_commission
    AFTER INSERT OR UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION create_rental_commission();
```

---

### 2b. Exact Code That Creates Transaction

**File:** `supabase/migrations/20251125000000_commission_to_transaction_trigger.sql`

**Trigger Function:**
```25:87:supabase/migrations/20251125000000_commission_to_transaction_trigger.sql
CREATE OR REPLACE FUNCTION create_commission_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_category_name TEXT;
    v_subcategory TEXT;
    v_description TEXT;
BEGIN
    -- Map commission type to category name
    IF NEW.type = 'rental' THEN
        v_category_name := 'Rental Commissions';
        v_subcategory := 'Contract Commission';
        v_description := 'Kira komisyonu: ' || NEW.property_address;
    ELSIF NEW.type = 'sale' THEN
        v_category_name := 'Sale Commissions';
        v_subcategory := 'Property Sale';
        v_description := 'Satış komisyonu: ' || NEW.property_address;
    ELSE
        -- Unknown type - still create transaction with generic category
        v_category_name := 'Other Income';
        v_subcategory := 'Commission';
        v_description := 'Komisyon: ' || NEW.property_address;
    END IF;

    -- Skip if amount is zero or null
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
        RETURN NEW;
    END IF;

    -- Insert financial transaction linked to commission
    INSERT INTO financial_transactions (
        user_id,
        transaction_date,
        type,
        category,
        subcategory,
        amount,
        currency,
        description,
        notes,
        payment_method,
        payment_status,
        property_id,
        contract_id,
        commission_id
    ) VALUES (
        NEW.user_id,
        CURRENT_DATE,
        'income',
        v_category_name,
        v_subcategory,
        NEW.amount,
        COALESCE(NEW.currency, 'TRY'),
        v_description,
        NEW.notes,
        'bank_transfer',  -- Default payment method
        'completed',      -- Commission is earned when created
        NEW.property_id,
        NEW.contract_id,  -- Will be NULL for sale commissions
        NEW.id            -- Link back to commission
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger Definition:**
```101:107:supabase/migrations/20251125000000_commission_to_transaction_trigger.sql
DROP TRIGGER IF EXISTS trigger_commission_to_transaction ON commissions;
CREATE TRIGGER trigger_commission_to_transaction
    AFTER INSERT ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_transaction();
```

---

### 2c. How It Calculates Amount

**Amount Calculation:**
- Commission amount = `NEW.rent_amount` (1 month rent)
- Transaction amount = Commission amount (1:1 mapping)

**Location:** Line 76 in `create_rental_commission()`:
```sql
NEW.rent_amount, -- Commission = 1 month rent
```

---

### 2d. How It Determines Date

**Transaction Date:**
- Uses `CURRENT_DATE` (today's date)
- Set in `create_commission_transaction()` function, line 71

**Location:**
```71:71:supabase/migrations/20251125000000_commission_to_transaction_trigger.sql
        CURRENT_DATE,
```

---

### 2e. One-Time vs Recurring

**Current Implementation:**
- ✅ **One-time transaction** - Only creates transaction when contract is created
- ❌ **NOT recurring** - Does not create monthly transactions

**Evidence:**
- `is_recurring` defaults to `false` in transaction creation
- No recurring logic in commission trigger
- Transaction date is `CURRENT_DATE` (contract creation date), not monthly

---

## 3️⃣ Current Contract Creation Flow

### 3a. Where Contract Creation Happens

**File:** `src/services/contractCreation.service.ts`

**Function:**
```30:186:src/services/contractCreation.service.ts
export async function createContractWithEntities(
  formData: ContractFormData,
  userId: string
): Promise<ContractCreationResult> {
  // ... prepares data ...
  
  const { data, error } = await supabase.rpc('create_contract_atomic' as any, {
    owner_data: ownerData,
    tenant_data: tenantData,
    property_data: propertyData,
    contract_data: contractData,
    contract_details_data: contractDetailsData,
    user_id_param: userId
  });
  
  // ... returns result ...
}
```

**RPC Function:** `create_contract_atomic`

**Location:** `supabase/migrations/20251120_contract_atomic_transaction.sql`

**Contract Creation Code:**
```199:224:supabase/migrations/20251120_contract_atomic_transaction.sql
  -- ========================================================================
  -- STEP 4: Create contract (always new)
  -- ========================================================================
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
  RETURNING id INTO v_contract_id;
```

---

### 3b. Data Available After Contract Creation

**Return Type:** `ContractCreationResult`

**File:** `src/types/contract.types.ts`

**Interface:**
```23:34:src/types/contract.types.ts
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
```

**Available Data:**
- ✅ `contract_id` - Contract UUID
- ✅ `property_id` - Property UUID
- ✅ `rent_amount` - Available from `formData.rent_amount`
- ✅ `start_date` - Available from `formData.start_date`
- ✅ `deposit` - Available from `formData.deposit`
- ✅ `currency` - Available from `formData.currency` (defaults to 'TRY')

**Missing from Result:**
- ❌ `rent_amount` is NOT in the return object (but available in `formData`)
- ❌ `start_date` is NOT in the return object (but available in `formData`)

---

### 3c. Post-Creation Hook/Callback

**No explicit post-creation hook found.**

**Current Flow:**
1. `createContractWithEntities()` calls RPC
2. RPC creates contract with `status='Active'`
3. Database trigger `trigger_create_rental_commission` should fire
4. Commission trigger should create transaction

**Issue:** The trigger chain should work, but user reports it doesn't. Possible reasons:
- Trigger not firing for `create_contract_atomic` path
- User wants direct transaction (not via commission)
- Trigger disabled or error in trigger execution

---

## 4️⃣ Transaction Details Analysis

### 4a. Which Date Should Be Used?

**Options:**
1. **Contract `start_date`** - When rent period begins
2. **Contract creation date (today)** - When contract is signed
3. **First payment date** - Based on `payment_day_of_month`

**Current Implementation (via commission):**
- Uses `CURRENT_DATE` (contract creation date)

**Recommendation:**
- Use **contract `start_date`** for transaction date
- This represents when the income period begins
- More accurate for monthly reporting

---

### 4b. Should Deposit Create Separate Transaction?

**Current Behavior:**
- Deposit is stored in `contracts.deposit` field
- No transaction is created for deposit

**Recommendation:**
- ❌ **NO** - Deposit is a security deposit, not income
- Deposit should remain in contract record only
- Only monthly rent should create income transaction

---

### 4c. One-Time vs Recurring Transaction?

**Current Implementation:**
- One-time transaction when contract is created

**User Requirement:**
- "Realtor income = Monthly rent amount (1:1 ratio)"
- "35,000 TL rent = 35,000 TL realtor income"

**Interpretation:**
- This suggests **one-time transaction** for the first month's commission
- NOT recurring monthly transactions

**Recommendation:**
- ✅ **One-time transaction** - Create transaction when contract is created
- Amount = `rent_amount` (monthly rent)
- Date = `start_date` (when rent period begins)

---

## 5️⃣ Proposed Solution

### Option A: Direct Transaction Creation (Recommended)

**Approach:** Create transaction directly in `createContractWithEntities()` after RPC call

**Pros:**
- ✅ Explicit and clear
- ✅ No dependency on trigger chain
- ✅ Can use contract `start_date` for transaction date
- ✅ Full control over transaction details

**Cons:**
- ❌ Requires code change in service layer
- ❌ Not atomic with contract creation (separate call)

**Implementation Location:**
- File: `src/services/contractCreation.service.ts`
- After line 181 (after RPC call succeeds)

**Code:**
```typescript
// After contract creation succeeds
if (result.success && result.contract_id) {
  // Create finance transaction
  const { createTransaction } = await import('./finance/transactions.service');
  await createTransaction({
    transaction_date: formData.start_date.toISOString().split('T')[0],
    type: 'income',
    category: 'Rental Income',
    subcategory: 'Monthly Rent',
    amount: formData.rent_amount,
    currency: formData.currency || 'TRY',
    description: `Kira geliri: ${formData.rent_amount} TL`,
    contract_id: result.contract_id,
    property_id: result.property_id,
    payment_status: 'completed',
    payment_method: 'bank_transfer'
  });
}
```

---

### Option B: Database Trigger (Alternative)

**Approach:** Create a new trigger that creates transaction directly from contract (bypassing commission)

**Pros:**
- ✅ Atomic with contract creation
- ✅ Automatic for all contract creation paths
- ✅ No code changes needed

**Cons:**
- ❌ May conflict with existing commission trigger
- ❌ Harder to debug
- ❌ Less flexible

**Implementation:**
- Create new trigger function `create_contract_transaction()`
- Trigger on `contracts` table AFTER INSERT
- Check if transaction already exists (via commission or direct)

---

### Option C: Fix Existing Trigger Chain

**Approach:** Ensure `trigger_create_rental_commission` fires for `create_contract_atomic`

**Pros:**
- ✅ Uses existing infrastructure
- ✅ No code changes

**Cons:**
- ❌ May not be what user wants (they want direct transaction, not commission-based)
- ❌ Transaction category is "Rental Commissions" not "Rental Income"

---

## 6️⃣ Recommended Implementation Plan

### Step 1: Choose Approach
- **Recommended:** Option A (Direct Transaction Creation)
- **Reason:** Clear, explicit, matches user requirement (rent = income, not commission)

### Step 2: Implementation Details

**File to Modify:** `src/services/contractCreation.service.ts`

**Location:** After line 181 (after RPC success check)

**Transaction Details:**
- `transaction_date`: `formData.start_date` (ISO format)
- `type`: `'income'`
- `category`: `'Rental Income'` (or user preference)
- `subcategory`: `'Monthly Rent'`
- `amount`: `formData.rent_amount`
- `currency`: `formData.currency || 'TRY'`
- `description`: `Kira geliri: ${formData.rent_amount} TL` (or localized)
- `contract_id`: `result.contract_id`
- `property_id`: `result.property_id`
- `payment_status`: `'completed'`
- `payment_method`: `'bank_transfer'` (or null)

### Step 3: Error Handling
- If transaction creation fails, log error but don't fail contract creation
- Or: Make it optional with user preference

### Step 4: Testing
- Create contract with 35,000 TL rent
- Verify transaction appears in finance module
- Verify amount = 35,000 TL
- Verify date = contract start_date
- Verify contract_id link works

---

## 7️⃣ Questions to Clarify with User

1. **Transaction Category:**
   - Use "Rental Income" or "Rental Commissions"?
   - Current commission path uses "Rental Commissions"

2. **Transaction Date:**
   - Use contract `start_date` or creation date (today)?

3. **Error Handling:**
   - If transaction creation fails, should contract creation fail too?
   - Or log error and continue?

4. **Existing Contracts:**
   - Should we backfill transactions for existing contracts?

5. **Deposit:**
   - Confirm: No transaction for deposit (security deposit, not income)?

---

## 8️⃣ Summary

**Key Findings:**
1. ✅ Finance module structure is clear and ready
2. ✅ Transaction service function exists and works
3. ✅ Contract creation flow is well-defined
4. ⚠️ Trigger chain exists but may not be working for `create_contract_atomic`
5. ✅ All required data is available after contract creation

**Recommended Action:**
- Implement **Option A** (Direct Transaction Creation)
- Add transaction creation in `contractCreation.service.ts` after RPC call
- Use contract `start_date` for transaction date
- Use `rent_amount` for transaction amount
- Link via `contract_id` and `property_id`

**Files to Modify:**
- `src/services/contractCreation.service.ts` (add transaction creation)

**No Database Changes Required** (unless choosing Option B)

---

**End of Analysis**

