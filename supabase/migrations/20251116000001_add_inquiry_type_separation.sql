-- Migration: Add inquiry_type separation for rental vs sale inquiries
-- This migration adds the ability to distinguish between rental and sale property inquiries

-- Step 1: Add inquiry_type column with default 'rental'
ALTER TABLE property_inquiries
ADD COLUMN IF NOT EXISTS inquiry_type text NOT NULL DEFAULT 'rental'
CHECK (inquiry_type IN ('rental', 'sale'));

-- Step 2: Rename existing budget fields to be rental-specific
-- First check if columns exist before renaming
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'property_inquiries'
        AND column_name = 'min_budget'
    ) THEN
        ALTER TABLE property_inquiries
        RENAME COLUMN min_budget TO min_rent_budget;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'property_inquiries'
        AND column_name = 'max_budget'
    ) THEN
        ALTER TABLE property_inquiries
        RENAME COLUMN max_budget TO max_rent_budget;
    END IF;
END $$;

-- Step 3: Add sale-specific budget fields
ALTER TABLE property_inquiries
ADD COLUMN IF NOT EXISTS min_sale_budget numeric,
ADD COLUMN IF NOT EXISTS max_sale_budget numeric;

-- Step 4: Backfill existing data
-- All existing inquiries are rental inquiries (current system only supports rentals)
UPDATE property_inquiries
SET inquiry_type = 'rental'
WHERE inquiry_type IS NULL OR inquiry_type = '';

-- Step 5: Update inquiry status constraint to be more specific
-- Remove old constraint if exists
ALTER TABLE property_inquiries
DROP CONSTRAINT IF EXISTS valid_inquiry_status;

-- Add new constraint with all status options
ALTER TABLE property_inquiries
ADD CONSTRAINT valid_inquiry_status
CHECK (status IN ('active', 'matched', 'contacted', 'converted', 'closed'));

-- Step 6: Create indexes for performance optimization
-- Index on inquiry_type for filtering
CREATE INDEX IF NOT EXISTS idx_inquiries_type
ON property_inquiries(inquiry_type);

-- Composite index for filtering by type and status
CREATE INDEX IF NOT EXISTS idx_inquiries_type_status
ON property_inquiries(inquiry_type, status);

-- Partial index for active rental inquiries (most common query)
CREATE INDEX IF NOT EXISTS idx_inquiries_active_rental
ON property_inquiries(inquiry_type, status)
WHERE inquiry_type = 'rental' AND status = 'active';

-- Partial index for active sale inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_active_sale
ON property_inquiries(inquiry_type, status)
WHERE inquiry_type = 'sale' AND status = 'active';

-- Step 7: Add helpful comments for documentation
COMMENT ON TABLE property_inquiries IS
'Property inquiries table with support for both rental and sale inquiries.
Use inquiry_type field to distinguish between rental and sale inquiries.';

COMMENT ON COLUMN property_inquiries.inquiry_type IS
'Type of property inquiry: rental or sale';

COMMENT ON COLUMN property_inquiries.min_rent_budget IS
'Minimum budget for rental properties (monthly rent)';

COMMENT ON COLUMN property_inquiries.max_rent_budget IS
'Maximum budget for rental properties (monthly rent)';

COMMENT ON COLUMN property_inquiries.min_sale_budget IS
'Minimum budget for sale properties (purchase price)';

COMMENT ON COLUMN property_inquiries.max_sale_budget IS
'Maximum budget for sale properties (purchase price)';

COMMENT ON COLUMN property_inquiries.status IS
'Status of inquiry: active, matched, contacted, converted, closed';
