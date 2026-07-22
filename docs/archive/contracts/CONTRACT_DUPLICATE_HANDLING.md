# Contract Creation - Duplicate Handling Logic

## Overview

The contract creation system uses **smart upsert logic** to handle existing data. It never creates duplicates based on TC hash for people or normalized address for properties, but it **DOES UPDATE** contact information when entities already exist.

---

## Key Lookup Mechanisms

### 1. Owner Lookup
- **Primary Key**: `tc_hash` (SHA-256 hash of TC number)
- **Scope**: Per user (`user_id` + `tc_hash`)
- **Uniqueness**: One owner per TC number per user

### 2. Tenant Lookup
- **Primary Key**: `tc_hash` (SHA-256 hash of TC number)
- **Scope**: Per user (`user_id` + `tc_hash`)
- **Uniqueness**: One tenant per TC number per user

### 3. Property Lookup
- **Composite Key**: `normalized_address` + `owner_id` + `user_id`
- **Normalization**: Removes spaces, punctuation, converts to lowercase
- **Example**: "Merkez Mah. Atatürk Cad. No:5 Daire:3" → "merkezmahataturkcad5daire3"
- **Uniqueness**: One property per address per owner per user

---

## Behavior for Existing Data

### 🟢 Existing Owner (Lines 90-98)

**Condition**: Owner with same `tc_hash` found in database

**Action**: **UPDATE existing record** with new contact data

```sql
-- Owner exists - update contact info (may have changed)
UPDATE property_owners
SET
  phone = owner_data->>'phone',              -- ✅ Updated
  email = owner_data->>'email',              -- ✅ Updated
  iban_encrypted = owner_data->>'iban_encrypted',  -- ✅ Updated
  updated_at = now()
WHERE id = v_owner_id;
```

**What's Updated**:
- ✅ `phone` - Always updated to new value
- ✅ `email` - Always updated to new value
- ✅ `iban_encrypted` - Always updated (bank account can change)
- ✅ `updated_at` - Timestamp refreshed

**What's NOT Updated**:
- ❌ `name` - **Name is NOT updated** (assumes TC hash is the source of truth)
- ❌ `tc_encrypted` - Immutable (same person)
- ❌ `tc_hash` - Immutable (lookup key)

**Return Value**: `created_owner: false`

---

### 🟢 Existing Tenant (Lines 133-141)

**Condition**: Tenant with same `tc_hash` found in database

**Action**: **UPDATE existing record** with new contact data and current address

```sql
-- Tenant exists - update contact info and current address
UPDATE tenants
SET
  address = tenant_data->>'address',         -- ✅ Updated (current address)
  phone = tenant_data->>'phone',             -- ✅ Updated
  email = tenant_data->>'email',             -- ✅ Updated
  updated_at = now()
WHERE id = v_tenant_id;
```

**What's Updated**:
- ✅ `address` - **Current address** (tenant may have moved)
- ✅ `phone` - Always updated to new value
- ✅ `email` - Always updated to new value
- ✅ `updated_at` - Timestamp refreshed

**What's NOT Updated**:
- ❌ `name` - **Name is NOT updated** (assumes TC hash is the source of truth)
- ❌ `tc_encrypted` - Immutable
- ❌ `tc_hash` - Immutable (lookup key)

**Return Value**: `created_tenant: false`

---

### 🟢 Existing Property (Lines 191-197)

**Condition**: Property with same `normalized_address` + `owner_id` found in database

**Action**: **UPDATE status to Occupied** (minimal update)

```sql
-- Property exists - update status to Occupied
UPDATE properties
SET
  status = 'Occupied',                       -- ✅ Updated
  updated_at = now()
WHERE id = v_property_id;
```

**What's Updated**:
- ✅ `status` - Changed to 'Occupied' (because new contract is being created)
- ✅ `updated_at` - Timestamp refreshed

**What's NOT Updated**:
- ❌ Address fields (`mahalle`, `cadde_sokak`, etc.) - Immutable (address defines the property)
- ❌ `type` - Property type doesn't change
- ❌ `use_purpose` - Not updated
- ❌ `owner_id` - Owner cannot change via this flow

**Return Value**: `created_property: false`

---

## Special Cases & Edge Scenarios

### 🔴 Case 1: Same TC, Different Name (Typo Correction)

**Scenario**:
- Existing owner: "Mehmet Yılmaz" (TC: 12345678901)
- New contract: "Mehmet YILMAZ" (TC: 12345678901)

**What Happens**:
```
1. Lookup by tc_hash → Found existing owner
2. Name mismatch detected
3. ❌ Name is NOT updated (line 93 doesn't update name)
4. ✅ Phone/email ARE updated
5. ✅ Contract links to existing owner with OLD NAME
```

**Result**: **Name typo is NOT corrected automatically**

