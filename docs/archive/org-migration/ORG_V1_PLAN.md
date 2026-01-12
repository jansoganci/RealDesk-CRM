# Org V1 Migration Plan (Simplified MVP)

> **Document Status:** LOCKED
> **Last Updated:** 2025-12-31
> **Target:** Multi-tenant organization architecture for Emlak CRM
> **Timeline:** 2-3 weeks

---

## 1. Overview

### What We're Building
- Organizations (agencies) can invite team members
- All org members see shared data
- Owner can edit, members can view
- Soft delete for data recovery

### What We're NOT Building (V1)
- Branches/units (add later if requested)
- Granular permissions (add later if requested)
- Custom roles (only owner/member)

### Philosophy
> Ship the simplest solution that works. Add complexity only when customers request it.

---

## 2. Data Model

### 2.1 New Tables

#### `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
```

#### `org_members`
```sql
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_status ON org_members(status);
```

### 2.2 Columns to Add (Business Tables)

Add these 2 columns to business tables:

```sql
ALTER TABLE {table} ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE {table} ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_{table}_org_id ON {table}(org_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at) WHERE deleted_at IS NULL;
```

### 2.3 Tables to Modify

**Core Business Tables (add org_id + deleted_at):**
- properties
- tenants
- contracts
- contract_details
- property_owners
- property_inquiries
- inquiry_matches
- meetings

**Financial Tables (add org_id + deleted_at):**
- financial_transactions
- commissions
- recurring_expenses
- expense_categories

**Contract Builder Tables (add org_id + deleted_at):**
- contract_clause_templates
- contract_clause_overrides

### 2.4 Tables NOT Modified

**Linked via parent (no direct org_id needed):**
- property_photos (linked via properties.property_id)

**Global/System Tables (no org_id):**
- exchange_rates (global currency rates)

**Billing Tables (keep user-level, not org-level):**
- user_billing
- stripe_customers
- subscriptions
- user_preferences
- consent_logs

### 2.5 Roles

Only 2 roles in V1:

| Role | Read | Write | Delete | Invite |
|------|------|-------|--------|--------|
| owner | Yes | Yes | Yes | Yes |
| member | Yes | No | No | No |

---

## 3. RLS Policies

### 3.1 Standard Policy Pattern (No Helper Functions)

```sql
-- Enable RLS
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- SELECT: Any org member can read
CREATE POLICY "org_select_{table}" ON {table}
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- INSERT: Only owner can create
CREATE POLICY "org_insert_{table}" ON {table}
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- UPDATE: Only owner can update
CREATE POLICY "org_update_{table}" ON {table}
FOR UPDATE USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- DELETE: Only owner can delete (soft delete enforced at app level)
CREATE POLICY "org_delete_{table}" ON {table}
FOR DELETE USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);
```

### 3.2 Organization Tables RLS

```sql
-- organizations: members can read their own org
CREATE POLICY "org_select_organizations" ON organizations
FOR SELECT USING (
  id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- organizations: only owner can update
CREATE POLICY "org_update_organizations" ON organizations
FOR UPDATE USING (
  id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- org_members: members can see other members in their org
CREATE POLICY "org_select_org_members" ON org_members
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- org_members: only owner can invite/modify members
CREATE POLICY "org_insert_org_members" ON org_members
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

CREATE POLICY "org_update_org_members" ON org_members
FOR UPDATE USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

CREATE POLICY "org_delete_org_members" ON org_members
FOR DELETE USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);
```

### 3.3 Property Photos RLS (Linked via Property)

```sql
-- property_photos: Access based on parent property's org
CREATE POLICY "org_select_property_photos" ON property_photos
FOR SELECT USING (
  property_id IN (
    SELECT id FROM properties
    WHERE deleted_at IS NULL
    AND org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

CREATE POLICY "org_insert_property_photos" ON property_photos
FOR INSERT WITH CHECK (
  property_id IN (
    SELECT id FROM properties
    WHERE org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
    )
  )
);

CREATE POLICY "org_update_property_photos" ON property_photos
FOR UPDATE USING (
  property_id IN (
    SELECT id FROM properties
    WHERE org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
    )
  )
);

CREATE POLICY "org_delete_property_photos" ON property_photos
FOR DELETE USING (
  property_id IN (
    SELECT id FROM properties
    WHERE org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
    )
  )
);
```

---

## 4. Storage Policies

### 4.1 property-photos (Public Read)
```sql
-- Anyone can read (public listing photos)
CREATE POLICY "public_read_property_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-photos');

