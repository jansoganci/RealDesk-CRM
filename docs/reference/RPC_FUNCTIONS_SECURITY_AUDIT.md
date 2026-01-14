# RPC Functions Security Audit Report

## 📋 Summary

**Date:** 2026-01-08  
**Audited Functions:** 6 RPC functions  
**Status:** 4 ✅ SAFE, 2 ❌ UNSAFE, 1 ⚠️ NEEDS REVIEW

### Quick Results
- ✅ **SAFE:** `rpc_create_tenant_with_contract`, `rpc_create_contract_and_update_property`, `create_contract_atomic`
- ❌ **UNSAFE:** `rpc_update_contract_status`, `rpc_delete_contract`
- ⚠️ **NEEDS REVIEW:** `create_sale_commission` (validates user_id but not org_id)

---

## 🔍 Detailed Analysis

### 1. `rpc_create_tenant_with_contract`

**Status:** ✅ **SAFE**

**Security Validation:**
- ✅ Gets `org_id` from `org_members` table
- ✅ Validates user is authenticated
- ✅ Validates user has active org membership
- ✅ All INSERTs include `org_id`
- ✅ Property update checks `org_id` matches

**Code Snippet:**
```sql
-- Gets org_id from org_members
SELECT org_id INTO v_org_id
FROM org_members
WHERE user_id = v_user_id AND status = 'active'
LIMIT 1;

IF v_org_id IS NULL THEN
  RAISE EXCEPTION 'No active organization found for user.';
END IF;

-- Property update validates org_id
UPDATE properties
SET status = 'Occupied'
WHERE id = v_property_id
  AND org_id = v_org_id;  -- ✅ Security check
```

**Vulnerability:** None - properly validates org_id before all operations.

**Recommendation:** No changes needed.

---

### 2. `rpc_create_contract_and_update_property`

**Status:** ✅ **SAFE**

**Security Validation:**
- ✅ Gets `org_id` from `org_members` table
- ✅ Validates user is authenticated
- ✅ Validates user has active org membership
- ✅ All INSERTs include `org_id`
- ✅ Property update checks `org_id` matches

**Code Snippet:**
```sql
-- Gets org_id from org_members
SELECT org_id INTO v_org_id
FROM org_members
WHERE user_id = v_user_id AND status = 'active'
LIMIT 1;

IF v_org_id IS NULL THEN
  RAISE EXCEPTION 'No active organization found for user.';
END IF;

-- Property update validates org_id
UPDATE properties
SET status = 'Occupied'
WHERE id = v_property_id
  AND org_id = v_org_id;  -- ✅ Security check
```

**Vulnerability:** None - properly validates org_id before all operations.

**Recommendation:** No changes needed.

---

### 3. `rpc_update_contract_status`

**Status:** ❌ **UNSAFE**

**Security Validation:**
- ❌ **NO org_id validation**
- ❌ **NO check if contract belongs to user's org**
- ✅ Only checks if contract exists (any contract, any org)

**Code Snippet:**
```sql
-- ❌ UNSAFE: No org_id check
SELECT * INTO v_contract 
FROM public.contracts 
WHERE id = p_contract_id;  -- ❌ Can access ANY contract from ANY org

-- ❌ UNSAFE: Updates without org_id validation
UPDATE public.contracts
SET status = p_new_status
WHERE id = p_contract_id;  -- ❌ No org_id check
```

**Vulnerability:** 
- **CRITICAL:** User from Org A can update contracts from Org B
- **CRITICAL:** User can modify contract status of any organization
- **Bypasses RLS:** Since function uses `SECURITY DEFINER`, RLS policies are bypassed

**Attack Scenario:**
1. User from Org A knows contract_id from Org B (could be leaked via API response, logs, etc.)
2. User calls `rpc_update_contract_status(contract_id_from_org_b, 'Archived')`
3. Function updates contract without checking org_id
4. Org B's contract is modified by Org A user

**Recommended Fix:**
```sql
CREATE OR REPLACE FUNCTION rpc_update_contract_status(
  p_contract_id uuid,
  p_new_status text
) RETURNS public.contracts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts;
  v_old_status text;
  v_active_contracts_count int;
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- ✅ Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- ✅ Get user's org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user';
  END IF;
  
  -- ✅ Get contract AND validate it belongs to user's org
  SELECT * INTO v_contract 
  FROM public.contracts 
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied: %', p_contract_id;
  END IF;
  
  -- Rest of function...
END;
$$;
```

---

### 4. `rpc_delete_contract`

**Status:** ❌ **UNSAFE**

**Security Validation:**
- ❌ **NO org_id validation**
- ❌ **NO check if contract belongs to user's org**
- ✅ Only checks if contract exists (any contract, any org)

