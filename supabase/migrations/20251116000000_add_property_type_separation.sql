-- Migration: Add property_type separation for rental vs sale properties
-- This migration adds the ability to distinguish between rental and sale properties

-- Step 1: Add property_type column with default 'rental'
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_type text NOT NULL DEFAULT 'rental'
CHECK (property_type IN ('rental', 'sale'));

-- Step 2: Add sale-specific fields
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS buyer_name text,
ADD COLUMN IF NOT EXISTS buyer_phone text,
ADD COLUMN IF NOT EXISTS buyer_email text,
ADD COLUMN IF NOT EXISTS offer_date timestamptz,
ADD COLUMN IF NOT EXISTS offer_amount numeric;

-- Step 3: Backfill existing data
-- Properties with sold_at or sold_price set are classified as 'sale'
-- All other properties are classified as 'rental' (default)
UPDATE properties
SET property_type = CASE
  WHEN sold_at IS NOT NULL OR sold_price IS NOT NULL THEN 'sale'
  ELSE 'rental'
END;

-- Step 4: Update property status constraint to include sale-specific statuses
-- Remove old constraint
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS valid_property_status;

-- Add new constraint with additional sale statuses
-- Rental statuses: 'Empty', 'Occupied', 'Inactive'
-- Sale statuses: 'Available', 'Under Offer', 'Sold', 'Inactive'
ALTER TABLE properties
ADD CONSTRAINT valid_property_status
CHECK (status IN ('Empty', 'Occupied', 'Inactive', 'Available', 'Under Offer', 'Sold'));

-- Step 5: Create indexes for performance optimization
-- Index on property_type for filtering
CREATE INDEX IF NOT EXISTS idx_properties_type
ON properties(property_type);

-- Composite index for filtering by type and status
CREATE INDEX IF NOT EXISTS idx_properties_type_status
ON properties(property_type, status);

-- Partial index for rental properties
CREATE INDEX IF NOT EXISTS idx_properties_rental_status
ON properties(property_type, status)
WHERE property_type = 'rental';

-- Partial index for sale properties
CREATE INDEX IF NOT EXISTS idx_properties_sale_status
ON properties(property_type, status)
WHERE property_type = 'sale';

-- Step 6: Add helpful comments for documentation
COMMENT ON TABLE properties IS
'Properties table with support for both rental and sale properties.
Use property_type field to distinguish between rental and sale listings.';

COMMENT ON COLUMN properties.property_type IS
'Type of property listing: rental or sale';

COMMENT ON COLUMN properties.status IS
'Status of property. For rentals: Empty, Occupied, Inactive.
For sales: Available, Under Offer, Sold, Inactive';

COMMENT ON COLUMN properties.buyer_name IS
'Name of the buyer (for sale properties only)';

COMMENT ON COLUMN properties.buyer_phone IS
'Phone number of the buyer (for sale properties only)';

COMMENT ON COLUMN properties.buyer_email IS
'Email address of the buyer (for sale properties only)';

COMMENT ON COLUMN properties.offer_date IS
'Date when offer was made (for sale properties only)';

COMMENT ON COLUMN properties.offer_amount IS
'Amount of the offer made by buyer (for sale properties only)';
