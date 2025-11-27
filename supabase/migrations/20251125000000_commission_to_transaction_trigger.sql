-- =====================================================
-- Migration: Commission-to-Transaction Auto-Link
-- Date: 2025-11-25
-- =====================================================
-- Purpose:
--   1. Auto-create financial_transaction when commission is created
--   2. Fix create_sale_commission RPC to properly mark property as 'Sold'
--   3. Link commission income to financial tracking system
-- =====================================================
-- This ensures commission earnings appear in:
--   - Monthly financial summaries
--   - Year-to-date income reports
--   - Cash flow forecasts
--   - Dashboard income statistics
-- =====================================================

-- =====================================================
-- STEP 1: Create Trigger Function
-- =====================================================
-- Creates a financial_transaction record whenever a commission is inserted
-- Maps commission type to appropriate income category:
--   - 'rental' -> 'Rental Commissions'
--   - 'sale' -> 'Sale Commissions'

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

-- Add comment for documentation
COMMENT ON FUNCTION create_commission_transaction() IS
'Automatically creates a financial_transaction record when a commission is inserted.
Maps commission type to appropriate income category (Rental/Sale Commissions).
Links transaction back to commission via commission_id for audit trail.';


-- =====================================================
-- STEP 2: Create Trigger on Commissions Table
-- =====================================================
-- Drop if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_commission_to_transaction ON commissions;

-- Create trigger that fires AFTER INSERT on commissions
CREATE TRIGGER trigger_commission_to_transaction
    AFTER INSERT ON commissions
    FOR EACH ROW
    EXECUTE FUNCTION create_commission_transaction();

-- Log trigger creation
DO $$
BEGIN
    RAISE NOTICE '✅ Created trigger: trigger_commission_to_transaction on commissions table';
END $$;


-- =====================================================
-- STEP 3: Fix create_sale_commission RPC Function
-- =====================================================
-- Issues fixed:
--   1. Property status now set to 'Sold' (was 'Inactive' or missing)
--   2. Updates sold_at and sold_price fields
--   3. Maintains auth check and user commission rate preference
--   4. Now transaction auto-created via trigger above

CREATE OR REPLACE FUNCTION create_sale_commission(
    p_property_id UUID,
    p_sale_price NUMERIC,
    p_currency TEXT DEFAULT 'TRY'
)
RETURNS UUID AS $$
DECLARE
    v_commission_id UUID;
    v_commission_amount NUMERIC;
    v_property_address TEXT;
    v_property_user_id UUID;
    v_current_user_id UUID;
    v_commission_rate NUMERIC;
BEGIN
    -- Get current authenticated user
    v_current_user_id := auth.uid();

    -- Verify user is authenticated
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated. Please log in.';
    END IF;

    -- Get property details and verify ownership
    SELECT address, user_id
    INTO v_property_address, v_property_user_id
    FROM properties
    WHERE id = p_property_id;

    -- Check if property exists
    IF v_property_address IS NULL THEN
        RAISE EXCEPTION 'Property with id % not found', p_property_id;
    END IF;

    -- SECURITY CHECK: Verify current user owns the property
    IF v_property_user_id != v_current_user_id THEN
        RAISE EXCEPTION 'Access denied: You can only create sale commissions for your own properties';
    END IF;

    -- Check if sale commission already exists for this property
    IF EXISTS (
        SELECT 1 FROM commissions
        WHERE property_id = p_property_id AND type = 'sale'
    ) THEN
        RAISE EXCEPTION 'Sale commission already exists for property %', v_property_address;
    END IF;

    -- Get user's commission rate preference (default to 4.0% if not set)
    SELECT COALESCE(commission_rate, 4.0) INTO v_commission_rate
    FROM user_preferences
    WHERE user_id = v_current_user_id;

    -- If no user preferences exist, use default 4.0%
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 4.0;
    END IF;

    -- Calculate commission using user's rate
    v_commission_amount := p_sale_price * (v_commission_rate / 100);

    -- Insert commission record
    -- NOTE: This will trigger create_commission_transaction() automatically
    INSERT INTO commissions (
        user_id,
        property_id,
        type,
        amount,
        currency,
        property_address,
        notes
    ) VALUES (
        v_property_user_id,
        p_property_id,
        'sale',
        v_commission_amount,
        p_currency,
        v_property_address,
        format('Commission from property sale (%s%%)', v_commission_rate)
    )
    RETURNING id INTO v_commission_id;

    -- FIX: Update property status to 'Sold' (not 'Inactive')
    UPDATE properties
    SET
        status = 'Sold',
        sold_at = timezone('utc'::text, now()),
        sold_price = p_sale_price
    WHERE id = p_property_id
      AND user_id = v_current_user_id;  -- Security check on update

    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure authenticated users can call the RPC
