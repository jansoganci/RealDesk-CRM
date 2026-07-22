# Sprint 7 — Security Deposit Tracker Implementation Plan

> **Project:** RealDesk US CRM
> **Pattern:** Layer-by-layer (DB → Service → Schema → UI → i18n → Route)
> **Implementation:** Claude Code (`--model sonnet`, default effort)

---

## 1. DATABASE — Migration

**File:** `supabase/migrations/0037_add_security_deposit_tracker.sql`

**New table:** `security_deposit_tracker`
```sql
CREATE TABLE security_deposit_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  deposit_amount NUMERIC(12,2) NOT NULL CHECK (deposit_amount >= 0),
  held_by TEXT NOT NULL DEFAULT 'landlord'
    CHECK (held_by IN ('landlord', 'escrow', 'government_agency', 'other')),
  held_by_other_description TEXT,
  return_deadline DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'partially_returned', 'fully_returned', 'disputed')),
  interest_required BOOLEAN DEFAULT FALSE,
  interest_amount NUMERIC(12,2),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Deductions (separate table for itemized deductions):**
```sql
CREATE TABLE deposit_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID NOT NULL REFERENCES security_deposit_tracker(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category TEXT
    CHECK (category IN ('damage', 'cleaning', 'unpaid_rent', 'late_fees', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Both tables get org-scoped SELECT/INSERT/UPDATE/DELETE policies.
**Triggers:** `updated_at` auto-update on tracker table.
**Indexes:** org_id, status, return_deadline.

---

## 2. TYPES

After migration → `npm run gen:types` → Supabase types auto-update.

---

## 3. SERVICE

**File:** `src/services/depositTracker.service.ts`

**Class:** `DepositTrackerService`

**Methods:**
- `getAll()` — all deposits for org, ordered by return_deadline
- `getById(id)` — single deposit with deductions
- `create(data)` — new deposit tracker entry
- `update(id, data)` — update tracker fields
- `updateStatus(id, status)` — quick status change
- `softDelete(id)`
- `getActive()` — deposits with status = 'held'
- `getPendingReturns()` — deposits past return_deadline but not yet returned
- `addDeduction(depositId, data)` — add itemized deduction
- `removeDeduction(deductionId)` — remove deduction
- `getDeductions(depositId)` — get all deductions for a deposit

**Proxy:** Register in `src/lib/serviceProxy.ts`

---

## 4. UI — Feature Folder

**Directory:** `src/features/deposit-tracker/`

### DepositTrackerPage.tsx
Main page showing all deposits in a table:
- Columns: Property, Tenant, Amount, Status badge, Return deadline, Days left
- Color-coded rows: overdue (red), due within 7 days (amber), normal (default)
- Search by property/tenant name
- Filter by status
- Click row → opens detail sheet

### components/DepositDialog.tsx
Create/Edit deposit dialog:
- Property selector (combobox/lookup)
- Tenant selector
- Amount input
- Held by (radio/select: landlord, escrow, government_agency, other)
- Return deadline date picker
- Interest required toggle
- Notes textarea

### components/DepositDetailSheet.tsx
Side sheet showing:
- Deposit summary (amount, status, deadlines)
- Deductions list with amounts and categories
- Add deduction button → inline form
- Status update buttons (mark as returned, mark as disputed)
- Edit button

### components/DeductionsList.tsx
Sub-component showing itemized deductions:
- Description, amount, category badge
- Delete button per deduction
- Total deductions at bottom
- Net deposit (deposit - deductions)

### components/StatusBadge.tsx
Reusable badge component:
- held → blue
- partially_returned → amber
- fully_returned → green
- disputed → red

### hooks/useDepositTracker.ts
Data fetching hook with refresh, error/loading states.

### schemas/deposit.schema.ts
Zod schemas for create/edit forms.

### index.ts
Barrel export.

---

## 5. i18n

**File:** `public/locales/en/deposit-tracker.json`

Keys needed: page title, status labels, form fields, held_by options, deduction categories, table headers, toasts, empty states.

---

## 6. ROUTE + NAV

- `ROUTES.DEPOSIT_TRACKER: '/deposits'` in constants.ts
- `<Route>` in App.tsx with `<ProtectedRoute>`
- Nav item in Sidebar.tsx (icon: `Landmark` or `Banknote`)

---

## 7. VERIFICATION

- `npm run typecheck` — 0 errors
- `npm run build` — success
- `npm run check:translations` — clean
