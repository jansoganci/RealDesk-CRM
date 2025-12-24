# Contracts Hub & Sales Contract (v2) Implementation Plan

> **Status**: Implementation Ready
> **Created**: 2024-12-26
> **Author**: Claude Code

---

## Table of Contents

- [A) Current State Audit](#a-current-state-audit)
- [B) Routing Conflict Fix Plan](#b-routing-conflict-fix-plan)
- [C) Minimal Unavoidable Rent Module Changes](#c-minimal-unavoidable-rent-module-changes)
- [D) ContractsHub UX Plan](#d-contractshub-ux-plan)
- [E) Sales Module UX Plan](#e-sales-module-ux-plan)
- [F) v2 Database Migration Draft](#f-v2-database-migration-draft)
- [G) Frontend Plumbing Plan](#g-frontend-plumbing-plan)
- [H) Step-by-Step Execution Plan](#h-step-by-step-execution-plan)
- [I) Test Checklist](#i-test-checklist)

---

## A) Current State Audit

### Rent Contract Routes (App.tsx)

| Route Constant | Path | Component | Line |
|----------------|------|-----------|------|
| `ROUTES.CONTRACTS` | `/contracts` | `<Contracts />` | 97 |
| `ROUTES.CONTRACT_CREATE` | `/contracts/create` | `<ContractCreate />` | 105 |
| (hardcoded) | `/contracts/:id/edit` | `<ContractEdit />` | 113 |
| (hardcoded) | `/contracts/import` | `<ContractImportPage />` | 121 |

### Route Constants (src/config/constants.ts:44-48)

```typescript
CONTRACTS: '/contracts',
CONTRACT_DETAIL: '/contracts/:id',
CONTRACT_NEW: '/contracts/new',
CONTRACT_CREATE: '/contracts/create',
CONTRACT_IMPORT: '/contracts/import',
```

### Key Rent Components (src/features/contracts/)

| File | Purpose |
|------|---------|
| `Contracts.tsx` | List page with filters, table/card views |
| `ContractCreate.tsx` | Create page wrapper |
| `ContractEdit.tsx` | Edit page wrapper |
| `ContractImportPage.tsx` | PDF import workflow |
| `components/ContractCreateForm.tsx` | Main create form |
| `components/ContractEditForm.tsx` | Main edit form |
| `components/EditableClausesSection.tsx` | Clause editor (33 clauses) |
| `hooks/useContractsActions.ts` | CRUD actions + navigation |
| `schemas/contractForm.schema.ts` | Zod validation |

### Rent Database Tables (DO NOT MODIFY)

| Table | Purpose |
|-------|---------|
| `contracts` | Main rent contracts (tenant_id, property_id, dates, amounts) |
| `contract_details` | Extended details (deposit, payment_day, etc.) |
| `contract_clause_templates` | 33 default clause templates per user |
| `contract_clause_overrides` | Per-contract clause customizations |

### Rent Services (DO NOT MODIFY)

| Service | Purpose |
|---------|---------|
| `contracts.service.ts` | CRUD for contracts table |
| `contractCreation.service.ts` | Contract creation logic |
| `contractUpdate.service.ts` | Contract update logic |
| `clauses.service.ts` | Clause template/override management |
| `contractPdf.service.ts` | PDF upload/download |

---

## B) Routing Conflict Fix Plan

### Problem

Current `/contracts` route shows rent list. We need it to be the new Hub page.

### Solution: Route Namespace Migration

| OLD PATH | NEW PATH | BEHAVIOR |
|----------|----------|----------|
| `/contracts` | `/contracts` | **NEW Hub page** |
| `/contracts` (rent list) | `/contracts/rent` | Rent list (moved) |
| `/contracts/create` | `/contracts/rent/create` | Rent create (moved) |
| `/contracts/:id/edit` | `/contracts/rent/:id/edit` | Rent edit (moved) |
| `/contracts/import` | `/contracts/rent/import` | Rent import (moved) |
| (new) | `/contracts/sale` | Sale list |
| (new) | `/contracts/sale/create` | Sale wizard |
| (new) | `/contracts/sale/:id/edit` | Sale edit |

### Redirect Strategy (Backwards Compatibility)

Add React Router `<Navigate>` redirects:

```
/contracts/create     → /contracts/rent/create
/contracts/import     → /contracts/rent/import
/contracts/:id/edit   → /contracts/rent/:id/edit
```

### Updated Route Constants

```typescript
// Hub (NEW)
CONTRACTS_HUB: '/contracts',

// Rent namespace (MOVED)
CONTRACTS_RENT: '/contracts/rent',
CONTRACTS_RENT_CREATE: '/contracts/rent/create',
CONTRACTS_RENT_EDIT: '/contracts/rent/:id/edit',
CONTRACTS_RENT_IMPORT: '/contracts/rent/import',

// Sale namespace (NEW)
CONTRACTS_SALE: '/contracts/sale',
CONTRACTS_SALE_CREATE: '/contracts/sale/create',
CONTRACTS_SALE_EDIT: '/contracts/sale/:id/edit',

// Legacy aliases (for existing rent module code compatibility)
CONTRACTS: '/contracts/rent',
CONTRACT_CREATE: '/contracts/rent/create',
CONTRACT_IMPORT: '/contracts/rent/import',
```

---

## C) Minimal Unavoidable Rent Module Changes

### Files with Hardcoded Route Strings (8 changes total)

These navigate users back to rent list after actions. Must update to `/contracts/rent` instead of `/contracts`.

| # | File | Line | Before | After |
|---|------|------|--------|-------|
| 1 | `ContractEdit.tsx` | 53 | `navigate('/contracts')` | `navigate('/contracts/rent')` |
| 2 | `ContractEdit.tsx` | 72 | `navigate('/contracts')` | `navigate('/contracts/rent')` |
| 3 | `ContractEditForm.tsx` | 115 | `navigate('/contracts')` | `navigate('/contracts/rent')` |
| 4 | `ContractEditForm.tsx` | 163 | `navigate('/contracts')` | `navigate('/contracts/rent')` |
| 5 | `ContractCreateForm.tsx` | 126 | `navigate('/contracts')` | `navigate('/contracts/rent')` |
| 6 | `ContractCreateForm.tsx` | 184 | `navigate('/contracts')` | `navigate('/contracts/rent')` |
| 7 | `useContractsActions.ts` | 87 | `'/contracts/create'` | `'/contracts/rent/create'` |
| 8 | `useContractsActions.ts` | 91 | `` `/contracts/${contract.id}/edit` `` | `` `/contracts/rent/${contract.id}/edit` `` |

### Files Using ROUTES Constants (No changes needed)

These auto-resolve via legacy aliases:

- `Contracts.tsx:278` - `ROUTES.CONTRACT_CREATE` ✓
- `Contracts.tsx:284` - `ROUTES.CONTRACT_IMPORT` ✓
- `import/components/SuccessStep.tsx:158` - `ROUTES.CONTRACTS` ✓

---

## D) ContractsHub UX Plan

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Sözleşmeler / Contracts                    [+ Yeni / New]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  📄 Kira        │  │  🏠 Satış       │                   │
│  │  Sözleşmeleri   │  │  Sözleşmeleri   │                   │
│  │                 │  │                 │                   │
│  │  12 aktif       │  │  5 taslak       │                   │
│  │                 │  │                 │                   │
│  │  [Görüntüle]    │  │  [Görüntüle]    │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  💰 Komisyon    │  │  👁 Gösterim    │                   │
│  │  Sözleşmeleri   │  │  Tutanakları    │                   │
│  │                 │  │                 │                   │
│  │  Yakında...     │  │  Yakında...     │                   │
│  │                 │  │                 │                   │
│  │  [Disabled]     │  │  [Disabled]     │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### i18n Keys

**public/locales/tr/contractsHub.json:**
```json
{
  "title": "Sözleşmeler",
  "subtitle": "Tüm sözleşme türlerini buradan yönetin",
  "cards": {
    "rent": {
      "title": "Kira Sözleşmeleri",
      "description": "Kiralık mülkler için sözleşme oluşturun ve yönetin",
      "badge": "{{count}} aktif"
    },
    "sale": {
      "title": "Satış Sözleşmeleri",
      "description": "Gayrimenkul satış sözleşmeleri oluşturun",
      "badge": "{{count}} taslak"
    },
    "commission": {
      "title": "Komisyon Sözleşmeleri",
      "description": "Emlak komisyon anlaşmaları",
      "badge": "Yakında"
    },
    "showing": {
      "title": "Gösterim Tutanakları",
      "description": "Mülk gösterim kayıtları",
      "badge": "Yakında"
    }
  },
  "actions": {
    "view": "Görüntüle",
    "create": "Oluştur",
    "comingSoon": "Yakında"
  }
}
```

**public/locales/en/contractsHub.json:**
```json
{
  "title": "Contracts",
  "subtitle": "Manage all contract types from here",
  "cards": {
    "rent": {
      "title": "Rent Contracts",
      "description": "Create and manage rental property contracts",
      "badge": "{{count}} active"
    },
    "sale": {
      "title": "Sales Contracts",
      "description": "Create real estate sales contracts",
      "badge": "{{count}} drafts"
    },
    "commission": {
      "title": "Commission Contracts",
      "description": "Real estate commission agreements",
      "badge": "Coming Soon"
    },
    "showing": {
      "title": "Showing Records",
      "description": "Property showing records",
      "badge": "Coming Soon"
    }
  },
  "actions": {
    "view": "View",
    "create": "Create",
    "comingSoon": "Coming Soon"
  }
}
```

### Navigation Update

**public/locales/tr/navigation.json** (line 6):
```json
"contracts": "Sözleşmeler"
```

**public/locales/en/navigation.json** (line 6):
```json
"contracts": "Contracts"
```

---

## E) Sales Module UX Plan

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/contracts/sale` | `SaleContractsList` | List all sale contracts |
| `/contracts/sale/create` | `SaleContractBuilder` | 3-step wizard |
| `/contracts/sale/:id/edit` | `SaleContractEdit` | Edit existing |

### SaleContractsList

- Table/card view of sale contract instances
- Columns: Title, Buyer, Seller, Property, Status, Created At, Actions
- Filters: status (draft/final/signed/archived)
- Actions: Edit, Delete, Download (future)

### SaleContractBuilder (3-Step Wizard)

**Step 1: Form Fields**
```
┌─────────────────────────────────────────────────────────────┐
│  Satış Sözleşmesi Oluştur                   Step 1 of 3    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SATICI BİLGİLERİ                                           │
│  ├─ Ad Soyad *                                              │
│  ├─ TC Kimlik No *                                          │
│  ├─ Telefon *                                               │
│  ├─ E-posta                                                 │
│  └─ Adres *                                                 │
│                                                             │
│  ALICI BİLGİLERİ                                            │
│  ├─ Ad Soyad *                                              │
│  ├─ TC Kimlik No *                                          │
│  ├─ Telefon *                                               │
│  ├─ E-posta                                                 │
│  └─ Adres *                                                 │
│                                                             │
│  TAŞINMAZ BİLGİLERİ                                         │
│  ├─ Adres *                                                 │
│  ├─ Tapu No                                                 │
│  ├─ Ada/Parsel                                              │
│  └─ Metrekare                                               │
│                                                             │
│  SATIŞ ŞARTLARI                                             │
│  ├─ Satış Bedeli *                                          │
│  ├─ Para Birimi *                                           │
│  ├─ Ödeme Yöntemi *                                         │
│  ├─ Kapora Tutarı                                           │
│  └─ Tapu Devir Tarihi                                       │
│                                                             │
│                            [İptal]  [Sonraki: Sözleşme →]   │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Contract Editor**
```
┌─────────────────────────────────────────────────────────────┐
│  Satış Sözleşmesi Oluştur                   Step 2 of 3    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sözleşme metnini düzenleyebilirsiniz:                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  SATIŞ SÖZLEŞMESİ                                   │    │
│  │                                                     │    │
│  │  Bir tarafta Ahmet Yılmaz (Satıcı),                 │    │
│  │  Diğer tarafta Mehmet Demir (Alıcı)                 │    │
│  │  arasında aşağıdaki şartlarla...                    │    │
│  │                                                     │    │
│  │  [Textarea - editable]                              │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                     [← Geri]  [Sonraki: Önizleme →]         │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Preview & Save**
```
┌─────────────────────────────────────────────────────────────┐
│  Satış Sözleşmesi Oluştur                   Step 3 of 3    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Sözleşme önizlemesi                                      │
│                                                             │
│  Başlık: Kadıköy Daire Satış Sözleşmesi                     │
│  Satıcı: Ahmet Yılmaz                                       │
│  Alıcı: Mehmet Demir                                        │
│  Tutar: 5.000.000 TL                                        │
│  Durum: Taslak                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Contract preview - read only]                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              [← Geri]  [Taslak Kaydet]  [Kesinleştir]       │
└─────────────────────────────────────────────────────────────┘
```

### Form Schema (Zod)

```typescript
export const saleContractFormSchema = z.object({
  // Seller
  seller_name: z.string().min(2).max(100),
  seller_tc: z.string().length(11).regex(/^\d+$/).refine(isValidTC),
  seller_phone: z.string().min(10).refine(isValidPhone),
  seller_email: z.string().email().optional().or(z.literal('')),
  seller_address: z.string().min(10),

  // Buyer
  buyer_name: z.string().min(2).max(100),
  buyer_tc: z.string().length(11).regex(/^\d+$/).refine(isValidTC),
  buyer_phone: z.string().min(10).refine(isValidPhone),
  buyer_email: z.string().email().optional().or(z.literal('')),
  buyer_address: z.string().min(10),

  // Property
  property_address: z.string().min(10),
  title_deed_no: z.string().optional(),
  parcel_info: z.string().optional(),
  square_meters: z.number().min(1).optional(),

  // Sale Terms
  sale_price: z.number().min(1),
  currency: z.enum(['TRY', 'USD', 'EUR']).default('TRY'),
  payment_method: z.enum(['cash', 'bank_transfer', 'installment', 'mortgage']),
  deposit_amount: z.number().min(0).optional(),
  closing_date: z.date().optional(),

  // Contract
  title: z.string().min(2).max(200).optional(),
  special_conditions: z.string().max(2000).optional(),
});

