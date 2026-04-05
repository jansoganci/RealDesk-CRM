# ADR-002: Contract Engine v2 Architecture and Rent Contracts Isolation

**Status:** Accepted
**Date:** 2024-12-24
**Decision Makers:** Engineering Team
**Scope:** Contract Management System

---

## 1. Decision Summary

We adopt a **Generic Contract Engine v2** architecture for all non-rent contract types (sale, commission, showing, and any future types).

This engine is built on:
- The existing `contract_instances_v2` table with JSONB-based flexible payloads
- A single shared PDF generation service with type-discriminated templates
- Type-specific Zod validation schemas
- Separate UI modules per contract type

**The existing Rent Contracts module is permanently isolated and will never be modified, abstracted, or integrated into this engine.**

---

## 2. Context

### Current State

The application has a fully functional **Rent Contracts module** that includes:
- Dedicated database table (`contracts`) with explicit typed columns
- Custom PDF generation pipeline (`contractPdf.service.ts`, `useContractPdfHandler.ts`)
- Storage integration for PDF upload/download
- Complete UI with list, create, edit, and import flows
- Established user workflows and data

### Problem Statement

We are now building **Sale Contracts** functionality and must decide how to architect:
- PDF generation and storage
- Database schema for contract data
- Service layer for CRUD and PDF operations
- Extensibility for future contract types (commission, showing, etc.)

### Constraints

| Constraint | Rationale |
|------------|-----------|
| Rent Contracts must not be modified | Production stability; established user data; no regression risk |
| Future contract fields are unknown | Business requirements evolve; we cannot predict all fields |
| Avoid per-type PDF pipelines | Reduces code duplication and maintenance burden |
| Avoid per-type database migrations | Reduces deployment friction and schema complexity |

---

## 3. Non-Goals

The following are explicitly **out of scope** and **prohibited**:

| Non-Goal | Reason |
|----------|--------|
| Refactoring Rent Contracts | Violates isolation constraint; introduces regression risk |
| Abstracting shared logic from Rent | Creates coupling; Rent is frozen |
| Migrating Rent data to v2 tables | Unnecessary; Rent works as-is |
| Reusing Rent PDF templates | Different legal requirements; different data shape |
| Creating a "universal" contract table for all types | Rent isolation is non-negotiable |
| Modifying `contracts` table schema | Frozen; any changes are forbidden |
| Importing Rent services into v2 code | No cross-module dependencies allowed |

**Any future proposal that suggests "unifying" or "consolidating" Rent Contracts with the v2 engine must be rejected.**

---

## 4. Architecture Overview

### 4.1 Database Layer

```
┌────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  contracts (LEGACY - FROZEN)                                   │
│  └── Rent contracts only                                       │
│  └── Explicit typed columns                                    │
│  └── contract_pdf_path: TEXT                                   │
│  └── DO NOT MODIFY                                             │
│                                                                │
│  contract_instances_v2 (GENERIC ENGINE)                        │
│  └── type: 'sale' | 'commission' | 'showing' | ...            │
│  └── form_data: JSONB (flexible payload per type)             │
│  └── rendered_content: TEXT                                    │
│  └── pdf_path: TEXT (to be added)                             │
│  └── parties: JSONB                                            │
│  └── status, timestamps                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- `form_data` is JSONB to accommodate unknown future fields without migrations
- `type` field acts as discriminator for validation and template selection
- `pdf_path` stores reference to generated PDF in Supabase Storage
- GIN indexes on JSONB fields for query performance

### 4.2 PDF Engine Layer

```
┌────────────────────────────────────────────────────────────────┐
│                    PDF ENGINE V2                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  contractPdfEngine.service.ts                                  │
│  ├── generatePdf(type, formData, instanceId) → Blob           │
│  ├── uploadPdf(blob, instanceId) → storagePath                │
│  ├── downloadPdf(storagePath) → signedUrl                     │
│  └── deletePdf(storagePath) → void                            │
│                                                                │
│  templates/                                                    │
│  ├── sale.template.ts                                          │
│  ├── commission.template.ts (future)                          │
│  └── showing.template.ts (future)                             │
│                                                                │
│  Template interface:                                           │
│  └── (formData: Record<string, unknown>) → string (HTML/Text) │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- Single PDF service handles all v2 contract types
- Templates are pure functions that accept form data and return content
- PDF generation logic (blob creation, storage) is shared
- Type discriminator selects the appropriate template at runtime

### 4.3 Validation Layer

```
┌────────────────────────────────────────────────────────────────┐
│                   VALIDATION SCHEMAS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  schemas/                                                      │
│  ├── saleContract.schema.ts (Zod)                             │
│  ├── commissionContract.schema.ts (Zod) (future)              │
│  └── showingRecord.schema.ts (Zod) (future)                   │
│                                                                │
│  Each schema:                                                  │
│  └── Validates form_data for that specific type               │
│  └── Provides TypeScript types via z.infer<>                  │
│  └── Enforces required fields at runtime                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- Runtime validation via Zod compensates for JSONB flexibility
- Each contract type has its own schema (no shared base schema)
- Schemas are the source of truth for what fields each type requires

### 4.4 UI Layer

```
┌────────────────────────────────────────────────────────────────┐
│                      UI STRUCTURE                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  features/                                                     │
│  ├── contracts/ (RENT - FROZEN)                               │
│  │   └── DO NOT MODIFY                                        │
│  │                                                             │
│  ├── contractsHub/                                             │
│  │   └── Navigation hub for all contract types                │
│  │                                                             │
│  ├── contractsSale/                                            │
│  │   ├── SaleContractsList.tsx                                │
│  │   ├── SaleContractBuilder.tsx                              │
│  │   ├── SaleContractEdit.tsx                                 │
│  │   └── hooks/useSaleContractPdf.ts                          │
│  │                                                             │
│  ├── contractsCommission/ (future)                            │
│  └── contractsShowing/ (future)                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- Each contract type has its own UI folder
- UI folders may share the PDF engine service but not UI components
- `contractsHub` provides unified navigation
- Rent UI is in `features/contracts/` and is frozen

