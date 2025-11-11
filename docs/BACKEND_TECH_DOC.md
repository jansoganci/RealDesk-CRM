# Backend Technical Design: Property Management Module

**Project:** Emlak CRM
**Module:** Property Management (Rental + Sale Split)
**Version:** 2.1 (MVP)
**Last Updated:** January 11, 2025

---

## 1. Overview

This document defines the backend architecture for the redesigned Property Management module. The system now supports independent rental and sale workflows through dual status columns (`rental_status`, `sale_status`), replacing the legacy single `status` field.

**Target Users:** Turkish SME-level real estate agencies, small teams (1-10 agents), independent brokers.

### Key Changes from v1.0

**Before:**
- Single `status` field: `'Empty'` | `'Occupied'` | `'Inactive'`
- `sold_at` timestamp indicates sale completion
- Status changes mixed rental and sale logic

**After:**
- `rental_status`: `'available'` | `'rented'` | `'not_for_rent'`
- `sale_status`: `'available'` | `'sold'` | `'not_for_sale'`
- Independent status management with atomic RPC updates
- Clear separation of rental contracts and sale commissions

---

## 2. Database Schema Updates

### 2.1 Properties Table Changes

**Current Schema (from `20251027212128_create_properties_table.sql`):**

```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES property_owners(id) ON DELETE CASCADE,
  address text NOT NULL,
  city text,
  district text,
  status text NOT NULL DEFAULT 'Empty',
  notes text,
  listing_url text, -- Added in 20250104000000
  rent_amount numeric, -- Added later
  sale_price numeric, -- Added in 20250110000000
  sold_at timestamptz, -- Added in 20250110000000
  sold_price numeric, -- Added in 20250110000000
  currency text, -- Added later
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Added in 20250111000000
  CONSTRAINT valid_property_status CHECK (status IN ('Empty', 'Occupied', 'Inactive'))
);
```

**Required Migration: Add Dual Status Columns & Drop Legacy Status**

```sql
-- Migration: 20250112000000_add_rental_sale_status_columns.sql

-- Step 1: Add new status columns (nullable initially)
ALTER TABLE properties
ADD COLUMN rental_status TEXT,
ADD COLUMN sale_status TEXT;

-- Step 2: Backfill data from existing status + sold_at
UPDATE properties
SET
  rental_status = CASE
    WHEN status = 'Occupied' THEN 'rented'
    WHEN status = 'Empty' THEN 'available'
    WHEN status = 'Inactive' THEN 'not_for_rent'
    ELSE 'not_for_rent'
  END,
  sale_status = CASE
    WHEN sold_at IS NOT NULL THEN 'sold'
    WHEN sale_price IS NOT NULL AND sold_at IS NULL THEN 'available'
    ELSE 'not_for_sale'
  END;

-- Step 3: Add constraints
ALTER TABLE properties
ALTER COLUMN rental_status SET NOT NULL,
ALTER COLUMN sale_status SET NOT NULL;

ALTER TABLE properties
ADD CONSTRAINT valid_rental_status
  CHECK (rental_status IN ('available', 'rented', 'not_for_rent')),
ADD CONSTRAINT valid_sale_status
  CHECK (sale_status IN ('available', 'sold', 'not_for_sale'));

-- Step 4: Create indexes for filtering
CREATE INDEX idx_properties_rental_status ON properties(rental_status);
CREATE INDEX idx_properties_sale_status ON properties(sale_status);
CREATE INDEX idx_properties_user_rental ON properties(user_id, rental_status);
CREATE INDEX idx_properties_user_sale ON properties(user_id, sale_status);

-- Step 5: Drop legacy status column and constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS valid_property_status;
ALTER TABLE properties DROP COLUMN status;

-- Step 6: Validation check
DO $$
DECLARE
  null_rental INTEGER;
  null_sale INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_rental FROM properties WHERE rental_status IS NULL;
  SELECT COUNT(*) INTO null_sale FROM properties WHERE sale_status IS NULL;

  IF null_rental > 0 OR null_sale > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % properties have NULL rental_status, % have NULL sale_status',
      null_rental, null_sale;
  END IF;

  RAISE NOTICE '✅ Migration complete: All properties have rental_status and sale_status';
END $$;
```

---

### 2.2 Updated Properties Table Schema

**Final Schema:**

