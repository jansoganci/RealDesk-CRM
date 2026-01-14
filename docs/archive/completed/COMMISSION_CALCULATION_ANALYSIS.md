# Commission Calculation & Financial Record Creation - Technical Analysis

## 📋 Executive Summary

This document provides a complete technical analysis of the automated commission calculation system. The system currently **automatically sets commission = 1 month's rent** and creates financial records via database triggers.

**Current Behavior:**
- Commission amount = `rent_amount` (1 month rent)
- Commission created automatically via PostgreSQL trigger
- Financial transaction created automatically via second trigger
- **No manual input field** - completely automated

**User Requirement:**
- Need manual commission input field
- Override auto-calculation for shared portfolios/commissions

---

## 🔍 Complete Data Flow Analysis

### **Flow Diagram**

```
User Input (Frontend)
  ↓
ContractDetailsSection.tsx (rent_amount field)
  ↓
ContractFormData.rent_amount (number)
  ↓
contractCreation.service.ts → prepare contractData
  ↓
RPC: create_contract_atomic() → INSERT INTO contracts
  ↓
[TRIGGER 1] create_rental_commission() → INSERT INTO commissions
  ↓
[TRIGGER 2] create_commission_transaction() → INSERT INTO financial_transactions
  ↓
Final Result: Commission + Financial Transaction Created
```

---

## 📁 Files Involved

### **1. Frontend Form Component**

**File:** `src/features/contracts/components/form-sections/ContractDetailsSection.tsx`  
**Lines:** 172-188

**Current Implementation:**
```typescript
<Input
  id="rent_amount"
  type="number"
  placeholder="10000"
  {...form.register('rent_amount', { valueAsNumber: true })}
/>
```

**Status:** ✅ Only collects `rent_amount` - **NO commission field**

---

### **2. Form Schema**

**File:** `src/features/contracts/schemas/contractForm.schema.ts`

**Current Schema:**
```typescript
rent_amount: z.number({
  required_error: t('rentRequired'),
  invalid_type_error: t('validNumber'),
})
.min(1, t('rentGreaterThanZero'))
.max(1000000000, t('invalidAmount')),
```

**Status:** ✅ Only validates `rent_amount` - **NO commission field in schema**

---

### **3. Contract Creation Service**

**File:** `src/services/contractCreation.service.ts`  
**Lines:** 111-117, 165-172

**Current Implementation:**
```typescript
const contractData = {
  start_date: toISODate(formData.start_date),
  end_date: toISODate(formData.end_date),
  rent_amount: formData.rent_amount,  // ← Used for commission calculation
  deposit: formData.deposit,
  currency: formData.currency || 'TRY'
};

// Call RPC
const { data, error } = await supabase.rpc('create_contract_atomic' as any, {
  owner_data: ownerData,
  tenant_data: tenantData,
  property_data: propertyData,
  contract_data: contractData,  // ← Contains rent_amount
  contract_details_data: contractDetailsData,
  user_id_param: userId
});
```

**Status:** ✅ Passes `rent_amount` to RPC - **NO commission amount passed**

---

### **4. Database RPC Function**

**File:** `supabase/migrations/20251120_contract_atomic_transaction.sql`  
**Lines:** 202-224

**Current Implementation:**
```sql
INSERT INTO contracts (
  user_id,
  tenant_id,
  property_id,
  start_date,
  end_date,
  rent_amount,  -- ← This value triggers commission calculation
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
  (contract_data->>'rent_amount')::numeric,  -- ← Stored in contracts table
  (contract_data->>'deposit')::numeric,
  'TRY',
  'Active'  -- ← Status must be 'Active' for trigger to fire
)
RETURNING id INTO v_contract_id;
```

**Status:** ✅ Inserts contract with `rent_amount` and `status = 'Active'`  
**Trigger Fires:** ✅ `AFTER INSERT` trigger executes automatically

---

### **5. Commission Creation Trigger (TRIGGER 1)**

**File:** `supabase/migrations/20250105000004_fix_commission_trigger_org_id.sql`  
**Lines:** 22-77

