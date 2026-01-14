/*
  # Add Commission Amount Column to Contracts Table

  1. New Column
    - `commission_amount` (numeric(10,2), nullable)
      - Manual commission amount override
      - If NULL, commission trigger uses rent_amount (1 month rent)
      - If provided, commission trigger uses this value instead

  2. Index
    - Create index on commission_amount for queries (where NOT NULL)

  3. Backward Compatibility
    - Column is nullable (NULL = use rent_amount)
    - Existing contracts have commission_amount = NULL
    - No data migration needed
*/

-- Add commission_amount column to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2);

-- Add comment explaining the column
COMMENT ON COLUMN contracts.commission_amount IS 
'Manual commission amount. If NULL, commission trigger uses rent_amount (1 month rent). If provided, commission trigger uses this value instead of rent_amount.';

-- Create index for queries (optional, but helpful for filtering contracts with manual commissions)
CREATE INDEX IF NOT EXISTS idx_contracts_commission_amount 
ON contracts(commission_amount) 
WHERE commission_amount IS NOT NULL;