**Why**: The RPC assumes TC hash is the source of truth, not the name. Name variations are expected (capitalization, middle names).

**User Must**: Manually edit owner record if name correction is needed.

---

### 🔴 Case 2: Phone Number Changed

**Scenario**:
- Existing tenant: "Ali Veli" (Phone: 5551234567)
- New contract: "Ali Veli" (Phone: 5559876543)

**What Happens**:
```
1. Lookup by tc_hash → Found existing tenant
2. ✅ Phone updated: 5551234567 → 5559876543 (line 137)
3. ✅ Contract links to tenant with NEW PHONE
4. ✅ updated_at timestamp refreshed
```

**Result**: **Phone is silently updated** - previous phone is lost (no history tracking)

**Warning Shown**:
```
⚠️ Sistemdeki bilgiler değişti:
Telefon: 5551234567 → 5559876543

Güncellensin mi?
```

**User Can**: Confirm or cancel before submission (via `duplicateCheck.service.ts`)

---

### 🔴 Case 3: Tenant with Multiple Active Contracts

**Scenario**:
- Tenant "Ali Veli" already has 2 active contracts
- User tries to create 3rd contract

**What Happens**:
```
1. Duplicate check warns user BEFORE submission
2. Warning: "⚠️ Bu kiracının 2 aktif sözleşmesi var"
3. User can:
   - Continue (create 3rd contract)
   - Cancel (review existing contracts first)
4. If user continues:
   - ✅ 3rd contract is created
   - ✅ Tenant record is updated with new contact info
   - ✅ All 3 contracts link to same tenant
```

**Result**: **Multiple active contracts are ALLOWED** (not blocked)

**Why**: Real scenario - tenant might rent 2+ properties from same owner.

---

### 🔴 Case 4: Same Address, Different Owner

**Scenario**:
- Property "Merkez Mah. Atatürk Cad. No:5 Daire:3"
- Owner 1: "Mehmet Yılmaz" → Property ID: abc-123
- Owner 2: "Ayşe Demir" → Property ID: def-456

**What Happens**:
```
1. Lookup: normalized_address + owner_id (line 146-150)
2. Query: WHERE normalized_address = 'merkezmahataturkcad53'
          AND owner_id = owner_2_id
3. Result: No match found (different owner)
4. ✅ New property created (same address, different owner)
```

**Result**: **Two properties with same address are created** (different owners)

**Why**: Address + Owner combo is unique. Same building unit can be owned by different people over time.

---

### 🔴 Case 5: Same Address, Same Owner (True Duplicate)

**Scenario**:
- Property "Merkez Mah. Atatürk Cad. No:5 Daire:3"
- Owner: "Mehmet Yılmaz"
- User tries to create 2nd contract for SAME property

**What Happens**:
```
1. Lookup: normalized_address + owner_id
2. Result: ✅ Existing property found
3. ✅ Property status updated to 'Occupied'
4. ✅ New contract links to existing property
5. ❌ NO duplicate property created
```

**Result**: **Property is reused** (correct behavior)

**Property History**: Property can have multiple contracts over time (different tenants).

---

## Data Flow Summary

### Step-by-Step Execution

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Check Owner (tc_hash)                              │
├─────────────────────────────────────────────────────────────┤
│ IF found:                                                   │
│   ✅ UPDATE phone, email, iban                              │
│   ❌ DO NOT UPDATE name                                     │
│   Return: created_owner = false                             │
│ IF NOT found:                                               │
│   ✅ INSERT new owner                                       │
│   Return: created_owner = true                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Check Tenant (tc_hash)                             │
├─────────────────────────────────────────────────────────────┤
│ IF found:                                                   │
│   ✅ UPDATE phone, email, address (current)                 │
│   ❌ DO NOT UPDATE name                                     │
│   Return: created_tenant = false                            │
│ IF NOT found:                                               │
│   ✅ INSERT new tenant                                      │
│   Return: created_tenant = true                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Check Property (normalized_address + owner_id)     │
├─────────────────────────────────────────────────────────────┤
│ IF found:                                                   │
│   ✅ UPDATE status to 'Occupied'                            │
│   ❌ DO NOT UPDATE address, type, or other fields          │
│   Return: created_property = false                          │
│ IF NOT found:                                               │
│   ✅ INSERT new property                                    │
│   Return: created_property = true                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Create Contract (ALWAYS NEW)                       │
├─────────────────────────────────────────────────────────────┤
│ ✅ INSERT new contract (never reuse)                        │
│ ✅ Link to owner_id, tenant_id, property_id                │
│ Return: contract_id                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Create Contract Details (if provided)              │
├─────────────────────────────────────────────────────────────┤
│ ✅ INSERT contract_details (payment info, conditions)       │
│ Return: contract_details_id                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Return Value Structure