**Function Name:** `create_rental_commission()`  
**Trigger Name:** `trigger_create_rental_commission`  
**Trigger Event:** `AFTER INSERT OR UPDATE ON contracts`  
**Trigger Type:** `FOR EACH ROW`

**Current Implementation:**
```sql
CREATE OR REPLACE FUNCTION create_rental_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
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
                RAISE WARNING 'Cannot create commission: org_id not found';
                RETURN NEW;
            END IF;
            
            INSERT INTO commissions (
                property_id,
                contract_id,
                type,
                amount,              -- ← HARDCODED: NEW.rent_amount
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
                NEW.rent_amount,     -- ← COMMISSION = 1 MONTH RENT (HARDCODED)
                NEW.currency,
                p.address,
                'Commission from rental contract',
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

**Key Points:**
- ✅ **Line 61:** `NEW.rent_amount` - **HARDCODED commission calculation**
- ✅ Only fires if `status = 'Active'` AND `rent_amount > 0`
- ✅ Prevents duplicates (checks if commission already exists)
- ✅ Includes `org_id` for multi-tenant support

**Trigger Definition:**
```sql
CREATE TRIGGER trigger_create_rental_commission
    AFTER INSERT OR UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION create_rental_commission();
```

---

### **6. Financial Transaction Creation Trigger (TRIGGER 2)**

**File:** `supabase/migrations/20251125000000_commission_to_transaction_trigger.sql`  
**Lines:** 25-88, 104-107

**Function Name:** `create_commission_transaction()`  
**Trigger Name:** `trigger_commission_to_transaction`  
**Trigger Event:** `AFTER INSERT ON commissions`  
**Trigger Type:** `FOR EACH ROW`

**Current Implementation:**
```sql
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
    END IF;

    -- Skip if amount is zero or null
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
        RETURN NEW;
    END IF;

    -- Insert financial transaction linked to commission
    INSERT INTO financial_transactions (
        user_id,
        org_id,
        transaction_date,
        type,
        category,
        subcategory,
        amount,              -- ← Uses commission.amount (which = rent_amount)
        currency,
        description,
        notes,
        payment_method,
        payment_status,
        property_id,
        contract_id,
        commission_id        -- ← Links back to commission
    ) VALUES (
        NEW.user_id,
        NEW.org_id,
        CURRENT_DATE,         -- ← Transaction date = today (contract creation date)
        'income',
        v_category_name,
        v_subcategory,
        NEW.amount,          -- ← Amount = commission.amount = rent_amount
        COALESCE(NEW.currency, 'TRY'),
        v_description,
        NEW.notes,
        'bank_transfer',     -- ← Default payment method
        'completed',         -- ← Default payment status
        NEW.property_id,
        NEW.contract_id,
        NEW.id               -- ← Links transaction to commission
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Key Points:**
- ✅ **Line 80:** `NEW.amount` - Uses commission amount (which equals `rent_amount`)
- ✅ **Line 76:** `CURRENT_DATE` - Transaction date = contract creation date
- ✅ Creates income transaction with category "Rental Commissions"
- ✅ Links back to commission via `commission_id`

**Trigger Definition:**
```sql
CREATE TRIGGER trigger_commission_to_transaction
    AFTER INSERT ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_transaction();
```

---

## 🗄️ Database Tables Involved

### **1. contracts Table**

**Schema:** `supabase/migrations/20251027212239_create_contracts_table.sql`

**Relevant Columns:**
- `id` (uuid, primary key)
- `rent_amount` (numeric) - **Source of commission calculation**
- `status` (text) - Must be 'Active' for trigger to fire
- `currency` (text) - Used for commission currency
- `property_id` (uuid) - Links to property
- `org_id` (uuid) - For multi-tenant support

**Trigger:** `trigger_create_rental_commission` fires AFTER INSERT/UPDATE

---

### **2. commissions Table**

**Schema:** `supabase/migrations/20250110000000_create_commissions_table.sql`

**Relevant Columns:**
- `id` (uuid, primary key)
- `property_id` (uuid) - Links to property
- `contract_id` (uuid) - Links to contract
- `type` (text) - 'rental' or 'sale'
- `amount` (numeric) - **Currently = rent_amount (HARDCODED)**
- `currency` (text) - From contract currency
- `property_address` (text) - From property address
- `notes` (text) - Default: 'Commission from rental contract'
- `user_id` (uuid) - From property owner
- `org_id` (uuid) - For multi-tenant support
- `created_at` (timestamptz)

**Trigger:** `trigger_commission_to_transaction` fires AFTER INSERT

---

### **3. financial_transactions Table**

**Schema:** `supabase/migrations/20251111130000_create_financial_transactions_table.sql`

**Relevant Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid)
- `org_id` (uuid)
- `transaction_date` (date) - **Currently = CURRENT_DATE (contract creation date)**
- `type` (text) - 'income' or 'expense'
- `category` (text) - 'Rental Commissions'
- `subcategory` (text) - 'Contract Commission'
- `amount` (numeric) - **Currently = commission.amount = rent_amount**
- `currency` (text) - From commission currency
- `description` (text) - 'Kira komisyonu: [property_address]'
- `payment_method` (text) - Default: 'bank_transfer'
- `payment_status` (text) - Default: 'completed'
- `property_id` (uuid) - Links to property
- `contract_id` (uuid) - Links to contract
- `commission_id` (uuid) - **Links back to commission record**

