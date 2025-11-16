---
description: Review and verify Row Level Security (RLS) policies for security compliance
---

# Review RLS Security

You are conducting a security review of Row Level Security (RLS) policies in the Real Estate CRM database. This is critical to ensure users can only access their own data.

## What to Review

Ask the user which table to review, or review all tables if requested.

## RLS Security Checklist

For each table, verify:

### 1. Table Has user_id Column
```sql
-- Check if table has user_id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'table_name'
  AND column_name = 'user_id';
```

**Required**: Every user-scoped table MUST have `user_id uuid NOT NULL`

### 2. RLS is Enabled
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'table_name';
```

**Required**: `rowsecurity` must be `true`

### 3. All Four RLS Policies Exist

Every table should have these policies:

#### SELECT Policy
```sql
CREATE POLICY "Users can view their own [table_name]"
  ON [table_name]
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

#### INSERT Policy
```sql
CREATE POLICY "Users can insert their own [table_name]"
  ON [table_name]
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update their own [table_name]"
  ON [table_name]
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### DELETE Policy
```sql
CREATE POLICY "Users can delete their own [table_name]"
  ON [table_name]
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### 4. user_id Index Exists

For performance, every table should have:
```sql
CREATE INDEX idx_[table_name]_user_id ON [table_name](user_id);
```

## Service Layer Security Checklist

Verify that service layer properly injects user_id:

### Create Operations
```typescript
async create(entity: EntityInsert): Promise<Entity> {
  // ✅ CORRECT: Inject user_id
  const userId = await getAuthenticatedUserId();
  return await insertRow('table_name', {
    ...entity,
    user_id: userId,  // REQUIRED
  });
}

// ❌ WRONG: Missing user_id injection
async create(entity: EntityInsert): Promise<Entity> {
  return await insertRow('table_name', entity);  // SECURITY ISSUE!
}
```

### RPC Functions Security

If using RPC functions, verify they have security checks:

```sql
CREATE OR REPLACE FUNCTION function_name(params)
RETURNS return_type
SECURITY DEFINER  -- Required for auth.uid() access
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- ✅ CORRECT: Get and verify user_id
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- All operations must use current_user_id
  INSERT INTO table_name (user_id, ...)
  VALUES (current_user_id, ...);

  RETURN result;
END;
$$;
```

## Common Security Issues

### ❌ Issue 1: Missing user_id in INSERT
```typescript
// WRONG
await supabase.from('properties').insert({ address: '123 Main St' });

// CORRECT
const userId = await getAuthenticatedUserId();
await supabase.from('properties').insert({
  address: '123 Main St',
  user_id: userId
});
```

### ❌ Issue 2: RLS Not Enabled
```sql
-- Check and fix
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### ❌ Issue 3: Missing RLS Policies
```sql
-- Add missing policies
-- (See templates above)
```

### ❌ Issue 4: Public Access Allowed
```sql
-- WRONG: Allows public access
CREATE POLICY "public_select" ON table_name
  FOR SELECT
  TO public  -- ❌ Should be 'authenticated'
  USING (true);  -- ❌ Should check user_id

-- CORRECT
CREATE POLICY "auth_select" ON table_name
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### ❌ Issue 5: Storage Without RLS
```sql
-- Storage buckets also need RLS!
CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bucket-name'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Testing RLS Policies

### Test Plan

1. **Create test users** (2 different users)
2. **User A creates records**
3. **Verify User B cannot see User A's records**
4. **Verify User B cannot modify User A's records**
5. **Verify User B cannot delete User A's records**

### Test Script
```typescript
// Test with different users
import { supabase } from './config/supabase';

async function testRLS() {
  // Login as User A
  await supabase.auth.signInWithPassword({
    email: 'usera@example.com',
    password: 'password',
  });

  // Create record as User A
  const { data: recordA } = await supabase
    .from('properties')
    .insert({ address: 'User A Property' })
    .select()
    .single();

  console.log('User A created:', recordA);

  // Logout
  await supabase.auth.signOut();

  // Login as User B
  await supabase.auth.signInWithPassword({
    email: 'userb@example.com',
    password: 'password',
  });

  // Try to fetch User A's record
  const { data: checkRecord } = await supabase
    .from('properties')
    .select()
    .eq('id', recordA.id)
    .maybeSingle();

  if (checkRecord) {
    console.error('❌ SECURITY ISSUE: User B can see User A\'s data!');
  } else {
    console.log('✅ RLS working: User B cannot see User A\'s data');
  }

  // Try to update User A's record
  const { error: updateError } = await supabase
    .from('properties')
    .update({ address: 'Hacked!' })
    .eq('id', recordA.id);

  if (!updateError) {
    console.error('❌ SECURITY ISSUE: User B can update User A\'s data!');
  } else {
    console.log('✅ RLS working: User B cannot update User A\'s data');
  }
}
```

## Review Report Template

Generate a report like this:

```markdown
# RLS Security Review Report

**Date**: [Date]
**Reviewed By**: Claude Code
**Tables Reviewed**: [List of tables]

## Summary
- ✅ Secure tables: X
- ⚠️ Tables needing attention: Y
- ❌ Critical issues: Z

## Detailed Findings

### Table: properties
- ✅ RLS Enabled: Yes
- ✅ user_id column: Present
- ✅ SELECT policy: Correct
- ✅ INSERT policy: Correct
- ✅ UPDATE policy: Correct
- ✅ DELETE policy: Correct
- ✅ user_id index: Present
- ✅ Service layer: Correctly injects user_id

### Table: contracts
- ✅ RLS Enabled: Yes
- ❌ INSERT policy: Missing WITH CHECK clause
- ⚠️ Recommendation: Add WITH CHECK (auth.uid() = user_id)

## Critical Issues
[List any critical security issues found]

## Recommendations
1. [Specific recommendations]
2. [Migration scripts needed]

## Next Steps
- [ ] Fix critical issues
- [ ] Run test suite
- [ ] Deploy fixes
- [ ] Verify in production
```

## Tables to Review

Standard tables in Real Estate CRM:
1. property_owners
2. properties
3. property_photos
4. tenants
5. contracts
6. property_inquiries
7. meetings
8. commissions
9. financial_transactions
10. expense_categories
11. recurring_expenses
12. user_preferences

## Auto-Fix Script

If issues found, generate migration to fix:

```sql
-- Fix missing RLS policies for [table_name]

-- Enable RLS if not enabled
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if recreating)
DROP POLICY IF EXISTS "policy_name" ON [table_name];

-- Create correct policies
CREATE POLICY "Users can view their own [table_name]"
  ON [table_name] FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own [table_name]"
  ON [table_name] FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own [table_name]"
  ON [table_name] FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own [table_name]"
  ON [table_name] FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create index if missing
CREATE INDEX IF NOT EXISTS idx_[table_name]_user_id
ON [table_name](user_id);
```

Which table(s) would you like me to review? Or should I review all tables?
