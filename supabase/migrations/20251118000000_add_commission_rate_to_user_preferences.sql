-- Migration: Add commission_rate to user_preferences
-- Allows agents to set their default commission rate instead of hardcoded 4%

-- Step 1: Add commission_rate column with default 4.0%
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 4.0;

-- Step 2: Add constraint to ensure reasonable values (0.1% to 20%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commission_rate_range'
  ) THEN
    ALTER TABLE user_preferences
    ADD CONSTRAINT commission_rate_range CHECK (
      commission_rate >= 0.1 AND commission_rate <= 20.0
    );
  END IF;
END $$;

-- Step 3: Update existing users to have default 4.0% if null
UPDATE user_preferences
SET commission_rate = 4.0
WHERE commission_rate IS NULL;

-- Step 4: Update create_sale_commission function to use user's preference
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
    v_user_id UUID;
    v_commission_rate NUMERIC;
BEGIN
    -- Get property details and user_id
    SELECT address, user_id INTO v_property_address, v_user_id
    FROM properties
    WHERE id = p_property_id;

    IF v_property_address IS NULL THEN
        RAISE EXCEPTION 'Property not found: %', p_property_id;
    END IF;

    -- Get user's commission rate preference (default to 4.0 if not set)
    SELECT COALESCE(commission_rate, 4.0) INTO v_commission_rate
    FROM user_preferences
    WHERE user_id = v_user_id;

    -- If no user preferences exist, use default 4.0%
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 4.0;
    END IF;

    -- Calculate commission using user's rate
    v_commission_amount := p_sale_price * (v_commission_rate / 100);

    -- Insert commission record
    INSERT INTO commissions (
        user_id,
        property_id,
        type,
        amount,
        currency,
        property_address
    ) VALUES (
        v_user_id,
        p_property_id,
        'sale',
        v_commission_amount,
        p_currency,
        v_property_address
    )
    RETURNING id INTO v_commission_id;

    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON COLUMN user_preferences.commission_rate IS
'Default commission rate as percentage (e.g., 4.0 for 4%). Used for sale commission calculations.';