---

## 🔄 Complete Technical Flow

### **Step-by-Step Execution**

1. **User Input (Frontend)**
   - User enters `rent_amount` in `ContractDetailsSection.tsx`
   - Form validates: `rent_amount` must be > 0
   - Form submits: `ContractFormData.rent_amount`

2. **Service Layer Preparation**
   - `contractCreation.service.ts` receives `formData.rent_amount`
   - Prepares `contractData` object with `rent_amount`
   - Calls RPC: `create_contract_atomic()`

3. **Database RPC Execution**
   - `create_contract_atomic()` function executes
   - Creates/finds owner, tenant, property
   - **INSERT INTO contracts** with:
     - `rent_amount` = form value
     - `status` = 'Active'
     - `currency` = form value

4. **Trigger 1: Commission Creation**
   - `trigger_create_rental_commission` fires AFTER INSERT
   - Function `create_rental_commission()` executes
   - Checks: `status = 'Active'` AND `rent_amount > 0`
   - Checks: No existing commission for this contract
   - **INSERT INTO commissions** with:
     - `amount` = `NEW.rent_amount` ← **HARDCODED**
     - `type` = 'rental'
     - `currency` = `NEW.currency`
     - `contract_id` = `NEW.id`

5. **Trigger 2: Financial Transaction Creation**
   - `trigger_commission_to_transaction` fires AFTER INSERT on commissions
   - Function `create_commission_transaction()` executes
   - **INSERT INTO financial_transactions** with:
     - `amount` = `NEW.amount` (from commission)
     - `transaction_date` = `CURRENT_DATE`
     - `category` = 'Rental Commissions'
     - `type` = 'income'
     - `commission_id` = `NEW.id` (links back)

6. **Final State**
   - ✅ Contract created in `contracts` table
   - ✅ Commission created in `commissions` table (amount = rent_amount)
   - ✅ Financial transaction created in `financial_transactions` table

---

## 🎯 Hardcoded Logic Locations

### **Location 1: Commission Amount Calculation**

**File:** `supabase/migrations/20250105000004_fix_commission_trigger_org_id.sql`  
**Line:** 61

```sql
NEW.rent_amount, -- Commission = 1 month rent
```

**Status:** 🔴 **HARDCODED** - Always equals `rent_amount`

---

### **Location 2: Transaction Date**

**File:** `supabase/migrations/20251125000000_commission_to_transaction_trigger.sql`  
**Line:** 76

```sql
CURRENT_DATE,  -- Transaction date = contract creation date
```

**Status:** 🔴 **HARDCODED** - Always uses today's date

---

