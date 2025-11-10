-- Migration: Create commissions table for agent income tracking
-- Date: 2025-01-10
-- Description: Track rental and sale commissions for estate agent

-- Add sale_price and sold fields to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sold_price NUMERIC;

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('rental', 'sale')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    property_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(type);
CREATE INDEX IF NOT EXISTS idx_commissions_property_id ON commissions(property_id);

-- Enable Row Level Security
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commissions
CREATE POLICY "Users can view their own commissions"
    ON commissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commissions"
    ON commissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commissions"
    ON commissions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commissions"
    ON commissions FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically create rental commission when contract is created
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

-- Trigger for rental commissions
DROP TRIGGER IF EXISTS trigger_create_rental_commission ON contracts;
CREATE TRIGGER trigger_create_rental_commission
    AFTER INSERT ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION create_rental_commission();

-- Function to create sale commission (to be called manually or via app)
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
    v_user_id UUID;
BEGIN
    -- Calculate 4% commission
    v_commission_amount := p_sale_price * 0.04;

    -- Get property details
    SELECT address, user_id INTO v_property_address, v_user_id
    FROM properties
    WHERE id = p_property_id;

    -- Insert commission
    INSERT INTO commissions (
        property_id,
        type,
        amount,
        currency,
        property_address,
        notes,
        user_id
    ) VALUES (
        p_property_id,
        'sale',
        v_commission_amount,
        p_currency,
        v_property_address,
        'Commission from property sale (4%)',
        v_user_id
    )
    RETURNING id INTO v_commission_id;

    -- Update property as sold
    UPDATE properties
    SET
        sold_at = timezone('utc'::text, now()),
        sold_price = p_sale_price,
        status = 'Inactive'
    WHERE id = p_property_id;

    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_sale_commission TO authenticated;
