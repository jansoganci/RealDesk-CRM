# 🔴 INQUIRY ERROR - ROOT CAUSE ANALYSIS

**Date:** December 10, 2025  
**Status:** ✅ ROOT CAUSE IDENTIFIED  
**Severity:** CRITICAL - Feature completely broken

---

## 📋 ERROR SUMMARY

**Console Error:**
```
"Could not find the 'inquiry_type' column of 'property_inquiries' in the schema cache"
PGRST204: Could not find the 'inquiry_type' column
```

**User-Facing Error:**
```
"Customer request could not be saved"
```

**Location:** Inquiries screen - when trying to create or update any inquiry

---

## ✅ ROOT CAUSE CONFIRMED

**The migration file `20251116000001_add_inquiry_type_separation.sql` was NEVER applied to the production database.**

### Database Schema Check Results:

```
❌ inquiry_type: NOT FOUND
❌ min_rent_budget: NOT FOUND
❌ max_rent_budget: NOT FOUND
❌ min_sale_budget: NOT FOUND
❌ max_sale_budget: NOT FOUND
✅ min_budget: EXISTS (old column)
✅ max_budget: EXISTS (old column)
```

**The database is still using the OLD schema from before the rental/sale separation feature was added.**

---

## 🔍 DETAILED ANALYSIS

### 1. What Happened?

**Timeline:**
1. ✅ Migration file was created: `supabase/migrations/20251116000001_add_inquiry_type_separation.sql`
2. ✅ Frontend code was updated to use `inquiry_type`, `min_rent_budget`, etc.
3. ✅ TypeScript types were updated in `src/types/database.ts`
4. ❌ **Migration was NEVER applied to the actual Supabase database**
5. 💥 **Code expects columns that don't exist = CRASH**

### 2. Code vs Database Mismatch

| Component | Schema Version | Status |
|-----------|---------------|--------|
| **Frontend Code** | NEW (with inquiry_type) | ✅ Updated |
| **TypeScript Types** | NEW (with inquiry_type) | ✅ Updated |
| **Migration File** | NEW (with inquiry_type) | ✅ Created |
| **Actual Database** | OLD (without inquiry_type) | ❌ **NOT UPDATED** |

### 3. Why It's Breaking

**When you try to create an inquiry:**

1. `InquiryDialog.tsx` collects form data including `inquiry_type: 'rental'`
2. `useInquiryActions.ts` calls `inquiriesService.create(data)`
3. `inquiries.service.ts` tries to INSERT into database with `inquiry_type` column
4. **Database rejects it:** "Column inquiry_type does not exist"
5. Error bubbles up to user: "Customer request could not be saved"

**Code trying to insert:**
```typescript
{
  name: "John Doe",
  phone: "123456789",
  inquiry_type: "rental",  // ❌ This column doesn't exist!
  min_rent_budget: 1000,   // ❌ This column doesn't exist!
  max_rent_budget: 2000,   // ❌ This column doesn't exist!
  ...
}
```

**Database expects:**
```typescript
{
  name: "John Doe",
  phone: "123456789",
  // No inquiry_type field
  min_budget: 1000,   // ✅ Old column name
  max_budget: 2000,   // ✅ Old column name
  ...
}
```

---

## 📂 FILES AFFECTED

### Files Using `inquiry_type` (will all fail):

1. **src/services/inquiries.service.ts**
   - Line 33: `.eq('inquiry_type', 'rental')`
   - Line 48: `.eq('inquiry_type', 'sale')`
   - Line 148: `inquiry.inquiry_type === property.property_type`
   - Line 306: `inquiry_type: i.inquiry_type`
   - Lines 318-330: Filtering by `inquiry_type`

2. **src/features/inquiries/InquiryDialog.tsx**
   - Lines 76, 88, 103, 115: Setting `inquiry_type` in form data

3. **src/features/inquiries/inquirySchema.ts**
   - Lines 20, 29, 39: Schema validation for `inquiry_type`

4. **src/features/inquiries/hooks/useInquiryFilters.ts**
   - Line 18: Filtering by `inquiry_type`

5. **src/features/inquiries/components/InquiryTableRow.tsx**
   - Line 61: Reading `inquiry.inquiry_type`

6. **src/features/inquiries/components/InquiryCard.tsx**
   - Line 58: Reading `inquiry.inquiry_type`

**ALL OF THESE WILL FAIL** because the column doesn't exist in the database.

---

## 🎯 THE SOLUTION (When Ready to Fix)

### Option 1: Apply Migration via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://jglxczzxliaiigccavnb.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of:
   ```
   supabase/migrations/20251116000001_add_inquiry_type_separation.sql
   ```
4. Click **Run**
5. Verify success