**Code Snippet:**
```sql
-- ❌ UNSAFE: No org_id check
SELECT * INTO v_contract
FROM public.contracts
WHERE id = p_contract_id;  -- ❌ Can access ANY contract from ANY org

-- ❌ UNSAFE: Deletes without org_id validation
DELETE FROM public.contracts WHERE id = p_contract_id;  -- ❌ No org_id check
```

**Vulnerability:**
- **CRITICAL:** User from Org A can delete contracts from Org B
- **CRITICAL:** User can delete any contract from any organization
- **Bypasses RLS:** Since function uses `SECURITY DEFINER`, RLS policies are bypassed

**Attack Scenario:**
1. User from Org A knows contract_id from Org B
2. User calls `rpc_delete_contract(contract_id_from_org_b)`
3. Function deletes contract without checking org_id
4. Org B's contract is deleted by Org A user

**Recommended Fix:**
```sql
CREATE OR REPLACE FUNCTION rpc_delete_contract(
  p_contract_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.contracts;
  v_active_contracts_count int;
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- ✅ Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- ✅ Get user's org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user';
  END IF;
  
  -- ✅ Get contract AND validate it belongs to user's org
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied: %', p_contract_id;
  END IF;
  
  -- ✅ Delete with org_id validation
  DELETE FROM public.contracts 
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check
  
  -- Rest of function...
END;
$$;
```

---

### 5. `create_contract_atomic`

**Status:** ✅ **SAFE**

**Security Validation:**
- ✅ Gets `org_id` from `org_members` table
- ✅ Validates user is authenticated
- ✅ Validates user is active owner (not just member)
- ✅ All INSERTs include `org_id`
- ✅ All SELECTs filter by `org_id`
- ✅ All UPDATEs filter by `org_id`

**Code Snippet:**
```sql
-- ✅ Gets org_id and validates user is owner
SELECT org_id INTO v_org_id
FROM org_members
WHERE user_id = user_id_param
  AND status = 'active'
  AND role = 'owner'  -- ✅ Requires owner role
LIMIT 1;

IF v_org_id IS NULL THEN
  RAISE EXCEPTION 'User is not an active owner of any organization';
END IF;

-- ✅ All operations filter by org_id
SELECT id INTO v_owner_id
FROM property_owners
WHERE tc_hash = owner_data->>'tc_hash'
  AND user_id = user_id_param
  AND org_id = v_org_id  -- ✅ Security check
LIMIT 1;
```

**Vulnerability:** None - properly validates org_id and requires owner role.

**Recommendation:** No changes needed.

---

### 6. `create_sale_commission`

**Status:** ⚠️ **NEEDS REVIEW**

**Security Validation:**
- ✅ Validates user is authenticated
- ✅ Validates user owns the property (checks `user_id`)
- ❌ **NO org_id validation**
- ❌ **NO check if property belongs to user's org**

**Code Snippet:**
```sql
-- ✅ Checks user_id
SELECT address, user_id
INTO v_property_address, v_property_user_id
FROM properties
WHERE id = p_property_id;

-- ✅ Validates user owns property
IF v_property_user_id != v_current_user_id THEN
  RAISE EXCEPTION 'Access denied: You can only create sale commissions for your own properties';
END IF;

-- ❌ MISSING: No org_id check
-- If user has multiple orgs, they could create commission for property from different org
```

**Vulnerability:**
- **MEDIUM:** If a user belongs to multiple organizations, they could create a commission for a property from Org A while being in Org B context
- **Scenario:** User is member of Org A and Org B. Property belongs to Org A. User switches context to Org B and calls function. Function checks `user_id` (passes) but doesn't check `org_id` (property is in Org A, user context is Org B).

**Why This Might Be Acceptable:**
- If your system doesn't allow users to belong to multiple orgs, this is safe
- If users can only have one active org at a time, this is safe
- The `user_id` check prevents cross-user access

**Why This Might Be Unsafe:**
- If users can belong to multiple orgs and switch between them
- If frontend doesn't enforce org context properly
- Commission will be created with wrong `org_id` (or no `org_id` if column exists)