-- Org owners can upload (path: org_id/property_id/filename)
CREATE POLICY "org_insert_property_photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-photos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- Org owners can delete
CREATE POLICY "org_delete_property_photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-photos'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);
```

### 4.2 contract-pdfs (Private)
```sql
-- Org members can read their org's PDFs
CREATE POLICY "org_read_contract_pdfs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-pdfs'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Org owners can upload
CREATE POLICY "org_insert_contract_pdfs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-pdfs'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- Org owners can delete
CREATE POLICY "org_delete_contract_pdfs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contract-pdfs'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);
```

---

## 5. Triggers

### 5.1 Auto-Create Org for New Users

```sql
-- Trigger on auth.users (Supabase Auth)
CREATE OR REPLACE FUNCTION handle_new_user_org()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get user info from auth.users
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1)
  );

  -- Create personal organization
  INSERT INTO public.organizations (name, slug)
  VALUES (user_name, NEW.id::text)
  RETURNING id INTO new_org_id;

  -- Add user as owner
  INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_org();
```

### 5.2 Updated_at Trigger

```sql
-- Reuse existing update_updated_at_column() function
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Frontend Changes

### 6.1 Types

```typescript
// src/types/org.ts

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type OrgRole = 'owner' | 'member';
export type OrgMemberStatus = 'pending' | 'active' | 'suspended';

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  status: OrgMemberStatus;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### 6.2 OrgContext

```typescript
// src/contexts/OrgContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import type { Organization, OrgMember } from '@/types/org';