### **Location 3: Payment Method**

**File:** `supabase/migrations/20251125000000_commission_to_transaction_trigger.sql`  
**Line:** 84

```sql
'bank_transfer',  -- Default payment method
```

**Status:** 🔴 **HARDCODED** - Always 'bank_transfer'

---

### **Location 4: Payment Status**

**File:** `supabase/migrations/20251125000000_commission_to_transaction_trigger.sql`  
**Line:** 85

```sql
'completed',  -- Commission is earned when created
```

**Status:** 🔴 **HARDCODED** - Always 'completed'

---

## 📊 Current Data Flow Summary

| Step | Component | Input | Output | Hardcoded Value |
|------|-----------|-------|--------|-----------------|
| 1 | Frontend Form | User input | `rent_amount` | None |
| 2 | Service Layer | `rent_amount` | `contractData` | None |
| 3 | RPC Function | `contractData` | INSERT contracts | `status = 'Active'` |
| 4 | Trigger 1 | `NEW.rent_amount` | INSERT commissions | **`amount = rent_amount`** |
| 5 | Trigger 2 | `NEW.amount` | INSERT financial_transactions | **`amount = commission.amount`** |

**Result:** Commission amount = Financial transaction amount = `rent_amount` (1 month rent)

---

## 🔧 Where Changes Are Needed

### **To Add Manual Commission Input:**

1. **Frontend Form** (`ContractDetailsSection.tsx`)
   - Add `commission_amount` field
   - Add validation (optional, can be empty for auto-calculation)

2. **Form Schema** (`contractForm.schema.ts`)
   - Add `commission_amount?: number` field
   - Add validation (optional, min 0, max reasonable limit)

3. **Service Layer** (`contractCreation.service.ts`)
   - Pass `commission_amount` to RPC (if provided)
   - Store in `contract_details` table or pass as separate parameter

4. **Database Trigger** (`create_rental_commission()`)
   - Check if `commission_amount` provided
   - If yes: Use provided value
   - If no: Use `rent_amount` (fallback to current behavior)

5. **Database Schema** (Optional)
   - Add `commission_amount` column to `contract_details` table
   - OR pass via RPC parameter and store in trigger context

---

## 📝 Key Findings

### **✅ What Works:**
- Automatic commission creation works correctly
- Financial transaction creation works correctly
- Trigger chain is properly set up
- Multi-tenant support (org_id) included
- Duplicate prevention (checks existing commissions)

### **🔴 What's Hardcoded:**
1. **Commission Amount:** Always = `rent_amount` (Line 61 in trigger)
2. **Transaction Date:** Always = `CURRENT_DATE` (Line 76 in trigger)
3. **Payment Method:** Always = 'bank_transfer' (Line 84 in trigger)
4. **Payment Status:** Always = 'completed' (Line 85 in trigger)

### **⚠️ Current Limitations:**
- No way to override commission amount
- No way to set custom transaction date
- No way to set payment method
- No way to set payment status
- Commission always equals 1 month rent (no sharing/percentage logic)

---

## 🎯 Implementation Strategy (For Future)

### **Option A: Add commission_amount to contract_details**
- Store manual commission in `contract_details.commission_amount`
- Trigger checks: `COALESCE(contract_details.commission_amount, rent_amount)`

### **Option B: Pass commission_amount via RPC**
- Add `commission_amount` to RPC parameters
- Store in trigger context
- Use if provided, otherwise fallback to `rent_amount`

### **Option C: Disable trigger, create commission manually**
- Add flag to disable auto-commission
- Create commission via service layer with manual amount

**Recommendation:** Option A (store in contract_details) - Cleanest separation

---

## 📚 Related Documentation

- `docs/planning/CONTRACT_FINANCE_INTEGRATION_ANALYSIS.md` - Detailed analysis
- `supabase/migrations/20250110000000_create_commissions_table.sql` - Commissions table
- `supabase/migrations/20251111130000_create_financial_transactions_table.sql` - Transactions table

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-13  
**Status:** Analysis Complete - Ready for Implementation Planning