```typescript
{
  success: true,
  owner_id: "abc-123",
  tenant_id: "def-456",
  property_id: "ghi-789",
  contract_id: "jkl-012",
  contract_details_id: "mno-345",
  created_owner: false,      // false = existing owner updated
  created_tenant: false,     // false = existing tenant updated
  created_property: true,    // true = new property created
  message: "Contract created successfully"
}
```

---

## User Warnings (duplicateCheck.service.ts)

The UI shows warnings BEFORE submission to let users confirm updates:

### Warning 1: Duplicate Name with Different TC

```
⚠️ "Mehmet Yılmaz" ismiyle 2 farklı kişi daha var sistemde (farklı TC No)

[Devam Et] [İptal]
```

**Purpose**: Warn about potential data entry error (same name, different people).

---

### Warning 2: Data Changes

```
⚠️ Sistemdeki bilgiler değişti:
Telefon: 5551234567 → 5559876543
Email: eski@mail.com → yeni@mail.com

Güncellensin mi?

[Evet, Güncelle] [Hayır, İptal]
```

**Purpose**: Explicitly confirm data updates (phone/email changes).

---

### Warning 3: Multiple Active Contracts

```
⚠️ Bu kiracının 2 aktif sözleşmesi var:
- Merkez Mah. Atatürk Cad. No:5
- Çankaya Mah. İnönü Sok. No:12

Devam edilsin mi?

[Evet] [Hayır]
```

**Purpose**: Alert user that tenant already has active contracts.

---

## Critical Insights

### ✅ What DOES Get Updated

| Field | Owner | Tenant | Property |
|-------|-------|--------|----------|
| `phone` | ✅ | ✅ | N/A |
| `email` | ✅ | ✅ | N/A |
| `iban_encrypted` | ✅ | N/A | N/A |
| `address` | N/A | ✅ (current) | N/A |
| `status` | N/A | N/A | ✅ (to Occupied) |
| `updated_at` | ✅ | ✅ | ✅ |

### ❌ What DOES NOT Get Updated

| Field | Owner | Tenant | Property | Reason |
|-------|-------|--------|----------|--------|
| `name` | ❌ | ❌ | N/A | TC hash is source of truth |
| `tc_encrypted` | ❌ | ❌ | N/A | Immutable identifier |
| `tc_hash` | ❌ | ❌ | N/A | Lookup key |
| Address fields | N/A | N/A | ❌ | Address defines property |
| `type` | N/A | N/A | ❌ | Property type is fixed |
| `owner_id` | N/A | N/A | ❌ | Owner cannot change via contract creation |

---

## Design Rationale

### Why Update Contact Info?

**Phone/Email changes are COMMON**:
- People change phone numbers
- Email addresses change
- IBAN accounts change

**Decision**: Auto-update contact info to keep data fresh.

**Risk**: Previous values are lost (no history tracking).

---

### Why NOT Update Name?

**Name variations are EXPECTED**:
- "Mehmet Yılmaz" vs "MEHMET YILMAZ"
- "Ali Veli" vs "Ali Veli Demir" (middle name added)
- "Ayşe Kaya" vs "Ayse Kaya" (ş vs s)

**Decision**: TC hash is the source of truth. Name variations don't matter as long as TC is same.

**Risk**: Typos in name are NOT auto-corrected.

**User Must**: Manually edit owner/tenant record to fix name typos.

---

### Why NOT Update Property Address?

**Address is the PRIMARY IDENTIFIER**:
- Changing address = different property
- If address is wrong, it should be a NEW property

**Decision**: Address is immutable. If user enters wrong address, they must delete and recreate.

**Exception**: Only `status` is updated (Occupied/Empty/Inactive).

---

## SQL Code Breakdown

### Owner Update Block (Lines 90-98)

```sql
ELSE
  -- Owner exists - update contact info (may have changed)
  UPDATE property_owners
  SET
    phone = owner_data->>'phone',              -- New phone
    email = owner_data->>'email',              -- New email
    iban_encrypted = owner_data->>'iban_encrypted',  -- New IBAN
    updated_at = now()                         -- Timestamp
  WHERE id = v_owner_id;                       -- Found owner
END IF;
```

**Key Points**:
- ✅ Updates 3 fields: phone, email, iban_encrypted
- ❌ Does NOT update: name, tc_encrypted, tc_hash
- ✅ Uses existing `v_owner_id` from SELECT (line 60-64)

---

### Tenant Update Block (Lines 133-141)

```sql
ELSE
  -- Tenant exists - update contact info and current address
  UPDATE tenants
  SET
    address = tenant_data->>'address',         -- Current address
    phone = tenant_data->>'phone',             -- New phone
    email = tenant_data->>'email',             -- New email
    updated_at = now()                         -- Timestamp
  WHERE id = v_tenant_id;                      -- Found tenant
END IF;
```

