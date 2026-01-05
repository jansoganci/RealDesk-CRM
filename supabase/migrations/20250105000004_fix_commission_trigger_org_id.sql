-- =====================================================
-- Fix create_rental_commission Trigger - Add org_id Support
-- =====================================================
--
-- This migration updates the create_rental_commission trigger function
-- to include org_id in commissions INSERT to fix the null constraint violation.
--
-- Problem:
-- - After multi-tenant migration, commissions table requires org_id (NOT NULL)
-- - Trigger function was missing org_id in INSERT statement
-- - Caused: "null value in column org_id violates not-null constraint"
--
-- Solution:
-- - Get org_id from contract (NEW.org_id) or property
-- - Add org_id to commissions INSERT statement
--
-- SAFE TO RUN: Only updates function definition, no data changes
-- ROLLBACK: Re-run 20250111000003_phase4_triggers_and_rpc_security.sql
--
-- =====================================================

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
            -- Get org_id from contract (NEW.org_id) or fallback to property
            SELECT COALESCE(NEW.org_id, p.org_id) INTO v_org_id
            FROM properties p
            WHERE p.id = NEW.property_id
            LIMIT 1;
            
            -- Validate org_id exists
            IF v_org_id IS NULL THEN
                RAISE WARNING 'Cannot create commission: org_id not found for contract %', NEW.id;
                RETURN NEW;
            END IF;
            
            INSERT INTO commissions (
                property_id,
                contract_id,
                type,
                amount,
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
                NEW.rent_amount, -- Commission = 1 month rent
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

COMMENT ON FUNCTION create_rental_commission() IS
'Automatically creates a rental commission when an active contract is created or updated. Includes org_id support for multi-tenant architecture.';

