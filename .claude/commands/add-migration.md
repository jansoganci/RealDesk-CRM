---
description: Create database migration following Real Estate CRM patterns and security best practices
---

# Add Database Migration

You are creating a new database migration for the Real Estate CRM. Follow these guidelines to ensure security and consistency.

## Required Information

Ask the user for:
1. **Table name** (plural, snake_case, e.g., "appointments", "property_documents")
2. **Description** of what this table stores
3. **Fields** needed with their types
4. **Relationships** to other tables (foreign keys)
5. **Enum constraints** for status or type fields

## Migration Template

Create file: `supabase/migrations/YYYYMMDDHHMMSS_create_[table-name]_table.sql`

Use this template:

```sql
/*
  # Create [Table Display Name] Table

  1. New Tables
    - `[table_name]`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, required) - Links to authenticated user (RLS)
      - [list all fields with descriptions]
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `[table_name]` table
    - Add policies for authenticated users to:
      - SELECT: View only their own data
      - INSERT: Create only with their user_id
      - UPDATE: Update only their own data
      - DELETE: Delete only their own data

  3. Indexes
    - Create index on user_id for RLS performance
    - Create indexes on foreign keys for join performance
    - Create indexes on frequently queried columns

  4. Constraints
    - Foreign key constraints with CASCADE delete where appropriate
    - Check constraints for enum/status fields
    - Not null constraints on required fields
*/

-- Create the table
CREATE TABLE IF NOT EXISTS [table_name] (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Add your fields here
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
  -- Add constraints here (e.g., CHECK constraints for enums)
);

-- Enable Row Level Security
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own records
CREATE POLICY "Users can view their own [table_name]"
  ON [table_name]
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert only with their own user_id
CREATE POLICY "Users can insert their own [table_name]"
  ON [table_name]
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update only their own records
CREATE POLICY "Users can update their own [table_name]"
  ON [table_name]
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete only their own records
CREATE POLICY "Users can delete their own [table_name]"
  ON [table_name]
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_[table_name]_user_id ON [table_name](user_id);
-- Add more indexes as needed

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_[table_name]_updated_at
  BEFORE UPDATE ON [table_name]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Common Field Types

Use these PostgreSQL types:
- `uuid` - For IDs and foreign keys
- `text` - For strings (no arbitrary length limit)
- `numeric(10,2)` - For money/decimal values
- `integer` - For whole numbers
- `boolean` - For true/false flags
- `date` - For dates without time
- `timestamptz` - For timestamps with timezone
- `jsonb` - For structured JSON data

## Foreign Key Patterns

```sql
-- Reference with CASCADE delete (child records deleted when parent deleted)
property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

-- Reference with SET NULL (keep child, clear reference)
property_id uuid REFERENCES properties(id) ON DELETE SET NULL,

-- Reference with RESTRICT (prevent parent deletion if children exist)
property_id uuid REFERENCES properties(id) ON DELETE RESTRICT,
```

## Check Constraint Patterns

```sql
-- Enum constraint
CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))

-- Date range constraint
CONSTRAINT valid_date_range CHECK (end_date > start_date)

-- Numeric range constraint
CONSTRAINT valid_amount CHECK (amount > 0)
```

## Index Guidelines

Create indexes on:
1. **Always**: `user_id` (for RLS performance)
2. **Foreign keys**: For join performance
3. **Status/enum fields**: For filtering
4. **Frequently searched fields**: Like names, dates
5. **Composite indexes**: For common query patterns

```sql
-- Single column index
CREATE INDEX idx_[table]_[column] ON [table]([column]);

-- Composite index
CREATE INDEX idx_[table]_[col1]_[col2] ON [table]([col1], [col2]);
```

## Storage Bucket Setup (if needed)

If the table needs file storage:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('[bucket-name]', '[bucket-name]', false);

-- Storage policy: Users can view their own files
CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = '[bucket-name]'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: Users can upload their own files
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = '[bucket-name]'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = '[bucket-name]'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## RPC Functions (if needed)

If you need complex operations:

```sql
CREATE OR REPLACE FUNCTION [function_name](
  param1 type1,
  param2 type2
)
RETURNS return_type
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get authenticated user ID
  current_user_id := auth.uid();

  -- Security check
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Your logic here

  RETURN result;
END;
$$;
```

## After Creating Migration

1. **Update TypeScript types**:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
   ```

2. **Add types to** `src/types/index.ts`

3. **Create service** following the service pattern

4. **Test the migration**:
   ```bash
   supabase db push
   ```

5. **Verify RLS policies** work correctly by testing with different users

## Security Checklist

- [ ] Table has `user_id uuid NOT NULL` column
- [ ] RLS is enabled on the table
- [ ] All 4 RLS policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] RLS policies use `auth.uid() = user_id` pattern
- [ ] Index created on `user_id` for performance
- [ ] Foreign keys have appropriate ON DELETE behavior
- [ ] Check constraints added for enum fields
- [ ] `updated_at` trigger created
- [ ] Storage policies match table RLS (if using storage)
- [ ] RPC functions have SECURITY DEFINER with user_id checks (if any)

Now, please provide the table details and I'll generate the complete migration file for you!
