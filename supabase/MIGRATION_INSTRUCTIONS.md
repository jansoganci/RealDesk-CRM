# Migration Instructions for Property Type Separation

## Migrations Created

Two new migration files have been created:
1. `20251116000000_add_property_type_separation.sql` - Adds property_type field and sale-specific columns
2. `20251116000001_add_inquiry_type_separation.sql` - Adds inquiry_type field and sale budget columns

## How to Run Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations to database
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file
4. Run them in order:
   - First: `20251116000000_add_property_type_separation.sql`
   - Second: `20251116000001_add_inquiry_type_separation.sql`

### Option 3: Using Database URL

```bash
# If you have the database URL
npx supabase db push --db-url postgresql://[user]:[password]@[host]:[port]/[database]
```

## What These Migrations Do

### Migration 1: Property Type Separation
- ✅ Adds `property_type` column ('rental' | 'sale')
- ✅ Adds sale-specific fields (buyer info, offer details)
- ✅ Auto-classifies existing properties
- ✅ Updates status constraints
- ✅ Creates performance indexes

### Migration 2: Inquiry Type Separation
- ✅ Adds `inquiry_type` column ('rental' | 'sale')
- ✅ Renames budget fields for clarity
- ✅ Adds sale budget fields
- ✅ Auto-classifies existing inquiries as 'rental'
- ✅ Creates performance indexes

## Verification After Running

After running the migrations, verify with these SQL queries:

```sql
-- Check property_type distribution
SELECT property_type, COUNT(*) FROM properties GROUP BY property_type;

-- Check inquiry_type distribution
SELECT inquiry_type, COUNT(*) FROM property_inquiries GROUP BY inquiry_type;

-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename IN ('properties', 'property_inquiries');

-- Check for any null values
SELECT COUNT(*) FROM properties WHERE property_type IS NULL;
SELECT COUNT(*) FROM property_inquiries WHERE inquiry_type IS NULL;
```

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Rollback property_type changes
ALTER TABLE properties DROP COLUMN IF EXISTS property_type CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS buyer_name CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS buyer_phone CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS buyer_email CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS offer_date CASCADE;
ALTER TABLE properties DROP COLUMN IF EXISTS offer_amount CASCADE;

-- Rollback inquiry_type changes
ALTER TABLE property_inquiries DROP COLUMN IF EXISTS inquiry_type CASCADE;
ALTER TABLE property_inquiries RENAME COLUMN min_rent_budget TO min_budget;
ALTER TABLE property_inquiries RENAME COLUMN max_rent_budget TO max_budget;
ALTER TABLE property_inquiries DROP COLUMN IF EXISTS min_sale_budget CASCADE;
ALTER TABLE property_inquiries DROP COLUMN IF EXISTS max_sale_budget CASCADE;
```

## Next Steps After Migration

1. Generate updated TypeScript types: `npx supabase gen types typescript`
2. Update the application code (already done in this implementation)
3. Test the application thoroughly
4. Deploy to production