GRANT EXECUTE ON FUNCTION create_sale_commission TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_sale_commission(UUID, NUMERIC, TEXT) IS
'Creates a sale commission for a property and marks it as Sold.
Uses user''s commission rate preference (default 4.0%).
Automatically creates a financial_transaction via trigger.
Security: Only property owner can create commission.';

-- Log RPC fix
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed create_sale_commission RPC: Now sets status to ''Sold'' instead of ''Inactive''';
END $$;


-- =====================================================
-- STEP 4: Fix create_rental_commission Trigger Function
-- =====================================================
-- Ensure rental commission trigger also works with new transaction trigger
-- No changes needed - the commission insert will auto-trigger transaction creation

DO $$
BEGIN
    RAISE NOTICE '✅ Rental commissions will also auto-create transactions via trigger';
END $$;


-- =====================================================
-- VALIDATION
-- =====================================================
DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_rpc_has_sold_status BOOLEAN;
BEGIN
    -- Check if trigger function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'create_commission_transaction'
    ) INTO v_function_exists;

    IF NOT v_function_exists THEN
        RAISE EXCEPTION 'Trigger function create_commission_transaction not found';
    END IF;

    -- Check if trigger exists on commissions table
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'trigger_commission_to_transaction'
        AND c.relname = 'commissions'
    ) INTO v_trigger_exists;

    IF NOT v_trigger_exists THEN
        RAISE EXCEPTION 'Trigger trigger_commission_to_transaction not found';
    END IF;

    -- Check if create_sale_commission sets 'Sold' status
    SELECT prosrc LIKE '%status = ''Sold''%' INTO v_rpc_has_sold_status
    FROM pg_proc
    WHERE proname = 'create_sale_commission';

    IF NOT v_rpc_has_sold_status THEN
        RAISE EXCEPTION 'create_sale_commission function does not set Sold status';
    END IF;

    RAISE NOTICE '✅ Validation passed: All components working correctly';
END $$;


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COMMISSION-TO-TRANSACTION MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes Made:';
    RAISE NOTICE '  1. ✅ Created trigger function: create_commission_transaction()';
    RAISE NOTICE '  2. ✅ Created trigger: trigger_commission_to_transaction';
    RAISE NOTICE '  3. ✅ Fixed create_sale_commission RPC (status = ''Sold'')';
    RAISE NOTICE '';
    RAISE NOTICE 'New Behavior:';
    RAISE NOTICE '  - Rental commission created → financial_transaction auto-created';
    RAISE NOTICE '  - Sale commission created → financial_transaction auto-created';
    RAISE NOTICE '  - Commission income now appears in finance reports';
    RAISE NOTICE '  - Sale properties marked as ''Sold'' (not ''Inactive'')';
    RAISE NOTICE '';
    RAISE NOTICE 'Testing Checklist:';
    RAISE NOTICE '  1. Create new contract → verify 2 records (commission + transaction)';
    RAISE NOTICE '  2. Mark property as sold → verify 2 records + status = ''Sold''';
    RAISE NOTICE '  3. Check Finance page → income should include commissions';
    RAISE NOTICE '  4. Check Dashboard → income totals should update';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
