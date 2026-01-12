-- =====================================================
-- FIX: Add org_id Security to Contract RPC Functions
-- =====================================================
--
-- PROBLEM:
-- Two RPC functions (rpc_update_contract_status and rpc_delete_contract)
-- do NOT validate org_id, allowing cross-org access.
--
-- SECURITY ISSUE:
-- Users from Org A can update/delete contracts from Org B.
-- This bypasses RLS because functions use SECURITY DEFINER.
--
-- SOLUTION:
-- Add org_id validation to both functions:
-- 1. Get user's org_id from org_members
-- 2. Validate contract belongs to user's org before operations
-- 3. Add org_id checks to all UPDATE/DELETE operations
--
-- AFFECTED FUNCTIONS:
-- 1. rpc_update_contract_status
-- 2. rpc_delete_contract
--
-- SAFE: Idempotent, can run multiple times
-- ROLLBACK: Re-run 20250103000000_add_contract_validation_rpcs.sql
--
-- =====================================================

-- ============================================================================
-- FIX 1: Secure rpc_update_contract_status with org_id validation
-- ============================================================================

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
  -- ✅ Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;
  
  -- ✅ Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;
  
  -- ✅ Get contract AND validate it belongs to user's org
  SELECT * INTO v_contract 
  FROM public.contracts 
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only contracts from user's org
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied: %', p_contract_id;
  END IF;
  
  v_old_status := v_contract.status;
  
  -- ✅ Update contract with org_id validation
  UPDATE public.contracts
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only update contracts from user's org
  
  -- ✅ Get updated contract
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;
  
  -- If contract was Active and new status is not Active, check property status
  IF v_old_status = 'Active' AND p_new_status != 'Active' THEN
    -- Check if property has any other active contracts (from same org)
    SELECT COUNT(*) INTO v_active_contracts_count
    FROM public.contracts
    WHERE property_id = v_contract.property_id
      AND status = 'Active'
      AND id != p_contract_id
      AND org_id = v_org_id;  -- ✅ Security check: only count contracts from same org
    
    -- If no active contracts remain, set property to Empty
    IF v_active_contracts_count = 0 THEN
      UPDATE public.properties
      SET status = 'Empty',
          updated_at = NOW()
      WHERE id = v_contract.property_id
        AND org_id = v_org_id;  -- ✅ Security check: only update properties from user's org
    END IF;
  END IF;
  
  -- If contract is being activated, set property to Occupied
  IF p_new_status = 'Active' AND v_old_status != 'Active' THEN
    -- Note: The unique index uniq_active_contract_per_property will prevent multiple active contracts
    -- Set property to Occupied
    UPDATE public.properties
    SET status = 'Occupied',
        updated_at = NOW()
    WHERE id = v_contract.property_id
      AND org_id = v_org_id;  -- ✅ Security check: only update properties from user's org
  END IF;
  
  RETURN v_contract;
END;
$$;

-- ============================================================================
-- FIX 2: Secure rpc_delete_contract with org_id validation
-- ============================================================================

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
  -- ✅ Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;
  
  -- ✅ Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;
  
  -- ✅ Get contract AND validate it belongs to user's org
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only contracts from user's org
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied: %', p_contract_id;
  END IF;
  
  -- ✅ Delete the contract with org_id validation
  DELETE FROM public.contracts 
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only delete contracts from user's org
  
  -- If deleted contract was Active, check if property should be set to Empty
  IF v_contract.status = 'Active' THEN
    -- Check if property has any other active contracts (from same org)
    SELECT COUNT(*) INTO v_active_contracts_count
    FROM public.contracts
    WHERE property_id = v_contract.property_id
      AND status = 'Active'
      AND org_id = v_org_id;  -- ✅ Security check: only count contracts from same org
    
    -- If no active contracts remain, set property to Empty
    IF v_active_contracts_count = 0 THEN
      UPDATE public.properties
      SET status = 'Empty',
          updated_at = NOW()
      WHERE id = v_contract.property_id
        AND org_id = v_org_id;  -- ✅ Security check: only update properties from user's org
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'property_id', v_contract.property_id);
END;
$$;

-- ============================================================================
-- Grant Permissions (idempotent)
-- ============================================================================

GRANT EXECUTE ON FUNCTION rpc_update_contract_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_delete_contract(uuid) TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  update_function_exists BOOLEAN;
  delete_function_exists BOOLEAN;
  update_has_org_check BOOLEAN;
  delete_has_org_check BOOLEAN;
BEGIN
  -- Check if functions exist
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rpc_update_contract_status'
  ) INTO update_function_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'rpc_delete_contract'
  ) INTO delete_function_exists;
  
  IF NOT update_function_exists THEN
    RAISE EXCEPTION 'FAILED: rpc_update_contract_status function not found';
  END IF;
  
  IF NOT delete_function_exists THEN
    RAISE EXCEPTION 'FAILED: rpc_delete_contract function not found';
  END IF;
  
  -- Check if functions have org_id validation
  SELECT prosrc LIKE '%org_id = v_org_id%' INTO update_has_org_check
  FROM pg_proc
  WHERE proname = 'rpc_update_contract_status';
  
  SELECT prosrc LIKE '%org_id = v_org_id%' INTO delete_has_org_check
  FROM pg_proc
  WHERE proname = 'rpc_delete_contract';
  
  IF NOT update_has_org_check THEN
    RAISE EXCEPTION 'FAILED: rpc_update_contract_status missing org_id validation';
  END IF;
  
  IF NOT delete_has_org_check THEN
    RAISE EXCEPTION 'FAILED: rpc_delete_contract missing org_id validation';
  END IF;
  
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ RPC FUNCTIONS SECURED WITH org_id VALIDATION';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions updated:';
  RAISE NOTICE '  1. rpc_update_contract_status - ✅ Secured';
  RAISE NOTICE '  2. rpc_delete_contract - ✅ Secured';
  RAISE NOTICE '';
  RAISE NOTICE 'Security improvements:';
  RAISE NOTICE '  - Added org_id lookup from org_members';
  RAISE NOTICE '  - Added org_id validation to all SELECT queries';
  RAISE NOTICE '  - Added org_id validation to all UPDATE operations';
  RAISE NOTICE '  - Added org_id validation to all DELETE operations';
  RAISE NOTICE '  - Cross-org access is now blocked';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Validation passed: All functions secured';
  RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