**Key Points**:
- ✅ Updates 3 fields: address (current), phone, email
- ❌ Does NOT update: name, tc_encrypted, tc_hash
- ✅ `address` = tenant's CURRENT address (may move between contracts)

---

### Property Update Block (Lines 191-197)

```sql
ELSE
  -- Property exists - update status to Occupied
  UPDATE properties
  SET
    status = 'Occupied',                       -- Status change only
    updated_at = now()                         -- Timestamp
  WHERE id = v_property_id;                    -- Found property
END IF;
```

**Key Points**:
- ✅ Updates only 1 field: status
- ❌ Does NOT update: address fields, type, use_purpose
- ✅ Minimal update (property metadata is immutable)

---

## Testing Scenarios

### Scenario 1: Brand New Contract (All New Entities)

**Input**:
- Owner: "Mehmet Yılmaz" (TC: 12345678901) - Not in DB
- Tenant: "Ali Veli" (TC: 98765432109) - Not in DB
- Property: "Merkez Mah. Atatürk Cad. No:5" - Not in DB

**Expected Result**:
```json
{
  "created_owner": true,
  "created_tenant": true,
  "created_property": true
}
```

---

### Scenario 2: Existing Owner, New Tenant & Property

**Input**:
- Owner: "Mehmet Yılmaz" (TC: 12345678901) - ✅ Exists in DB
- Tenant: "Ali Veli" (TC: 98765432109) - Not in DB
- Property: "Merkez Mah. Atatürk Cad. No:5" - Not in DB

**Expected Result**:
```json
{
  "created_owner": false,      // Existing owner, contact info updated
  "created_tenant": true,
  "created_property": true
}
```

---

### Scenario 3: All Existing (Property Reuse)

**Input**:
- Owner: "Mehmet Yılmaz" (TC: 12345678901) - ✅ Exists
- Tenant: "Ali Veli" (TC: 98765432109) - ✅ Exists
- Property: "Merkez Mah. Atatürk Cad. No:5" - ✅ Exists (same owner)

**Expected Result**:
```json
{
  "created_owner": false,      // Contact info updated
  "created_tenant": false,     // Contact info updated
  "created_property": false    // Status updated to Occupied
}
```

**Result**: New contract links to all existing entities.

---

### Scenario 4: Phone Number Changed

**Database**:
- Tenant "Ali Veli" (TC: 12345678901, Phone: 5551234567)

**New Contract Input**:
- Tenant "Ali Veli" (TC: 12345678901, Phone: 5559876543)

**Expected Behavior**:
1. ⚠️ Warning shown: "Telefon: 5551234567 → 5559876543"
2. User clicks "Evet, Güncelle"
3. ✅ Phone updated in DB: `UPDATE tenants SET phone = '5559876543'`
4. ✅ Contract created with updated tenant

---

### Scenario 5: Name Typo (Not Corrected)

**Database**:
- Owner "Mehmet Yılmaz" (TC: 12345678901)

**New Contract Input**:
- Owner "Mehmet YILMAZ" (TC: 12345678901) - Uppercase

**Expected Behavior**:
1. ✅ TC hash matches → Owner found
2. ❌ Name NOT updated (line 93 doesn't update name)
3. ✅ Phone/email updated (if changed)
4. ✅ Contract links to owner with OLD NAME: "Mehmet Yılmaz"

**User Must**: Manually edit owner record to fix name.

---

## Files Involved

| File | Purpose |
|------|---------|
| `supabase/migrations/20251120_contract_atomic_transaction.sql` | RPC function with upsert logic (Lines 11-293) |
| `src/services/contractCreation.service.ts` | Service layer that calls RPC (Lines 30-167) |
| `src/services/duplicateCheck.service.ts` | Pre-submission warnings for data changes (Lines 1-178) |
| `src/features/contracts/components/ContractCreateForm.tsx` | UI form that shows warnings and calls service |

---

## Summary

| Entity | Lookup Key | Update Behavior | Fields Updated |
|--------|-----------|-----------------|----------------|
| **Owner** | `tc_hash` | ✅ UPDATE contact info | phone, email, iban_encrypted |
| **Tenant** | `tc_hash` | ✅ UPDATE contact info + address | phone, email, address |
| **Property** | `normalized_address` + `owner_id` | ✅ UPDATE status only | status (to Occupied) |
| **Contract** | N/A | ✅ ALWAYS CREATE NEW | All fields |

**Philosophy**:
- ✅ Smart upsert - avoid duplicate people/properties
- ✅ Contact info is mutable (phone/email change)
- ❌ Name is immutable (TC hash is source of truth)
- ❌ Address is immutable (defines property identity)
- ✅ Property status is mutable (Occupied/Empty)

---

**Created**: 2025-11-24
**Last Updated**: 2025-11-24
**Version**: 1.0.0