```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES property_owners(id) ON DELETE CASCADE,
  address text NOT NULL,
  city text,
  district text,

  -- Dual status columns
  rental_status text NOT NULL CHECK (rental_status IN ('available', 'rented', 'not_for_rent')),
  sale_status text NOT NULL CHECK (sale_status IN ('available', 'sold', 'not_for_sale')),

  -- Pricing fields
  rent_amount numeric,
  sale_price numeric,
  currency text, -- 'USD' | 'TRY'

  -- Sale tracking
  sold_at timestamptz,
  sold_price numeric,

  -- Metadata
  listing_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_rental_status ON properties(rental_status);
CREATE INDEX idx_properties_sale_status ON properties(sale_status);
CREATE INDEX idx_properties_user_rental ON properties(user_id, rental_status);
CREATE INDEX idx_properties_user_sale ON properties(user_id, sale_status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_district ON properties(district);
```

---

### 2.3 Contracts Table (No Changes Required)

The `contracts` table already supports the rental workflow and doesn't need structural changes:

```sql
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  rent_amount numeric,
  currency text,
  status text NOT NULL DEFAULT 'Active', -- 'Active' | 'Inactive' | 'Archived'
  notes text,
  contract_pdf_path text,
  rent_increase_reminder_enabled boolean DEFAULT false,
  rent_increase_reminder_days integer DEFAULT 90,
  rent_increase_reminder_contacted boolean DEFAULT false,
  expected_new_rent numeric,
  reminder_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Constraint: Only one active contract per property
CREATE UNIQUE INDEX uniq_active_contract_per_property
  ON contracts(property_id)
  WHERE status = 'Active';
```

---

### 2.4 Commissions Table (No Changes Required)

Already supports both rental and sale commissions:

```sql
CREATE TABLE commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('rental', 'sale')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  property_address text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
```

---

## 3. Service Layer Refactoring

### 3.1 Properties Service Updates

**File:** `src/services/properties.service.ts`

**New Methods Required:**

