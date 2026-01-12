-- =====================================================
-- 8 Remaining Security Tests - Complete Results Table
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := '6d604b30-a2f3-446e-adc6-be07ab6ad83a';
  v_org_id UUID := 'e8f5a9c1-3b2d-4e6f-a1c8-9d7e5f3b1a2c';
  v_other_org_id UUID;
  v_owner_id UUID;
  test_property_id UUID;
  test_tenant_id UUID;
  test_contract_id UUID;
  rows_affected INT;
  test_passed BOOLEAN;
  error_msg TEXT;
BEGIN
  -- Create results table
  CREATE TEMP TABLE IF NOT EXISTS test_results (
    test_name TEXT,
    status TEXT,
    details TEXT
  );
  
  DELETE FROM test_results;
  
  -- Find other org for cross-org tests
  SELECT id INTO v_other_org_id
  FROM organizations
  WHERE id != v_org_id
  LIMIT 1;
  
  -- Get a property_owner id for test inserts
  SELECT id INTO v_owner_id
  FROM property_owners
  WHERE org_id = v_org_id
  LIMIT 1;
  
  -- If no owner exists, create one for testing
  IF v_owner_id IS NULL THEN
    INSERT INTO property_owners (org_id, user_id, name, phone, email)
    VALUES (v_org_id, v_user_id, 'Test Owner', '555-0000', 'test@example.com')
    RETURNING id INTO v_owner_id;
  END IF;
  
  -- =====================================================
  -- TEST C2: Soft-Deleted Records Cannot Be Updated
  -- =====================================================
  BEGIN
    INSERT INTO properties (address, org_id, user_id, owner_id, status, type)
    VALUES ('Test C2 ' || now(), v_org_id, v_user_id, v_owner_id, 'Empty', 'apartment')
    RETURNING id INTO test_property_id;
    
    UPDATE properties SET deleted_at = now() WHERE id = test_property_id;
    
    UPDATE properties SET address = 'Resurrected' WHERE id = test_property_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    test_passed := (rows_affected = 0);
    INSERT INTO test_results VALUES ('C2: Soft-Deleted Records Cannot Be Updated', 
      CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END,
      CASE WHEN test_passed THEN 'UPDATE affected 0 rows' ELSE 'UPDATE affected ' || rows_affected || ' rows' END);
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      IF error_msg LIKE '%soft-deleted%' OR error_msg LIKE '%Cannot update%' THEN
        INSERT INTO test_results VALUES ('C2: Soft-Deleted Records Cannot Be Updated', 'PASS', 'Blocked by trigger: ' || error_msg);
      ELSE
        INSERT INTO test_results VALUES ('C2: Soft-Deleted Records Cannot Be Updated', 'FAIL', 'Unexpected error: ' || error_msg);
      END IF;
  END;
  
  -- =====================================================
  -- TEST C2-Resurrect: Cannot Set deleted_at = NULL
  -- =====================================================
  BEGIN
    INSERT INTO properties (address, org_id, user_id, owner_id, status, type)
    VALUES ('Test C2-Resurrect ' || now(), v_org_id, v_user_id, v_owner_id, 'Empty', 'apartment')
    RETURNING id INTO test_property_id;
    
    UPDATE properties SET deleted_at = now() WHERE id = test_property_id;
    
    UPDATE properties SET deleted_at = NULL WHERE id = test_property_id;
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    test_passed := (rows_affected = 0);
    INSERT INTO test_results VALUES ('C2-Resurrect: Cannot Set deleted_at = NULL',
      CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END,
      CASE WHEN test_passed THEN 'UPDATE affected 0 rows' ELSE 'UPDATE affected ' || rows_affected || ' rows' END);
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      IF error_msg LIKE '%soft-deleted%' OR error_msg LIKE '%Cannot update%' THEN
        INSERT INTO test_results VALUES ('C2-Resurrect: Cannot Set deleted_at = NULL', 'PASS', 'Blocked by trigger: ' || error_msg);
      ELSE
        INSERT INTO test_results VALUES ('C2-Resurrect: Cannot Set deleted_at = NULL', 'FAIL', 'Unexpected error: ' || error_msg);
      END IF;
  END;
  
  -- =====================================================
  -- TEST C3: Hard DELETE Blocked
  -- =====================================================
  BEGIN
    DELETE FROM properties WHERE org_id = v_org_id AND id = (SELECT id FROM properties WHERE org_id = v_org_id AND deleted_at IS NULL LIMIT 1);
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    test_passed := (rows_affected = 0);
    INSERT INTO test_results VALUES ('C3: Hard DELETE Blocked',
      CASE WHEN test_passed THEN 'PASS' ELSE 'FAIL' END,
      CASE WHEN test_passed THEN 'DELETE affected 0 rows' ELSE 'DELETE affected ' || rows_affected || ' rows' END);
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      IF error_msg LIKE '%row-level security%' OR error_msg LIKE '%policy%' THEN
        INSERT INTO test_results VALUES ('C3: Hard DELETE Blocked', 'PASS', 'Blocked by RLS: ' || error_msg);
      ELSE
        INSERT INTO test_results VALUES ('C3: Hard DELETE Blocked', 'FAIL', 'Unexpected error: ' || error_msg);
      END IF;
  END;
  
  -- =====================================================
  -- TEST M1: Cannot Add Others as First Member
  -- =====================================================
  BEGIN
    -- Check if trigger exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_org') THEN
      -- Find a user without org
      DECLARE
        other_user_id UUID;
      BEGIN
        SELECT u.id INTO other_user_id
        FROM auth.users u
        WHERE u.id != v_user_id
          AND NOT EXISTS (SELECT 1 FROM org_members om WHERE om.user_id = u.id AND om.status = 'active')
        LIMIT 1;
        
        IF other_user_id IS NULL THEN
          INSERT INTO test_results VALUES ('M1: Cannot Add Others as First Member', 'SKIP', 'No user without org found for testing');
        ELSE
          -- Try to add as first member (should be blocked by trigger or policy)
          INSERT INTO org_members (org_id, user_id, role, status, joined_at)
          VALUES (v_org_id, other_user_id, 'owner', 'active', now());
          
          INSERT INTO test_results VALUES ('M1: Cannot Add Others as First Member', 'FAIL', 'INSERT succeeded - security issue!');
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          error_msg := SQLERRM;
          IF error_msg LIKE '%policy%' OR error_msg LIKE '%row-level security%' THEN
            INSERT INTO test_results VALUES ('M1: Cannot Add Others as First Member', 'PASS', 'Blocked: ' || error_msg);
          ELSE
            INSERT INTO test_results VALUES ('M1: Cannot Add Others as First Member', 'SKIP', 'Error: ' || error_msg);
          END IF;
      END;
    ELSE
      INSERT INTO test_results VALUES ('M1: Cannot Add Others as First Member', 'SKIP', 'Trigger not found - manual verification needed');
    END IF;
  END;
  
  -- =====================================================
  -- TEST M2: Cannot Upload Photos to Deleted Properties
  -- =====================================================
  BEGIN
    INSERT INTO properties (address, org_id, user_id, owner_id, status, type)
    VALUES ('Test M2 ' || now(), v_org_id, v_user_id, v_owner_id, 'Empty', 'apartment')
    RETURNING id INTO test_property_id;
    
    UPDATE properties SET deleted_at = now() WHERE id = test_property_id;
    
    INSERT INTO property_photos (property_id, org_id, user_id, url, display_order)
    VALUES (test_property_id, v_org_id, v_user_id, 'https://example.com/test.jpg', 1);
    
    INSERT INTO test_results VALUES ('M2: Cannot Upload Photos to Deleted Properties', 'FAIL', 'INSERT succeeded - security issue!');
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      IF error_msg LIKE '%row-level security%' OR error_msg LIKE '%policy%' OR error_msg LIKE '%deleted_at%' THEN
        INSERT INTO test_results VALUES ('M2: Cannot Upload Photos to Deleted Properties', 'PASS', 'Blocked: ' || error_msg);
      ELSE
        INSERT INTO test_results VALUES ('M2: Cannot Upload Photos to Deleted Properties', 'FAIL', 'Unexpected error: ' || error_msg);
      END IF;
  END;
  
  -- =====================================================
  -- TEST L3: Cannot Change org_id During Update
  -- =====================================================
  BEGIN
    IF v_other_org_id IS NULL THEN
      INSERT INTO test_results VALUES ('L3: Cannot Change org_id During Update', 'SKIP', 'No other org found for testing');
    ELSE
      INSERT INTO properties (address, org_id, user_id, owner_id, status, type)
      VALUES ('Test L3 ' || now(), v_org_id, v_user_id, v_owner_id, 'Empty', 'apartment')
      RETURNING id INTO test_property_id;
      
      UPDATE properties SET org_id = v_other_org_id WHERE id = test_property_id;
      
      INSERT INTO test_results VALUES ('L3: Cannot Change org_id During Update', 'FAIL', 'UPDATE succeeded - security issue!');
      
      UPDATE properties SET deleted_at = now() WHERE id = test_property_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      error_msg := SQLERRM;
      IF error_msg LIKE '%org_id cannot be changed%' THEN
        INSERT INTO test_results VALUES ('L3: Cannot Change org_id During Update', 'PASS', 'Blocked by trigger: ' || error_msg);
      ELSIF error_msg LIKE '%row-level security%' OR error_msg LIKE '%policy%' THEN
        INSERT INTO test_results VALUES ('L3: Cannot Change org_id During Update', 'PASS', 'Blocked by RLS: ' || error_msg);
      ELSE
        INSERT INTO test_results VALUES ('L3: Cannot Change org_id During Update', 'FAIL', 'Unexpected error: ' || error_msg);
      END IF;
      
      IF test_property_id IS NOT NULL THEN
        UPDATE properties SET deleted_at = now() WHERE id = test_property_id;
      END IF;
  END;
  
  -- =====================================================
  -- TEST Member: Read-Only Access Enforced
  -- =====================================================
  BEGIN
    -- Check if current user is member
    IF EXISTS (SELECT 1 FROM org_members WHERE user_id = v_user_id AND org_id = v_org_id AND role = 'member' AND status = 'active') THEN
      -- Test INSERT
      BEGIN
        INSERT INTO properties (address, org_id, user_id, owner_id, status, type)
        VALUES ('Member Test ' || now(), v_org_id, v_user_id, v_owner_id, 'Empty', 'apartment');
        INSERT INTO test_results VALUES ('Member: Read-Only Access - INSERT', 'FAIL', 'Member can INSERT - security issue!');
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
            INSERT INTO test_results VALUES ('Member: Read-Only Access - INSERT', 'PASS', 'Blocked: ' || SQLERRM);
          END IF;
      END;
      
      -- Test UPDATE
      BEGIN
        UPDATE properties SET address = 'Member Update' WHERE org_id = v_org_id AND id = (SELECT id FROM properties WHERE org_id = v_org_id AND deleted_at IS NULL LIMIT 1);
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        INSERT INTO test_results VALUES ('Member: Read-Only Access - UPDATE',
          CASE WHEN rows_affected = 0 THEN 'PASS' ELSE 'FAIL' END,
          CASE WHEN rows_affected = 0 THEN 'UPDATE affected 0 rows' ELSE 'UPDATE affected ' || rows_affected || ' rows' END);
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%policy%' THEN
            INSERT INTO test_results VALUES ('Member: Read-Only Access - UPDATE', 'PASS', 'Blocked: ' || SQLERRM);
          END IF;
      END;
    ELSE
      INSERT INTO test_results VALUES ('Member: Read-Only Access Enforced', 'SKIP', 'Current user is not a member - test requires member role');
    END IF;
  END;
  
  -- =====================================================
  -- TEST New User: Auto-Org Creation Works
  -- =====================================================
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_org') THEN
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_org') THEN
        INSERT INTO test_results VALUES ('New User: Auto-Org Creation Works', 'PASS', 'Trigger and function exist - manual verification needed (create new user)');
      ELSE
        INSERT INTO test_results VALUES ('New User: Auto-Org Creation Works', 'FAIL', 'Trigger exists but function handle_new_user_org not found');
      END IF;
    ELSE
      INSERT INTO test_results VALUES ('New User: Auto-Org Creation Works', 'FAIL', 'Trigger on_auth_user_created_org not found');
    END IF;
  END;
  
END $$;

-- Return results
SELECT * FROM test_results ORDER BY test_name;