export type SaleContractFormData = z.infer<typeof saleContractFormSchema>;
```

---

## F) v2 Database Migration Draft

**File**: `supabase/migrations/20251226000000_contract_builder_v2.sql`

```sql
-- ============================================================================
-- Contract Builder System v2
-- For: Sale, Commission, Showing contracts (NOT rent - uses existing tables)
-- Created: 2024-12-26
-- ============================================================================

-- ============================================================================
-- 1. contract_templates_v2
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_templates_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('sale', 'commission', 'showing')),
  name TEXT NOT NULL,
  content TEXT NOT NULL,

  version INTEGER NOT NULL DEFAULT 1,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_templates_v2_user_id ON contract_templates_v2(user_id);
CREATE INDEX idx_templates_v2_user_type ON contract_templates_v2(user_id, type);
CREATE INDEX idx_templates_v2_default ON contract_templates_v2(user_id, type, is_default)
  WHERE is_default = true;

-- RLS
ALTER TABLE contract_templates_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_v2_select" ON contract_templates_v2;
CREATE POLICY "templates_v2_select" ON contract_templates_v2
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "templates_v2_insert" ON contract_templates_v2;
CREATE POLICY "templates_v2_insert" ON contract_templates_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "templates_v2_update" ON contract_templates_v2;
CREATE POLICY "templates_v2_update" ON contract_templates_v2
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "templates_v2_delete" ON contract_templates_v2;
CREATE POLICY "templates_v2_delete" ON contract_templates_v2
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. contract_instances_v2
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contract_instances_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('sale', 'commission', 'showing')),
  template_id UUID REFERENCES contract_templates_v2(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  parties JSONB DEFAULT '{}',
  form_data JSONB NOT NULL DEFAULT '{}',
  rendered_content TEXT,

  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'final', 'signed', 'archived', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_instances_v2_user_id ON contract_instances_v2(user_id);
CREATE INDEX idx_instances_v2_user_type ON contract_instances_v2(user_id, type);
CREATE INDEX idx_instances_v2_user_status ON contract_instances_v2(user_id, status);
CREATE INDEX idx_instances_v2_property ON contract_instances_v2(property_id)
  WHERE property_id IS NOT NULL;
CREATE INDEX idx_instances_v2_created ON contract_instances_v2(user_id, created_at DESC);
CREATE INDEX idx_instances_v2_form_data ON contract_instances_v2 USING GIN (form_data);

-- RLS
ALTER TABLE contract_instances_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instances_v2_select" ON contract_instances_v2;
CREATE POLICY "instances_v2_select" ON contract_instances_v2
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "instances_v2_insert" ON contract_instances_v2;
CREATE POLICY "instances_v2_insert" ON contract_instances_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "instances_v2_update" ON contract_instances_v2;
CREATE POLICY "instances_v2_update" ON contract_instances_v2
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "instances_v2_delete" ON contract_instances_v2;
CREATE POLICY "instances_v2_delete" ON contract_instances_v2
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Triggers (updated_at auto-update)
-- ============================================================================

-- Note: Assumes update_updated_at_column() function exists from previous migrations.
-- If not, uncomment below:
--
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_templates_v2_updated_at ON contract_templates_v2;
CREATE TRIGGER update_templates_v2_updated_at
  BEFORE UPDATE ON contract_templates_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_instances_v2_updated_at ON contract_instances_v2;
CREATE TRIGGER update_instances_v2_updated_at
  BEFORE UPDATE ON contract_instances_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

---

## G) Frontend Plumbing Plan

### Folder Structure

```
src/
├── features/
│   ├── contracts/                        # EXISTING (minimal touch)
│   │
│   ├── contractsHub/                     # NEW
│   │   ├── ContractsHub.tsx
│   │   └── components/
│   │       └── ContractTypeCard.tsx
│   │
│   └── contractsSale/                    # NEW
│       ├── SaleContractsList.tsx
│       ├── SaleContractBuilder.tsx
│       ├── SaleContractEdit.tsx
│       ├── components/
│       │   ├── SaleContractForm.tsx
│       │   ├── SaleContractEditor.tsx
│       │   ├── SaleContractPreview.tsx
│       │   └── form-sections/
│       │       ├── SellerFormSection.tsx
│       │       ├── BuyerFormSection.tsx
│       │       ├── PropertySaleSection.tsx
│       │       └── PaymentTermsSection.tsx
│       ├── hooks/
│       │   ├── useSaleContractsList.ts
│       │   └── useSaleContractBuilder.ts
│       └── schemas/
│           └── saleContractForm.schema.ts
│
├── services/
│   └── contractBuilder.service.ts        # NEW
│
├── templates/
│   ├── contractContent.ts                # EXISTING
│   └── salesContractContent.ts           # NEW
│
└── types/
    └── contractBuilder.types.ts          # NEW
```

### Types (src/types/contractBuilder.types.ts)

```typescript
export type ContractTypeV2 = 'sale' | 'commission' | 'showing';
export type ContractStatusV2 = 'draft' | 'final' | 'signed' | 'archived' | 'cancelled';

export interface ContractTemplateV2 {
  id: string;
  user_id: string;
  type: ContractTypeV2;
  name: string;
  content: string;
  version: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractInstanceV2 {
  id: string;
  user_id: string;
  type: ContractTypeV2;
  template_id: string | null;
  property_id: string | null;
  parties: Record<string, unknown>;
  form_data: Record<string, unknown>;
  rendered_content: string | null;
  title: string | null;
  status: ContractStatusV2;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  created_by: string | null;
}

export interface ContractTemplateV2Insert {
  type: ContractTypeV2;
  name: string;
  content: string;
  version?: number;
  is_default?: boolean;
  is_active?: boolean;
}

export interface ContractInstanceV2Insert {
  type: ContractTypeV2;
  template_id?: string;
  property_id?: string;
  parties?: Record<string, unknown>;
  form_data: Record<string, unknown>;
  rendered_content?: string;
  title?: string;
  status?: ContractStatusV2;
}

export interface ContractInstanceV2Update {
  template_id?: string | null;
  property_id?: string | null;
  parties?: Record<string, unknown>;
  form_data?: Record<string, unknown>;
  rendered_content?: string | null;
  title?: string | null;
  status?: ContractStatusV2;
  signed_at?: string | null;
}
```

### Service Methods (src/services/contractBuilder.service.ts)

```typescript
// Templates
getTemplates(type: ContractTypeV2): Promise<ContractTemplateV2[]>
getDefaultTemplate(type: ContractTypeV2): Promise<ContractTemplateV2 | null>
seedDefaultTemplateIfMissing(type: ContractTypeV2): Promise<void>

// Instances
listInstances(type: ContractTypeV2, filters?: { status?: string }): Promise<ContractInstanceV2[]>
getInstance(id: string): Promise<ContractInstanceV2 | null>
createInstance(payload: ContractInstanceV2Insert): Promise<ContractInstanceV2>
updateInstance(id: string, payload: ContractInstanceV2Update): Promise<ContractInstanceV2>
deleteInstance(id: string): Promise<void>

// Stats
getInstanceCounts(): Promise<Record<ContractTypeV2, number>>
```

### Sales Template (src/templates/salesContractContent.ts)

```typescript
/**
 * Sales Contract Template Content
 * Source: Manually extracted from satis.sozlesmesi.pdf
 * Placeholders use {{variable}} syntax
 */

export const SALE_CONTRACT_TEMPLATE_NAME = 'Standart Satış Sözleşmesi';

export const SALE_CONTRACT_TEMPLATE_CONTENT = `
SATIŞ SÖZLEŞMESİ

Bir tarafta {{seller_name}} (TC: {{seller_tc}}) (bundan sonra "SATICI" olarak anılacaktır),
Adres: {{seller_address}}
Telefon: {{seller_phone}}

Diğer tarafta {{buyer_name}} (TC: {{buyer_tc}}) (bundan sonra "ALICI" olarak anılacaktır),
Adres: {{buyer_address}}
Telefon: {{buyer_phone}}

arasında aşağıdaki şartlar dahilinde işbu satış sözleşmesi akdedilmiştir.

MADDE 1 - SÖZLEŞMENİN KONUSU

İşbu sözleşmenin konusu, {{property_address}} adresinde bulunan, {{square_meters}} m² büyüklüğündeki gayrimenkulün satışıdır.

Tapu Bilgileri: {{title_deed_no}}
Ada/Parsel: {{parcel_info}}

MADDE 2 - SATIŞ BEDELİ VE ÖDEME ŞARTLARI

Satış bedeli: {{sale_price}} {{currency}}
Ödeme yöntemi: {{payment_method}}
Kapora tutarı: {{deposit_amount}} {{currency}}
Tapu devir tarihi: {{closing_date}}

MADDE 3 - TARAFLARIN YÜKÜMLÜLÜKLERİ

3.1 SATICI, satışa konu gayrimenkulün kendisine ait olduğunu, üzerinde herhangi bir takyidat bulunmadığını beyan ve taahhüt eder.

3.2 SATICI, gayrimenkulü belirtilen tarihte ALICI'ya devretmeyi kabul ve taahhüt eder.

3.3 ALICI, satış bedelini belirtilen şekilde ödemeyi kabul ve taahhüt eder.

MADDE 4 - DİĞER HÜKÜMLER

{{special_conditions}}

MADDE 5 - UYUŞMAZLIK

İşbu sözleşmeden doğabilecek uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.

İşbu sözleşme {{contract_date}} tarihinde iki nüsha olarak düzenlenmiş ve taraflarca imza altına alınmıştır.

SATICI                                    ALICI
{{seller_name}}                           {{buyer_name}}
İmza:                                     İmza:
`;

export const SALE_CONTRACT_PLACEHOLDERS = [
  'seller_name',
  'seller_tc',
  'seller_address',
  'seller_phone',
  'buyer_name',
  'buyer_tc',
  'buyer_address',
  'buyer_phone',
  'property_address',
  'square_meters',
  'title_deed_no',
  'parcel_info',
  'sale_price',
  'currency',
  'payment_method',
  'deposit_amount',
  'closing_date',
  'special_conditions',
  'contract_date',
] as const;
```

---

## H) Step-by-Step Execution Plan

| Step | Task | Files | Time |
|------|------|-------|------|
| **1** | Update route constants | `src/config/constants.ts` | 15 min |
| **2** | Update App.tsx (routes + redirects) | `src/App.tsx` | 20 min |
| **3** | Fix 8 hardcoded rent paths | 4 files in `src/features/contracts/` | 15 min |
| **4** | Update i18n (navigation + contractsHub) | `public/locales/{tr,en}/*.json` | 15 min |
| **5** | Create v2 types | `src/types/contractBuilder.types.ts` | 15 min |
| **6** | Run v2 migration | `supabase/migrations/20251226000000_contract_builder_v2.sql` | 10 min |
| **7** | Regenerate Supabase types | `npx supabase gen types typescript` | 5 min |
| **8** | Create contractBuilder.service.ts | `src/services/contractBuilder.service.ts` | 45 min |
| **9** | Create salesContractContent.ts | `src/templates/salesContractContent.ts` | 20 min |
| **10** | Create ContractsHub UI | `src/features/contractsHub/*` | 1 hour |
| **11** | Create SaleContractsList | `src/features/contractsSale/SaleContractsList.tsx` | 45 min |
| **12** | Create SaleContractBuilder + Edit | `src/features/contractsSale/*` | 2 hours |

**Total**: ~7-8 hours

---

## I) Test Checklist

### Routing Tests (After Step 4)

- [ ] `/contracts` shows ContractsHub page
- [ ] `/contracts/rent` shows existing rent contracts list
- [ ] `/contracts/rent/create` shows rent create form
- [ ] `/contracts/rent/:id/edit` shows rent edit form
- [ ] `/contracts/rent/import` shows rent import page
- [ ] Redirect: `/contracts/create` → `/contracts/rent/create`
- [ ] Redirect: `/contracts/import` → `/contracts/rent/import`
- [ ] Redirect: `/contracts/:id/edit` → `/contracts/rent/:id/edit`
- [ ] Sidebar "Sözleşmeler" links to `/contracts` (Hub)

### Rent Flow Tests (After Step 4)

- [ ] Create new rent contract → returns to `/contracts/rent`
- [ ] Edit rent contract → returns to `/contracts/rent`
- [ ] Cancel from create form → returns to `/contracts/rent`
- [ ] Cancel from edit form → returns to `/contracts/rent`
- [ ] Import success → returns to `/contracts/rent`
- [ ] All existing rent functionality unchanged

### Database Tests (After Step 7)

- [ ] `contract_templates_v2` table exists
- [ ] `contract_instances_v2` table exists
- [ ] RLS policies work (user can only see own data)
- [ ] Indexes created
- [ ] Triggers working (updated_at auto-updates)

### Hub Tests (After Step 10)

- [ ] Hub page loads
- [ ] Rent card shows count and links to `/contracts/rent`
- [ ] Sale card shows count and links to `/contracts/sale`
- [ ] Commission/Showing cards show "Coming Soon"
- [ ] i18n works (TR/EN)

### Sale Module Tests (After Step 12)

- [ ] `/contracts/sale` shows sale contracts list
- [ ] `/contracts/sale/create` opens 3-step wizard
- [ ] Step 1: Form validation works
- [ ] Step 2: Template loads and {{placeholders}} are replaced
- [ ] Step 3: Can save as draft
- [ ] Step 3: Can save as final
- [ ] Saved contract appears in list
- [ ] Can edit existing sale contract
- [ ] Can delete sale contract
- [ ] Status badge shows correctly

### Integration Tests

- [ ] App builds without errors
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Supabase types regenerated successfully

---

## Appendix: File Change Summary

### New Files (18)

```
docs/contracts-hub-and-sale-v2.md
supabase/migrations/20251226000000_contract_builder_v2.sql
src/types/contractBuilder.types.ts
src/services/contractBuilder.service.ts
src/templates/salesContractContent.ts
src/features/contractsHub/ContractsHub.tsx
src/features/contractsHub/components/ContractTypeCard.tsx
src/features/contractsSale/SaleContractsList.tsx
src/features/contractsSale/SaleContractBuilder.tsx
src/features/contractsSale/SaleContractEdit.tsx
src/features/contractsSale/components/SaleContractForm.tsx
src/features/contractsSale/components/SaleContractEditor.tsx
src/features/contractsSale/components/SaleContractPreview.tsx
src/features/contractsSale/components/form-sections/SellerFormSection.tsx
src/features/contractsSale/components/form-sections/BuyerFormSection.tsx
src/features/contractsSale/components/form-sections/PropertySaleSection.tsx
src/features/contractsSale/components/form-sections/PaymentTermsSection.tsx
src/features/contractsSale/schemas/saleContractForm.schema.ts
public/locales/tr/contractsHub.json
public/locales/en/contractsHub.json
```

### Modified Files (7)

```
src/config/constants.ts                           (+15 lines)
src/App.tsx                                       (+30 lines)
public/locales/tr/navigation.json                 (1 line change)
public/locales/en/navigation.json                 (1 line change)
src/features/contracts/ContractEdit.tsx           (2 line changes)
src/features/contracts/components/ContractEditForm.tsx    (2 line changes)
src/features/contracts/components/ContractCreateForm.tsx  (2 line changes)
src/features/contracts/hooks/useContractsActions.ts       (2 line changes)
```

---

*End of Implementation Plan*