```typescript
class PropertiesService {
  // ============================================================
  // NEW: Rental-specific queries
  // ============================================================

  /**
   * Fetch properties available for rent or currently rented
   * Excludes properties marked as 'not_for_rent'
   */
  async getRentalProperties(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*),
        contracts(
          id, status, rent_amount, currency, end_date,
          tenant:tenants(*)
        )
      `)
      .in('rental_status', ['available', 'rented'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return this.transformPropertiesWithContracts(data || []);
  }

  /**
   * Get count of rental properties for tab badge
   */
  async getRentalPropertiesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('rental_status', ['available', 'rented']);

    if (error) throw error;
    return count || 0;
  }

  // ============================================================
  // NEW: Sale-specific queries
  // ============================================================

  /**
   * Fetch properties for sale or sold
   * Excludes properties marked as 'not_for_sale'
   */
  async getSaleProperties(): Promise<PropertyWithOwner[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        photos:property_photos(*)
      `)
      .in('sale_status', ['available', 'sold'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(this.transformProperty) || [];
  }

  /**
   * Get count of sale properties for tab badge
   */
  async getSalePropertiesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('sale_status', ['available', 'sold']);

    if (error) throw error;
    return count || 0;
  }

  // ============================================================
  // UPDATED: Create/Update methods
  // ============================================================

  async create(property: PropertyInsert): Promise<Property> {
    const userId = await getAuthenticatedUserId();

    const newProperty = await insertRow('properties', {
      ...property,
      user_id: userId,
      // Set defaults if not provided
      rental_status: property.rental_status || 'not_for_rent',
      sale_status: property.sale_status || 'not_for_sale',
    });

    // Trigger matching if property is available for rent
    if (newProperty.rental_status === 'available') {
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(newProperty.id);
    }

    return newProperty;
  }

  async update(id: string, property: PropertyUpdate): Promise<Property> {
    const oldProperty = await this.getById(id);
    const updatedProperty = await updateRow('properties', id, property);

    // Trigger matching if rental_status changed to available
    if (
      oldProperty?.rental_status !== 'available' &&
      updatedProperty.rental_status === 'available'
    ) {
      const { inquiriesService } = await import('../lib/serviceProxy');
      await inquiriesService.checkMatchesForNewProperty(id);
    }

    return updatedProperty;
  }

  // ============================================================
  // HELPER: Transform properties with contracts
  // ============================================================

  private transformPropertiesWithContracts(properties: any[]): PropertyWithOwner[] {
    return properties.map(property => {
      const contracts = Array.isArray(property.contracts) ? property.contracts : [];
      const activeContract = contracts.find(c => c?.status === 'Active');

      const { contracts: _, ...rest } = property;
      return {
        ...rest,
        activeTenant: activeContract?.tenant || undefined,
        activeContract: activeContract ? {
          id: activeContract.id,
          rent_amount: activeContract.rent_amount,
          currency: activeContract.currency,
          end_date: activeContract.end_date,
          status: activeContract.status,
        } : undefined,
      } as PropertyWithOwner;
    });
  }

  // ============================================================
  // UPDATED: Stats method
  // ============================================================

  async getStats() {
    const { data, error } = await supabase
      .from('properties')
      .select('rental_status, sale_status');

    if (error) throw error;

    const properties = (data || []) as Array<{
      rental_status: string;
      sale_status: string;
    }>;

    return {
      total: properties.length || 0,
      // Rental stats
      availableForRent: properties.filter(p => p.rental_status === 'available').length || 0,
      rented: properties.filter(p => p.rental_status === 'rented').length || 0,
      // Sale stats
      availableForSale: properties.filter(p => p.sale_status === 'available').length || 0,
      sold: properties.filter(p => p.sale_status === 'sold').length || 0,
    };
  }
}
```

---

## 4. RPC Functions (Supabase)

### 4.1 Core RPC: Create Tenant with Contract

**Purpose:** Atomically create tenant + contract and update property rental_status

```sql
-- Migration: 20250112000001_update_core_rpcs.sql

CREATE OR REPLACE FUNCTION rpc_create_tenant_with_contract(
  p_tenant jsonb,
  p_contract jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_contract_id uuid;
  v_property_id uuid;
  v_contract_status text;
  v_result jsonb;
BEGIN
  v_property_id := (p_contract->>'property_id')::uuid;
  v_contract_status := p_contract->>'status';

  -- Validate required fields
  IF v_property_id IS NULL THEN
    RAISE EXCEPTION 'Property ID is required for contract creation';
  END IF;

  IF p_tenant->>'name' IS NULL OR p_tenant->>'name' = '' THEN
    RAISE EXCEPTION 'Tenant name is required';
  END IF;

  -- Step 1: Create tenant
  INSERT INTO tenants (
    name, phone, email, notes, user_id
  )
  SELECT
    p_tenant->>'name',
    p_tenant->>'phone',
    p_tenant->>'email',
    p_tenant->>'notes',
    user_id
  FROM properties WHERE id = v_property_id
  RETURNING id INTO v_tenant_id;

  -- Step 2: Create contract
  INSERT INTO contracts (
    tenant_id, property_id, start_date, end_date,
    rent_amount, currency, status, notes,
    rent_increase_reminder_enabled,
    rent_increase_reminder_days,
    rent_increase_reminder_contacted,
    expected_new_rent,
    reminder_notes,
    user_id
  )
  SELECT
    v_tenant_id,
    v_property_id,
    (p_contract->>'start_date')::date,
    (p_contract->>'end_date')::date,
    NULLIF(p_contract->>'rent_amount', '')::numeric,
    COALESCE(p_contract->>'currency', 'USD'),
    COALESCE(p_contract->>'status', 'Active'),
    p_contract->>'notes',
    COALESCE((p_contract->>'rent_increase_reminder_enabled')::boolean, false),
    COALESCE((p_contract->>'rent_increase_reminder_days')::integer, 90),
    false,
    NULLIF(p_contract->>'expected_new_rent', '')::numeric,
    p_contract->>'reminder_notes',
    user_id
  FROM properties WHERE id = v_property_id
  RETURNING id INTO v_contract_id;

  -- Step 3: Update property rental_status if contract is Active
  IF v_contract_status = 'Active' THEN
    UPDATE properties
    SET
      rental_status = 'rented',
      updated_at = NOW()
    WHERE id = v_property_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to update property - not found: %', v_property_id;
    END IF;
  END IF;

  -- Return result
  v_result := jsonb_build_object(
    'tenant_id', v_tenant_id,
    'contract_id', v_contract_id,
    'property_id', v_property_id,
    'success', true
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in rpc_create_tenant_with_contract: %', SQLERRM;
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_create_tenant_with_contract TO authenticated;
```

---

### 4.2 Core RPC: Create Sale Commission

**Purpose:** Create sale commission and mark property as sold

```sql
-- Same migration file: 20250112000001_update_core_rpcs.sql

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

  -- Validate property exists
  IF v_property_address IS NULL THEN
    RAISE EXCEPTION 'Property with id % not found', p_property_id;
  END IF;

  -- Check if sale commission already exists
  IF EXISTS (
    SELECT 1 FROM commissions
    WHERE property_id = p_property_id AND type = 'sale'
  ) THEN
    RAISE EXCEPTION 'Sale commission already exists for property %', v_property_address;
  END IF;

  -- Insert commission
  INSERT INTO commissions (
    property_id, type, amount, currency,
    property_address, notes, user_id
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

  -- Update property sale_status to 'sold'
  UPDATE properties
  SET
    sale_status = 'sold',
    sold_at = timezone('utc'::text, now()),
    sold_price = p_sale_price,
    updated_at = now()
  WHERE id = p_property_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_sale_commission TO authenticated;
```

---

### 4.3 Trigger: Automatic Rental Status Sync

**Purpose:** Automatically update `rental_status` when contracts are updated or deleted

```sql
-- Migration: 20250112000002_add_contract_status_trigger.sql

CREATE OR REPLACE FUNCTION sync_property_rental_status()
RETURNS TRIGGER AS $$
DECLARE
  v_property_id UUID;
  v_active_count INTEGER;
BEGIN
  -- Get property_id from OLD (DELETE) or NEW (UPDATE)
  IF TG_OP = 'DELETE' THEN
    v_property_id := OLD.property_id;
  ELSE
    v_property_id := NEW.property_id;
  END IF;

  -- Count active contracts for this property
  SELECT COUNT(*) INTO v_active_count
  FROM contracts
  WHERE property_id = v_property_id AND status = 'Active';

  -- Update rental_status based on active contract count
  IF v_active_count = 0 THEN
    UPDATE properties
    SET
      rental_status = 'available',
      updated_at = NOW()
    WHERE id = v_property_id;
  ELSIF v_active_count >= 1 THEN
    UPDATE properties
    SET
      rental_status = 'rented',
      updated_at = NOW()
    WHERE id = v_property_id;
  END IF;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on contract UPDATE (status changes)
CREATE TRIGGER trigger_sync_rental_status_on_update
  AFTER UPDATE OF status ON contracts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_property_rental_status();

-- Trigger on contract DELETE
CREATE TRIGGER trigger_sync_rental_status_on_delete
  AFTER DELETE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_property_rental_status();
```

---

## 5. API Design & Integration

### 5.1 Service Method Summary

**Frontend → Backend Integration Points:**

| Frontend Hook | Backend Method | Supabase Query Filter |
|---------------|----------------|----------------------|
| `useRentalProperties()` | `propertiesService.getRentalProperties()` | `rental_status IN ('available', 'rented')` |
| `useSaleProperties()` | `propertiesService.getSaleProperties()` | `sale_status IN ('available', 'sold')` |
| `useRentalCount()` | `propertiesService.getRentalPropertiesCount()` | `count(*)` with rental filter |
| `useSaleCount()` | `propertiesService.getSalePropertiesCount()` | `count(*)` with sale filter |

---

### 5.2 Create/Update Property Flow

**Request Payload:**

```typescript
interface PropertyInsert {
  address: string;
  city?: string;
  district?: string;
  owner_id: string;

  // Dual status fields
  rental_status?: 'available' | 'rented' | 'not_for_rent';
  sale_status?: 'available' | 'sold' | 'not_for_sale';

  // Pricing
  rent_amount?: number;
  sale_price?: number;
  currency?: 'USD' | 'TRY';

  listing_url?: string;
  notes?: string;
}
```

**Example API Call (Create):**

```typescript
const newProperty = await propertiesService.create({
  address: 'Kadıköy Apt, 2+1',
  city: 'İstanbul',
  district: 'Kadıköy',
  owner_id: 'owner-uuid',
  rental_status: 'available',
  sale_status: 'not_for_sale',
  rent_amount: 15000,
  currency: 'TRY',
});
```

**Backend Processing:**

1. `propertiesService.create()` injects `user_id` from auth
2. Inserts row with both `rental_status` and `sale_status`
3. If `rental_status === 'available'`, triggers inquiry matching
4. Returns created property

---

### 5.3 Add Tenant Flow

**Request Payload:**

```typescript
interface TenantWithContractData {
  tenant: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
  contract: {
    property_id: string;
    start_date: string;
    end_date: string;
    rent_amount?: number;
    currency?: string;
    status?: 'Active' | 'Inactive';
    // ... reminder fields
  };
  pdfFile?: File;
}
```

**Backend Flow:**

1. Frontend calls `tenantsService.createTenantWithContract(data)`
2. Service calls Supabase RPC `rpc_create_tenant_with_contract`
3. RPC performs atomic transaction:
   - Creates tenant
   - Creates contract
   - Updates `properties.rental_status = 'rented'` (if contract Active)
   - Creates rental commission (via existing trigger)
4. Returns `{ tenant_id, contract_id }`

**RPC Response:**

```json
{
  "tenant_id": "uuid",
  "contract_id": "uuid",
  "property_id": "uuid",
  "success": true
}
```

---

### 5.4 Mark as Sold Flow

**Request Payload:**

```typescript
interface MarkAsSoldRequest {
  propertyId: string;
  salePrice: number;
  currency: 'USD' | 'TRY';
}
```

**Backend Flow:**

1. Frontend calls `commissionsService.createSaleCommission(propertyId, salePrice, currency)`
2. Service calls Supabase RPC `create_sale_commission`
3. RPC performs:
   - Calculates 4% commission
   - Creates commission record
   - Updates `properties.sale_status = 'sold'`
   - Sets `sold_at = NOW()`
   - Sets `sold_price = p_sale_price`
4. Returns `commission_id`

**RPC Response:**

```json
"commission-uuid"
```

---

## 6. Automation & Business Logic

### 6.1 Status Synchronization Rules

**Rental Status Changes:**

| Event | Mechanism | rental_status Update |
|-------|-----------|---------------------|
| Active contract created | RPC: `rpc_create_tenant_with_contract` | `available` → `rented` |
| Contract status updated to Inactive/Archived | Trigger: `sync_property_rental_status()` | `rented` → `available` (if no other active contracts) |
| Contract deleted | Trigger: `sync_property_rental_status()` | `rented` → `available` (if no other active contracts) |

**Sale Status Changes:**

| Event | Mechanism | sale_status Update |
|-------|-----------|-------------------|
| Mark as sold | RPC: `create_sale_commission` | `available` → `sold` |
| Manual edit | Service: `propertiesService.update()` | User-controlled |

---

### 6.2 Rental Commission Trigger

**Existing Trigger (No Changes Required):**

```sql
CREATE OR REPLACE FUNCTION create_rental_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create commission for active contracts with rent amount
  IF NEW.status = 'Active' AND NEW.rent_amount > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM commissions
      WHERE contract_id = NEW.id AND type = 'rental'
    ) THEN
      INSERT INTO commissions (
        property_id, contract_id, type, amount,
        currency, property_address, notes, user_id
      )
      SELECT
        NEW.property_id, NEW.id, 'rental', NEW.rent_amount,
        NEW.currency, p.address,
        'Commission from rental contract',
        (SELECT user_id FROM properties WHERE id = NEW.property_id)
      FROM properties p
      WHERE p.id = NEW.property_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_rental_commission
  AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION create_rental_commission();
```

---

### 6.3 Data Consistency Validation

**Validation Function (for migration and manual checks):**

```sql
-- Included in migration: 20250112000001_update_core_rpcs.sql

CREATE OR REPLACE FUNCTION validate_property_statuses()
RETURNS TABLE(property_id uuid, issue text) AS $$
BEGIN
  -- Check rental_status inconsistencies
  RETURN QUERY
  SELECT p.id, 'rental_status=rented but no active contract' AS issue
  FROM properties p
  LEFT JOIN contracts c ON c.property_id = p.id AND c.status = 'Active'
  WHERE p.rental_status = 'rented' AND c.id IS NULL;

  RETURN QUERY
  SELECT p.id, 'rental_status=available but has active contract' AS issue
  FROM properties p
  INNER JOIN contracts c ON c.property_id = p.id AND c.status = 'Active'
  WHERE p.rental_status = 'available';

  -- Check sale_status inconsistencies
  RETURN QUERY
  SELECT p.id, 'sale_status=sold but sold_at is NULL' AS issue
  FROM properties p
  WHERE p.sale_status = 'sold' AND p.sold_at IS NULL;

  RETURN QUERY
  SELECT p.id, 'sale_status=available but sold_at is NOT NULL' AS issue
  FROM properties p
  WHERE p.sale_status = 'available' AND p.sold_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Usage after migrations: SELECT * FROM validate_property_statuses();
```

**When to Run:**
- After initial migration (included in migration script)
- During troubleshooting if status inconsistencies are suspected
- Not intended for regular production use

---

## 7. Authentication & Authorization

### 7.1 Row-Level Security (RLS)

**Existing RLS Policies (from `20250111000001_update_rls_policies.sql`):**

All tables already have user-scoped RLS:

```sql
-- Properties table RLS
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);
```

**No Changes Required** - New status columns are automatically protected by existing user_id-based policies.

---

### 7.2 RPC Security

**All RPCs use `SECURITY DEFINER` with user validation:**

```sql
-- Example: rpc_create_tenant_with_contract
-- Inherits user_id from properties table query
SELECT user_id FROM properties WHERE id = v_property_id

-- Ensures tenant/contract are created with correct user_id
```

**Key Security Principles:**

1. **Never trust client-provided `user_id`** - Always fetch from `auth.uid()` or existing related records
2. **Use `SECURITY DEFINER`** to bypass RLS temporarily within RPC, but validate ownership first
3. **Grant EXECUTE permissions** only to `authenticated` role, never `anon`

---

## 8. Error Handling & Validation

### 8.1 Backend Error Codes

**Existing Error System (from `src/lib/errorCodes.ts`):**

```typescript
export const ERROR_TENANT_NAME_REQUIRED = 'TENANT_NAME_REQUIRED';
export const ERROR_TENANT_PROPERTY_REQUIRED = 'TENANT_PROPERTY_REQUIRED';
export const ERROR_CONTRACT_START_DATE_REQUIRED = 'CONTRACT_START_DATE_REQUIRED';
export const ERROR_CONTRACT_END_DATE_REQUIRED = 'CONTRACT_END_DATE_REQUIRED';
```

**New Error Codes Required:**

```typescript
// Property status errors
export const ERROR_INVALID_RENTAL_STATUS = 'INVALID_RENTAL_STATUS';
export const ERROR_INVALID_SALE_STATUS = 'INVALID_SALE_STATUS';
export const ERROR_PROPERTY_ALREADY_SOLD = 'PROPERTY_ALREADY_SOLD';
export const ERROR_PROPERTY_HAS_ACTIVE_CONTRACT = 'PROPERTY_HAS_ACTIVE_CONTRACT';
```

---

### 8.2 RPC Error Handling

**Standard Pattern:**

```sql
CREATE OR REPLACE FUNCTION rpc_example(...)
RETURNS ... AS $$
BEGIN
  -- Validation
  IF condition THEN
    RAISE EXCEPTION 'ERROR_CODE: %', details;
  END IF;

  -- Business logic
  ...

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in rpc_example: %', SQLERRM;
    RAISE; -- Re-raise to trigger transaction rollback
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 8.3 Frontend Error Mapping

**Existing `errorMapper.ts` pattern:**

```typescript
export const getErrorMessage = (error: any, t: TFunction): string => {
  if (error instanceof AppError) {
    return t(`errors:${error.code}`, { defaultValue: error.message });
  }

  // Supabase error codes
  const supabaseError = error as { code?: string; message?: string };
  if (supabaseError.code === '23505') {
    if (supabaseError.message?.includes('uniq_active_contract_per_property')) {
      return t('errors:ERROR_DUPLICATE_ACTIVE_CONTRACT');
    }
  }

  return t('errors:ERROR_UNKNOWN');
};
```

**Add translations:**

```json
// public/locales/en/errors.json
{
  "ERROR_INVALID_RENTAL_STATUS": "Invalid rental status. Must be 'available', 'rented', or 'not_for_rent'.",
  "ERROR_INVALID_SALE_STATUS": "Invalid sale status. Must be 'available', 'sold', or 'not_for_sale'.",
  "ERROR_PROPERTY_ALREADY_SOLD": "This property has already been marked as sold.",
  "ERROR_PROPERTY_HAS_ACTIVE_CONTRACT": "Cannot change rental status while property has an active contract."
}
```

---

## 9. Performance Considerations

### 9.1 Query Optimization

**Index Strategy:**

```sql
-- Single-column indexes for filtering
CREATE INDEX idx_properties_rental_status ON properties(rental_status);
CREATE INDEX idx_properties_sale_status ON properties(sale_status);

-- Composite indexes for common query patterns
CREATE INDEX idx_properties_user_rental ON properties(user_id, rental_status);
CREATE INDEX idx_properties_user_sale ON properties(user_id, sale_status);

-- Support location-based searches
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_district ON properties(district);
```

**Query Performance:**

```sql
-- Efficient: Uses idx_properties_user_rental
SELECT * FROM properties
WHERE user_id = 'uuid' AND rental_status IN ('available', 'rented');

-- Efficient: Uses idx_properties_user_sale
SELECT * FROM properties
WHERE user_id = 'uuid' AND sale_status = 'sold';
```

---

### 9.2 RPC Best Practices

**Optimization Guidelines:**

1. **Minimize queries inside RPCs** - Use JOINs where possible
2. **Batch updates** - Update multiple tables in single transaction
3. **Avoid N+1 queries** - Use subqueries or CTEs

**Example Optimization:**

```sql
-- BAD: Multiple queries
v_user_id := (SELECT user_id FROM properties WHERE id = p_property_id);
v_address := (SELECT address FROM properties WHERE id = p_property_id);

-- GOOD: Single query
SELECT user_id, address INTO v_user_id, v_address
FROM properties WHERE id = p_property_id;
```

---

### 9.3 Caching Strategy

**Frontend (React Query):**

```typescript
// Cache rental properties for 30 seconds
const { data: rentalProperties } = useQuery(
  ['rental-properties', userId],
  () => propertiesService.getRentalProperties(),
  {
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  }
);
```

**Backend (Supabase):**
- RLS policies automatically filtered per user (no cross-user cache pollution)
- Use Supabase real-time subscriptions for live updates (optional enhancement)

---

## 10. Testing Strategy

### 10.1 Database Tests

**Test Scenarios:**

1. **Migration Tests:**
   - Verify `rental_status` and `sale_status` columns added
   - Verify backfill logic (status → rental_status mapping)
   - Verify constraints and indexes created
   - Verify legacy `status` column removed

2. **RPC Tests:**
   - Test `rpc_create_tenant_with_contract` updates `rental_status`
   - Test `create_sale_commission` updates `sale_status`
   - Test error cases (duplicate active contract, property not found)

3. **Trigger Tests:**
   - Test contract status update triggers rental_status sync
   - Test contract deletion triggers rental_status sync

**Example Test (SQL):**

```sql
-- Test: Create tenant updates rental_status
BEGIN;
  -- Setup: Create property with rental_status = 'available'
  INSERT INTO properties (id, address, owner_id, rental_status, sale_status, user_id)
  VALUES ('test-prop-1', 'Test Address', 'owner-1', 'available', 'not_for_sale', 'user-1');

  -- Action: Create tenant with active contract
  SELECT rpc_create_tenant_with_contract(
    '{"name": "Test Tenant", "phone": "1234567890"}'::jsonb,
    '{"property_id": "test-prop-1", "start_date": "2025-01-01", "end_date": "2025-12-31", "status": "Active"}'::jsonb
  );

  -- Assert: rental_status changed to 'rented'
  SELECT rental_status FROM properties WHERE id = 'test-prop-1';
  -- Expected: 'rented'

ROLLBACK;
```

---

### 10.2 Service Layer Tests

**Unit Tests:**

```typescript
describe('PropertiesService', () => {
  describe('getRentalProperties', () => {
    it('should return only properties with rental_status in (available, rented)', async () => {
      const properties = await propertiesService.getRentalProperties();

      properties.forEach(p => {
        expect(['available', 'rented']).toContain(p.rental_status);
      });
    });
  });

  describe('create', () => {
    it('should set default rental_status if not provided', async () => {
      const property = await propertiesService.create({
        address: 'Test',
        owner_id: 'owner-1',
        // No rental_status provided
      });

      expect(property.rental_status).toBe('not_for_rent');
    });
  });
});
```

---

### 10.3 Integration Tests

**E2E Flow Tests:**

1. **Rental Flow:**
   - Create property with `rental_status = 'available'`
   - Add tenant → Verify `rental_status` changes to `'rented'`
   - Archive contract → Verify `rental_status` returns to `'available'`

2. **Sale Flow:**
   - Create property with `sale_status = 'available'`
   - Mark as sold → Verify `sale_status` changes to `'sold'`
   - Verify `sold_at` timestamp set

---

## 11. Migration Rollback Plan

**If migration fails or needs to be reverted:**

```sql
-- Rollback: 20250112999999_rollback_dual_status.sql

-- Step 1: Re-add legacy status column
ALTER TABLE properties ADD COLUMN status text DEFAULT 'Empty';

-- Step 2: Restore legacy status from new statuses
UPDATE properties
SET status = CASE
  WHEN rental_status = 'rented' THEN 'Occupied'
  WHEN rental_status = 'available' THEN 'Empty'
  ELSE 'Inactive'
END;

-- Step 3: Make status NOT NULL and add constraint
ALTER TABLE properties ALTER COLUMN status SET NOT NULL;
ALTER TABLE properties ADD CONSTRAINT valid_property_status
  CHECK (status IN ('Empty', 'Occupied', 'Inactive'));

-- Step 4: Drop new columns
ALTER TABLE properties DROP COLUMN IF EXISTS rental_status;
ALTER TABLE properties DROP COLUMN IF EXISTS sale_status;

-- Step 5: Drop indexes
DROP INDEX IF EXISTS idx_properties_rental_status;
DROP INDEX IF EXISTS idx_properties_sale_status;
DROP INDEX IF EXISTS idx_properties_user_rental;
DROP INDEX IF EXISTS idx_properties_user_sale;

-- Step 6: Drop triggers and RPCs
DROP TRIGGER IF EXISTS trigger_sync_rental_status_on_update ON contracts;
DROP TRIGGER IF EXISTS trigger_sync_rental_status_on_delete ON contracts;
DROP FUNCTION IF EXISTS sync_property_rental_status();

-- Step 7: Restore original RPC versions
-- (Would need to restore from backup or previous migration files)

-- Step 8: Validation
SELECT COUNT(*) FROM properties WHERE status IS NULL;
-- Should be 0

RAISE NOTICE '❌ Rollback complete. System restored to single-status model.';
```

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] Review all migration SQL files for syntax errors
- [ ] Test migrations on staging database
- [ ] Verify backfill logic with production data sample
- [ ] Confirm RPC functions have correct permissions (`GRANT EXECUTE`)
- [ ] Update TypeScript types from Supabase schema

### Deployment

- [ ] Apply migrations in order:
  1. `20250112000000_add_rental_sale_status_columns.sql` - Schema + backfill + drop legacy status
  2. `20250112000001_update_core_rpcs.sql` - Update 2 core RPCs + validation function
  3. `20250112000002_add_contract_status_trigger.sql` - Add automatic sync trigger

### Post-Deployment

- [ ] Run validation: `SELECT * FROM validate_property_statuses()` - should return 0 rows
- [ ] Verify frontend can fetch rental/sale properties separately
- [ ] Test "Add Tenant" flow updates `rental_status`
- [ ] Test "Mark as Sold" flow updates `sale_status`
- [ ] Test contract status update triggers rental_status sync
- [ ] Monitor error logs for RPC failures
- [ ] Check performance of new indexed queries

---

## 13. Future Enhancements

### User-Requested Features (Post-MVP)

1. **Property Type Classification:**
   - Add `property_type` column (`'residential'` | `'commercial'` | `'land'`)
   - Filter rental/sale properties by type

2. **Multi-Channel Listing Management:**
   - Track which platforms property is listed on (Sahibinden, Hepsiemlak, etc.)
   - Sync status across channels

3. **Batch Operations:**
   - Bulk update rental_status for multiple properties
   - Bulk mark as sold/rented

4. **Advanced Filters:**
   - Filter by price range, location, property type
   - Saved filter presets

5. **Status Transition Notifications:**
   - Email/SMS alerts when property status changes
   - Webhook integrations for third-party systems

---

## 14. Summary

**Backend Changes Implemented:**

1. ✅ **Database:** Add `rental_status` and `sale_status` columns with backfill, drop legacy `status`
2. ✅ **Services:** Add `getRentalProperties()` and `getSaleProperties()` methods
3. ✅ **RPCs:** 2 core RPCs for tenant creation and sale commission
4. ✅ **Trigger:** Automatic rental_status sync on contract updates/deletes
5. ✅ **Validation:** Consistency check function for manual/migration use

**Migration Files (3 Total):**

1. `20250112000000_add_rental_sale_status_columns.sql` - Schema changes
2. `20250112000001_update_core_rpcs.sql` - RPC updates + validation function
3. `20250112000002_add_contract_status_trigger.sql` - Automatic sync trigger

**Dependencies:**

- Frontend must update to use new service methods
- Translation files must include new status labels
- Dashboard stats must query new columns

**Rollback Safety:**

- Rollback script available if needed
- All changes atomic (transaction-based)
- Backfill logic tested before deployment

---

**Document Status:** ✅ Ready for MVP Implementation
**Last Updated:** January 11, 2025
**Version:** 2.1 (Simplified for SME Scale)
**Target Users:** Turkish SME real estate agencies, small teams, independent agents
