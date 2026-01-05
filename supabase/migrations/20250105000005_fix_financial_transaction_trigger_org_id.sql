-- =====================================================
-- Fix create_commission_transaction Trigger - Add org_id Support
-- =====================================================
--
-- This migration updates the create_commission_transaction trigger function
-- to include org_id in financial_transactions INSERT to fix the null constraint violation.
--
-- Problem:
-- - After multi-tenant migration, financial_transactions table requires org_id (NOT NULL)
-- - Trigger function was missing org_id in INSERT statement
-- - Caused: "null value in column org_id violates not-null constraint"
--
-- Solution:
-- - Get org_id from commission (NEW.org_id)
-- - Add org_id to financial_transactions INSERT statement
--
-- SAFE TO RUN: Only updates function definition, no data changes
-- ROLLBACK: Re-run 20251125000000_commission_to_transaction_trigger.sql
--
-- =====================================================

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

    -- Validate org_id exists
    IF NEW.org_id IS NULL THEN
        RAISE WARNING 'Cannot create financial transaction: org_id is NULL for commission %', NEW.id;
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
        NEW.org_id,
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

COMMENT ON FUNCTION create_commission_transaction() IS
'Automatically creates a financial_transaction record when a commission is inserted. Includes org_id support for multi-tenant architecture. Maps commission type to appropriate income category (Rental/Sale Commissions). Links transaction back to commission via commission_id for audit trail.';

