/*
  # Update Commission Trigger - Manual Commission Override

  1. Changes
    - Modify create_rental_commission() function to support manual commission
    - Use COALESCE(NEW.commission_amount, NEW.rent_amount) for commission calculation
    - Add validation to skip commission creation if amount <= 0
    - Update notes field to indicate manual vs auto commission

  2. Logic
    - If commission_amount is provided (NOT NULL and > 0): Use commission_amount
    - If commission_amount is NULL or 0: Use rent_amount (backward compatible)
    - Skip commission creation if calculated amount <= 0

  3. Backward Compatibility
    - Existing contracts have commission_amount = NULL
    - NULL triggers fallback to rent_amount (existing behavior)
    - No breaking changes

  SAFE TO RUN: Only updates function definition, no data changes
*/

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
                amount,              -- Uses calculated amount (manual or rent_amount)
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
                v_commission_amount, -- Manual commission or rent_amount fallback
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

COMMENT ON FUNCTION create_rental_commission() IS
'Automatically creates a rental commission when an active contract is created or updated. Supports manual commission override via commission_amount column. If commission_amount is NULL, uses rent_amount (1 month rent). Includes org_id support for multi-tenant architecture.';