**Recommended Fix (If Multi-Org Support):**
```sql
CREATE OR REPLACE FUNCTION create_sale_commission(
    p_property_id UUID,
    p_sale_price NUMERIC,
    p_currency TEXT DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
    v_commission_id UUID;
    v_commission_amount NUMERIC;
    v_property_address TEXT;
    v_property_user_id UUID;
    v_property_org_id UUID;  -- ✅ Add this
    v_current_user_id UUID;
    v_user_org_id UUID;  -- ✅ Add this
BEGIN
    v_current_user_id := auth.uid();
    
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated. Please log in.';
    END IF;
    
    -- ✅ Get user's org_id
    SELECT org_id INTO v_user_org_id
    FROM org_members
    WHERE user_id = v_current_user_id AND status = 'active'
    LIMIT 1;
    
    IF v_user_org_id IS NULL THEN
        RAISE EXCEPTION 'No active organization found for user';
    END IF;
    
    -- ✅ Get property with org_id
    SELECT address, user_id, org_id
    INTO v_property_address, v_property_user_id, v_property_org_id
    FROM properties
    WHERE id = p_property_id;
    
    IF v_property_address IS NULL THEN
        RAISE EXCEPTION 'Property with id % not found', p_property_id;
    END IF;
    
    -- ✅ Validate user owns property
    IF v_property_user_id != v_current_user_id THEN
        RAISE EXCEPTION 'Access denied: You can only create sale commissions for your own properties';
    END IF;
    
    -- ✅ Validate property belongs to user's org
    IF v_property_org_id != v_user_org_id THEN
        RAISE EXCEPTION 'Access denied: Property does not belong to your organization';
    END IF;
    
    -- Rest of function with org_id in INSERT...
END;
$$;
```

**Recommendation:** 
- If users can only belong to one org → Current implementation is acceptable
- If users can belong to multiple orgs → Add org_id validation (fix above)

---

## 🎯 Summary Table

| Function | SECURITY DEFINER | org_id Validation | Cross-Org Safe | Status |
|----------|------------------|-------------------|---------------|--------|
| `rpc_create_tenant_with_contract` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ SAFE |
| `rpc_create_contract_and_update_property` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ SAFE |
| `rpc_update_contract_status` | ✅ Yes | ❌ No | ❌ No | ❌ **UNSAFE** |
| `rpc_delete_contract` | ✅ Yes | ❌ No | ❌ No | ❌ **UNSAFE** |
| `create_contract_atomic` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ SAFE |
| `create_sale_commission` | ✅ Yes | ❌ No* | ⚠️ Maybe | ⚠️ **NEEDS REVIEW** |

*Validates `user_id` but not `org_id`

---

## 🚨 Critical Issues Found

### Issue 1: `rpc_update_contract_status` - Cross-Org Contract Modification
**Severity:** 🔴 **CRITICAL**  
**Impact:** Users can modify contracts from other organizations  
**Fix Required:** Add org_id validation (see Recommended Fix above)

### Issue 2: `rpc_delete_contract` - Cross-Org Contract Deletion
**Severity:** 🔴 **CRITICAL**  
**Impact:** Users can delete contracts from other organizations  
**Fix Required:** Add org_id validation (see Recommended Fix above)

---

## 📝 Recommended Actions

### Immediate (High Priority)
1. ✅ **Fix `rpc_update_contract_status`** - Add org_id validation
2. ✅ **Fix `rpc_delete_contract`** - Add org_id validation

### Review (Medium Priority)
3. ⚠️ **Review `create_sale_commission`** - Determine if multi-org support is needed
   - If yes → Add org_id validation
   - If no → Document that single-org assumption is safe

### Verification (After Fixes)
4. ✅ **Test fixes** - Verify cross-org access is blocked
5. ✅ **Update security tests** - Add test cases for RPC functions

---

## 🔒 Security Best Practices Applied

### ✅ Good Practices Found
- Most functions get `org_id` from `org_members` table
- Functions validate user authentication
- Functions use `SET search_path = public` to prevent injection
- Functions include proper error messages

### ❌ Missing Practices
- Some functions don't validate `org_id` before operations
- Some functions don't check if resources belong to user's org
- No consistent pattern for org_id validation across all functions

---

## 📚 Migration Files Reference

- `20260104000004_fix_rpc_org_id_injection.sql` - Fixed 3 functions with org_id
- `20250105000003_fix_contract_rpc_org_id.sql` - Fixed `create_contract_atomic` with org_id
- `20250103000000_add_contract_validation_rpcs.sql` - Created `rpc_update_contract_status` and `rpc_delete_contract` (needs update)
- `20250111000003_phase4_triggers_and_rpc_security.sql` - Secured `create_sale_commission` (user_id only)

---

## ✅ Next Steps

1. **Create migration** to fix `rpc_update_contract_status` and `rpc_delete_contract`
2. **Test fixes** in development environment
3. **Run security tests** to verify cross-org isolation
4. **Review `create_sale_commission`** based on multi-org requirements
5. **Document** security assumptions (single-org vs multi-org)

---

**Report Generated:** 2026-01-08  
**Auditor:** Security Analysis  
**Status:** 2 Critical Issues Found - Immediate Action Required