interface OrgContextValue {
  currentOrg: Organization | null;
  membership: OrgMember | null;
  isOwner: boolean;
  isLoading: boolean;
  refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrg = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCurrentOrg(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    // Get user's active membership
    const { data: memberData } = await supabase
      .from('org_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberData) {
      setMembership(memberData);
      setCurrentOrg(memberData.organization);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const value: OrgContextValue = {
    currentOrg,
    membership,
    isOwner: membership?.role === 'owner',
    isLoading,
    refreshOrg: fetchOrg,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return context;
}
```

### 6.3 Service Update Pattern

```typescript
// Example: src/services/properties.service.ts

// BEFORE (current)
async getAll(): Promise<PropertyWithOwner[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('...')
    .order('created_at', { ascending: false });
  // ...
}

// AFTER (with org scope)
async getAll(orgId: string): Promise<PropertyWithOwner[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('...')
    .eq('org_id', orgId)           // ADD: org filter
    .is('deleted_at', null)        // ADD: soft delete filter
    .order('created_at', { ascending: false });
  // ...
}

// BEFORE (create)
async create(property: PropertyInsert): Promise<Property> {
  const userId = await getAuthenticatedUserId();
  return insertRow('properties', {
    ...property,
    user_id: userId,
  });
}

// AFTER (create with org)
async create(property: PropertyInsert, orgId: string): Promise<Property> {
  const userId = await getAuthenticatedUserId();
  return insertRow('properties', {
    ...property,
    user_id: userId,
    org_id: orgId,  // ADD: org_id
  });
}

// BEFORE (delete - hard delete)
async delete(id: string): Promise<void> {
  await supabase.from('properties').delete().eq('id', id);
}

// AFTER (delete - soft delete)
async delete(id: string): Promise<void> {
  await supabase
    .from('properties')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
}
```

### 6.4 Services to Update

All these services need org_id filtering:

- `properties.service.ts`
- `tenants.service.ts`
- `contracts.service.ts`
- `owners.service.ts`
- `inquiries.service.ts`
- `meetings.service.ts`
- `commissions.service.ts`
- `finance/transactions.service.ts`
- `finance/recurring.service.ts`
- `finance/categories.service.ts`
- `clauses.service.ts`

---

## 7. Migration Plan

### Phase 1: Create New Tables (Day 1-2)

```sql
-- Migration: 20250101000001_create_org_tables.sql

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create org_members table
CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 3. Create indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_status ON public.org_members(status);

-- 4. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 5. Add triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Phase 2: Add Columns + Migrate Data (Day 3-5)

```sql
-- Migration: 20250101000002_add_org_columns.sql

-- Add columns (nullable initially)
ALTER TABLE properties ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE properties ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE tenants ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE tenants ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE contracts ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE contracts ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE contract_details ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE contract_details ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE property_owners ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE property_owners ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE property_inquiries ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE property_inquiries ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE inquiry_matches ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE inquiry_matches ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE meetings ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE meetings ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE financial_transactions ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE financial_transactions ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE commissions ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE commissions ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE recurring_expenses ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE recurring_expenses ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE expense_categories ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE expense_categories ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE contract_clause_templates ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE contract_clause_templates ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE contract_clause_overrides ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE contract_clause_overrides ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create indexes
CREATE INDEX idx_properties_org_id ON properties(org_id);
CREATE INDEX idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_tenants_org_id ON tenants(org_id);
CREATE INDEX idx_contracts_org_id ON contracts(org_id);
CREATE INDEX idx_contract_details_org_id ON contract_details(org_id);
CREATE INDEX idx_property_owners_org_id ON property_owners(org_id);
CREATE INDEX idx_property_inquiries_org_id ON property_inquiries(org_id);
CREATE INDEX idx_inquiry_matches_org_id ON inquiry_matches(org_id);
CREATE INDEX idx_meetings_org_id ON meetings(org_id);
CREATE INDEX idx_financial_transactions_org_id ON financial_transactions(org_id);
CREATE INDEX idx_commissions_org_id ON commissions(org_id);
CREATE INDEX idx_recurring_expenses_org_id ON recurring_expenses(org_id);
CREATE INDEX idx_expense_categories_org_id ON expense_categories(org_id);
CREATE INDEX idx_contract_clause_templates_org_id ON contract_clause_templates(org_id);
CREATE INDEX idx_contract_clause_overrides_org_id ON contract_clause_overrides(org_id);
```

```sql
-- Migration: 20250101000003_migrate_existing_data.sql

-- Create org for each existing user and migrate their data
DO $$
DECLARE
  u RECORD;
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Get distinct users who have data
  FOR u IN
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM properties WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM tenants WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM contracts WHERE user_id IS NOT NULL
    ) all_users
  LOOP
    -- Get user email from auth.users
    SELECT COALESCE(
      raw_user_meta_data->>'full_name',
      split_part(email, '@', 1),
      'My Agency'
    ) INTO user_name
    FROM auth.users WHERE id = u.user_id;

    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES (user_name, u.user_id::text)
    RETURNING id INTO new_org_id;

    -- Add user as owner
    INSERT INTO org_members (org_id, user_id, role, status, joined_at)
    VALUES (new_org_id, u.user_id, 'owner', 'active', now());

    -- Update all user's data
    UPDATE properties SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE tenants SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE contracts SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE contract_details SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE property_owners SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE property_inquiries SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE inquiry_matches SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE meetings SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE financial_transactions SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE commissions SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE recurring_expenses SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE expense_categories SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE contract_clause_templates SET org_id = new_org_id WHERE user_id = u.user_id;
    UPDATE contract_clause_overrides SET org_id = new_org_id WHERE user_id = u.user_id;
  END LOOP;
END $$;
```

```sql
-- Migration: 20250101000004_add_org_constraints.sql

-- Add NOT NULL constraint after data is migrated
ALTER TABLE properties ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE contracts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE contract_details ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE property_owners ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE property_inquiries ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE inquiry_matches ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE meetings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE financial_transactions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE commissions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE recurring_expenses ALTER COLUMN org_id SET NOT NULL;
-- expense_categories can have NULL org_id for default categories
ALTER TABLE contract_clause_templates ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE contract_clause_overrides ALTER COLUMN org_id SET NOT NULL;
```

### Phase 3: Update RLS + Triggers (Day 6-8)

```sql
-- Migration: 20250101000005_update_rls_policies.sql

-- Drop old user_id based policies and create new org-based policies
-- (See Section 3 for full policy definitions)

-- Example for properties:
DROP POLICY IF EXISTS "Users can view own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;

CREATE POLICY "org_select_properties" ON properties
FOR SELECT USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "org_insert_properties" ON properties
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

CREATE POLICY "org_update_properties" ON properties
FOR UPDATE USING (
  deleted_at IS NULL
  AND org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

CREATE POLICY "org_delete_properties" ON properties
FOR DELETE USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid() AND status = 'active' AND role = 'owner'
  )
);

-- Repeat for all tables...
```

```sql
-- Migration: 20250101000006_create_new_user_trigger.sql

-- Auto-create org for new users
CREATE OR REPLACE FUNCTION handle_new_user_org()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.organizations (name, slug)
  VALUES (user_name, NEW.id::text)
  RETURNING id INTO new_org_id;

  INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_org();
```

---

## 8. Task Checklist

### Week 1: Database

- [ ] T1: Create organizations table migration
- [ ] T2: Create org_members table migration
- [ ] T3: Add org_id + deleted_at columns to all 14 business tables
- [ ] T4: Write data migration script
- [ ] T5: Test migration on staging/local
- [ ] T6: Add NOT NULL constraints
- [ ] T7: Update RLS policies (drop old, create new)
- [ ] T8: Create new user trigger

### Week 2: Frontend

- [ ] T9: Create org types (src/types/org.ts)
- [ ] T10: Create OrgContext + useOrg hook
- [ ] T11: Update properties.service.ts with org filtering
- [ ] T12: Update tenants.service.ts
- [ ] T13: Update contracts.service.ts
- [ ] T14: Update owners.service.ts
- [ ] T15: Update remaining services (meetings, inquiries, finance)
- [ ] T16: Update all components to use useOrg()
- [ ] T17: Implement soft delete in UI

### Week 3: Features + Testing

- [ ] T18: Create org settings page
- [ ] T19: Create team members page
- [ ] T20: Create invite flow
- [ ] T21: Update storage paths to use org_id
- [ ] T22: End-to-end testing
- [ ] T23: Deploy to production

---

## 9. RPC Functions to Update

These RPC functions need org_id validation:

- `rpc_create_contract_and_update_property` - Add org_id to contract
- `rpc_create_tenant_with_contract` - Add org_id to tenant and contract
- `rpc_update_contract_status` - Verify contract belongs to user's org
- `rpc_delete_contract` - Verify contract belongs to user's org
- `create_contract_atomic` - Add org_id to all created records
- `create_sale_commission` - Add org_id to commission

---

## 10. Future Expansion (When Requested)

### Adding Branches (1 week)
```sql
-- When a customer requests branch support:
CREATE TABLE branches (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL
);

ALTER TABLE org_members ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE properties ADD COLUMN branch_id UUID REFERENCES branches(id);
-- etc.
```

### Adding Editor Role (1 day)
```sql
-- When a customer requests write access for members:
ALTER TABLE org_members
  DROP CONSTRAINT org_members_role_check,
  ADD CONSTRAINT org_members_role_check
    CHECK (role IN ('owner', 'editor', 'member'));

-- Update RLS: editor can write, member can only read
```

---

## 11. Rollback Plan

If migration fails:

```sql
-- 1. Remove NOT NULL constraints
ALTER TABLE properties ALTER COLUMN org_id DROP NOT NULL;
-- Repeat for all tables...

-- 2. Drop new columns
ALTER TABLE properties DROP COLUMN IF EXISTS org_id;
ALTER TABLE properties DROP COLUMN IF EXISTS deleted_at;
-- Repeat for all tables...

-- 3. Drop new tables
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;

-- 4. Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_org();

-- 5. Restore old RLS policies from backup
```

---

*End of Document*