---

## 5. Current State vs. Implementation Roadmap

### What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| `contract_instances_v2` table | Implemented | `supabase/migrations/20251226000000_contract_builder_v2.sql` |
| `ContractInstanceV2` types | Implemented | `src/types/contractBuilder.types.ts` |
| `contractBuilderService` | Implemented | `src/services/contractBuilder.service.ts` |
| Sale Contracts UI (list, create, edit) | Implemented | `src/features/contractsSale/` |
| Sale form schema (Zod) | Implemented | `src/features/contractsSale/schemas/` |
| Sale text template | Implemented | `src/templates/salesContractContent.ts` |
| Contracts Hub | Implemented | `src/features/contractsHub/` |

### What Must Be Implemented

| Component | Priority | Description |
|-----------|----------|-------------|
| Add `pdf_path` column | High | ALTER TABLE to add PDF storage reference |
| `contractPdfEngine.service.ts` | High | Shared PDF generation/upload/download service |
| Sale PDF template | High | HTML/formatted template for sale contract PDF |
| `useSaleContractPdf.ts` hook | High | UI hook for PDF actions in sale module |
| PDF action buttons in Sale UI | High | Download/regenerate buttons in list and detail views |
| Auto-download on create | Medium | Trigger PDF download after successful contract creation |

---

## 6. Consequences

### Positive Consequences

| Benefit | Description |
|---------|-------------|
| **Extensibility** | Adding new contract types requires only: schema + template + UI folder |
| **No migrations for new fields** | JSONB payload absorbs any field additions |
| **Single PDF pipeline** | One service to maintain, test, and optimize |
| **Clear separation** | Rent is isolated; v2 types are grouped logically |
| **Type safety** | Zod schemas provide runtime validation and TypeScript types |

### Accepted Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| JSONB queries are slower than typed columns | GIN indexes; acceptable for contract volumes |
| Runtime validation instead of compile-time | Zod provides strong guarantees; test coverage |
| Two separate systems (Rent vs v2) | Intentional; reduces risk; clear boundaries |
| Template duplication across types | Templates are small; business requirements differ |

### Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Future developer tries to "unify" systems | Medium | This ADR; code review gates; clear folder structure |
| JSONB schema drift over time | Low | Zod schemas are source of truth; validation on read |
| PDF generation performance | Low | Async generation; background jobs if needed |

---

## 7. Architectural Boundaries

The following boundaries are **permanent** and **non-negotiable**:

### Boundary 1: Rent Contracts Isolation

```
src/features/contracts/     ←  FROZEN. No changes. No imports from v2.
src/services/contracts.service.ts  ←  FROZEN. Rent-only.
src/services/contractPdf.service.ts  ←  FROZEN. Rent-only.
```

Code in `features/contracts/` must **never** import from:
- `features/contractsSale/`
- `features/contractsCommission/`
- `features/contractsShowing/`
- `services/contractPdfEngine.service.ts`

Code in v2 modules must **never** import from:
- `features/contracts/`
- `services/contracts.service.ts`
- `services/contractPdf.service.ts`

### Boundary 2: Engine Ownership

The v2 engine (`contractPdfEngine.service.ts`) is shared **only** among v2 contract types. It has no knowledge of Rent Contracts.

### Boundary 3: Database Tables

| Table | Owner | Modification Policy |
|-------|-------|---------------------|
| `contracts` | Rent module | FROZEN - no changes ever |
| `contract_instances_v2` | v2 Engine | May be extended; no breaking changes |
| `contract_templates_v2` | v2 Engine | May be extended |

---

## 8. Decision Record

This decision was made based on:
1. Analysis of existing Rent Contracts architecture
2. Evaluation of Generic Engine vs. Separate Modules approaches
3. Requirement for future extensibility without migrations
4. Requirement to avoid code duplication in PDF pipelines
5. Non-negotiable constraint of Rent Contracts isolation

**This ADR is final and should be referenced in code reviews when architectural drift is detected.**

---

## 9. References

| Document | Purpose |
|----------|---------|
| `docs/contracts-hub-and-sale-v2.md` | Implementation details for Sale Contracts |
| `supabase/migrations/20251226000000_contract_builder_v2.sql` | v2 database schema |
| `src/types/contractBuilder.types.ts` | v2 TypeScript types |

---

## Appendix: Adding a New Contract Type

When adding a new contract type (e.g., "commission"), follow these steps exactly:

1. **Add type to union** in `src/types/contractBuilder.types.ts`:
   ```
   type ContractType = 'sale' | 'commission' | ...
   ```

2. **Create Zod schema** at `src/features/contractsCommission/schemas/commissionContract.schema.ts`

3. **Create PDF template** at `src/templates/commissionContractContent.ts`

4. **Create UI folder** at `src/features/contractsCommission/` with list, create, edit pages

5. **Add route constants** to `src/config/constants.ts`

6. **Add routes** to `src/App.tsx`

7. **Add card** to `src/features/contractsHub/ContractsHub.tsx`

**No database migration is required. No changes to Rent Contracts. No changes to existing v2 types.**

---

*End of ADR-002*