### Option 2: Apply Migration via CLI

```bash
# Make sure you're logged in to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref jglxczzxliaiigccavnb

# Push the migration
npx supabase db push
```

### Option 3: Manual SQL (if migration file has issues)

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add inquiry_type column
ALTER TABLE property_inquiries
ADD COLUMN IF NOT EXISTS inquiry_type text NOT NULL DEFAULT 'rental'
CHECK (inquiry_type IN ('rental', 'sale'));

-- Rename budget columns to be rental-specific
ALTER TABLE property_inquiries
RENAME COLUMN min_budget TO min_rent_budget;

ALTER TABLE property_inquiries
RENAME COLUMN max_budget TO max_rent_budget;

-- Add sale budget columns
ALTER TABLE property_inquiries
ADD COLUMN IF NOT EXISTS min_sale_budget numeric,
ADD COLUMN IF NOT EXISTS max_sale_budget numeric;

-- Backfill existing data
UPDATE property_inquiries
SET inquiry_type = 'rental'
WHERE inquiry_type IS NULL OR inquiry_type = '';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_type
ON property_inquiries(inquiry_type);

CREATE INDEX IF NOT EXISTS idx_inquiries_type_status
ON property_inquiries(inquiry_type, status);
```

---

## ✅ VERIFICATION STEPS (After Fix)

### 1. Check Database Schema

Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'property_inquiries'
ORDER BY ordinal_position;
```

**Expected columns:**
- ✅ inquiry_type (text, NOT NULL)
- ✅ min_rent_budget (numeric, nullable)
- ✅ max_rent_budget (numeric, nullable)
- ✅ min_sale_budget (numeric, nullable)
- ✅ max_sale_budget (numeric, nullable)
- ❌ min_budget (should be RENAMED to min_rent_budget)
- ❌ max_budget (should be RENAMED to max_rent_budget)

### 2. Test Creating an Inquiry

1. Go to Inquiries page
2. Click "Add Inquiry"
3. Fill in the form
4. Select "Rental" or "Sale" type
5. Click Save
6. ✅ Should save successfully without errors

### 3. Check Console

- ❌ Before fix: `Could not find the 'inquiry_type' column`
- ✅ After fix: No errors

---

## 🚨 IMPORTANT NOTES

### Why This Happened

This is a **classic deployment mistake**:
1. Code was updated locally
2. Code was deployed to production
3. **Database migration was forgotten**
4. Result: Code expects new schema, database has old schema = CRASH

### Prevention for Future

**ALWAYS follow this order:**
1. ✅ Create migration file
2. ✅ **Apply migration to database FIRST**
3. ✅ Update code to use new schema
4. ✅ Deploy code

**NEVER:**
1. ❌ Update code first
2. ❌ Deploy code
3. ❌ Forget to apply migration
4. 💥 Everything breaks

### Data Safety

The migration is **SAFE** to run:
- ✅ Uses `ADD COLUMN IF NOT EXISTS` (won't fail if column exists)
- ✅ Sets default value for `inquiry_type` ('rental')
- ✅ Backfills existing data
- ✅ Renames columns (preserves data)
- ✅ No data loss

---

## 📊 IMPACT ASSESSMENT

**Affected Features:**
- ❌ Creating new inquiries (completely broken)
- ❌ Editing existing inquiries (completely broken)
- ❌ Filtering inquiries by type (broken)
- ❌ Viewing inquiry statistics (broken)
- ❌ Matching properties to inquiries (broken)

**Severity:** 🔴 CRITICAL
- Feature is 100% non-functional
- Blocks core business workflow
- Affects all users

**User Impact:**
- Cannot add new customer inquiries
- Cannot update existing inquiries
- Cannot distinguish between rental and sale inquiries

---

## 🎯 NEXT STEPS

1. ✅ **ANALYSIS COMPLETE** (this document)
2. ⏳ **WAITING FOR APPROVAL** to apply fix
3. 🔧 Apply migration to database
4. ✅ Verify fix works
5. 🧹 Clean up temporary files (check-db-schema.js)
6. 📝 Update deployment checklist to prevent this in future

---

## 📞 SUMMARY FOR NON-TECHNICAL FOLKS

**What's wrong?**
The code expects a database column called `inquiry_type` that doesn't exist.

**Why did it break?**
We updated the code but forgot to update the database.

**How to fix it?**
Run a database migration script that adds the missing column.

**How long to fix?**
5 minutes once we have approval to run the migration.

**Will we lose data?**
No, the migration is safe and preserves all existing data.

---

**Analysis completed by:** AI Assistant  
**Verified by:** Database schema check script  
**Confidence:** 100% - Root cause confirmed
