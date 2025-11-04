/*
  # Add Listing URL to Properties Table
  
  This migration adds a `listing_url` column to the `properties` table
  to store external listing links (e.g., sahibinden.com links).
  
  1. Add `listing_url` column (text, nullable)
*/

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_url text;

-- Add comment to document the column purpose
COMMENT ON COLUMN properties.listing_url IS 'External listing URL (e.g., sahibinden.com link)';

