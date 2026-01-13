# Organization-Specific Default Contract Clauses - Feature Proposal

> **Status**: DEFERRED - Pending customer validation
> **Date**: 2026-01-12
> **Priority**: Low (implement only if customers request)

---

## Executive Summary

This document outlines a proposed feature to allow organizations to set their own default contract clauses (Genel Sartlar, Ozel Sartlar, Tahliye Taahhutnamesi) that pre-fill when any user in the organization creates a new rental contract.

**CRITICAL CONSTRAINT**: This feature ONLY affects NEW contracts during creation. Existing contracts are IMMUTABLE and cannot be changed retroactively.

---

## Current State

### How Clauses Work Today

```
User creates contract
       │
       ▼
EditableClausesSection loads
       │
       ▼
clausesService.getMergedClauses()
       │
       ├── Check: Does user have templates in DB?
       │         │
       │         ├── NO → Seed 33 clauses from HARDCODED contractContent.ts
       │         │
       │         └── YES → Use existing user templates
       │
       └── User can edit clauses in form before saving
              │
              ▼
       Contract saved (clauses become IMMUTABLE)
```

### Current Tables

| Table | Scope | Purpose |
|-------|-------|---------|
| `contract_clause_templates` | Per-user | Default templates (seeded from hardcoded arrays) |
| `contract_clause_overrides` | Per-contract | Custom clauses saved with specific contract |

### Hardcoded Source

File: `src/templates/contractContent.ts`
- `GENEL_SARTLAR`: 13 clauses (general conditions)
- `OZEL_SARTLAR`: 19 clauses (special conditions)
- `TAHLIYE_TAAHHUTNAMESI_TEXT`: 1 clause (eviction commitment)

---

## Proposed Feature

### What It Does

1. **Org owners can set default clauses** at organization level
2. **New contracts pre-fill** with org defaults instead of hardcoded arrays
3. **Users can still edit** during contract creation (existing EditableClausesSection)
4. **Existing contracts unchanged** - This is pre-fill only, not retroactive

### What It Does NOT Do

- Does NOT modify existing contracts
- Does NOT remove user's ability to customize per-contract
- Does NOT change how contract_clause_overrides work
- Does NOT affect PDF generation of existing contracts

---

## Proposed Data Model

### Option A: Use existing `organizations.settings` JSONB

```sql
-- Column already exists
UPDATE organizations
SET settings = jsonb_set(settings, '{default_clauses}', '[...]')
WHERE id = 'org-uuid';
```

**Pros**: No schema change
**Cons**: ~66KB of clause data in JSONB, weaker type safety

### Option B: New `organization_settings` table (RECOMMENDED)

```sql
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  default_clauses JSONB DEFAULT '[]',
  -- Future fields:
  -- default_currency TEXT DEFAULT 'TRY',
  -- default_payment_day INTEGER DEFAULT 1,
  -- pdf_letterhead_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Pros**: Dedicated table, better scaling, cleaner separation
**Cons**: Requires new migration + RLS policies

---

## Implementation Scope

### Files to Create (4)

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_org_settings.sql` | New table + RLS |
| `src/services/orgSettings.service.ts` | CRUD for org settings |
| `src/features/organization/OrgClauseSettings.tsx` | Admin UI for editing defaults |
| `src/features/organization/components/OrgClauseEditor.tsx` | Reusable clause editor |

### Files to Modify (14)

| File | Change |
|------|--------|
| `src/services/clauses.service.ts` | Add org defaults fallback |
| `src/services/organization.service.ts` | Add settings methods |
| `src/features/contracts/components/EditableClausesSection.tsx` | Use new fallback chain |
| `src/features/profile/components/OrganizationSettingsCard.tsx` | Add link to clause settings |
| `src/App.tsx` | Add route |
| `src/config/constants.ts` | Add route constant |
| `src/types/org.ts` | Add OrgSettings interface |
| `src/contexts/OrgContext.tsx` | Optionally expose settings |
| `src/lib/orgHelpers.ts` | Add getOrgSettings helper |
| `src/services/contractPdf.service.ts` | Ensure fallback works |
| `public/locales/tr/profile.json` | Translations |
| `public/locales/en/profile.json` | Translations |
| `public/locales/tr/contracts.json` | Translations |
| `public/locales/en/contracts.json` | Translations |

### Files to Deprecate (Mark as fallback only)

| File | Current Use | New Role |
|------|-------------|----------|
| `src/templates/contractContent.ts` | Primary source of clauses | System fallback when org has no defaults |

---

## Fallback Chain (After Implementation)

```
New Contract Creation
       │
       ▼
Check: Does org have default_clauses in organization_settings?
       │
       ├── YES → Use org defaults as pre-fill
       │
       └── NO → Check: Does user have templates?
                      │
                      ├── YES → Use user templates
                      │
                      └── NO → Use hardcoded contractContent.ts
       │
       ▼
User can edit in EditableClausesSection
       │
       ▼
Contract saved with final clauses (IMMUTABLE)
```

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Existing contracts affected | **NONE** | Feature only affects new contracts |
| RLS misconfiguration | Medium | Mirror existing org RLS patterns |
| Performance regression | Low | Benchmark JSONB queries |
| User confusion | Low | Clear UI labels ("Organization Defaults") |

---

## Estimated Effort

| Phase | Tasks | Duration |
|-------|-------|----------|
| Database | Migration + RLS | 1 day |
| Service Layer | orgSettings.service.ts + modify clauses.service.ts | 1 day |
| Admin UI | OrgClauseSettings page | 2 days |
| Integration | Contract creation flow | 1 day |
| Testing | Unit + Integration + RLS | 2 days |
| **Total** | | **7 days** |

---

## Customer Validation Questions

Before implementing, ask customers:

1. "Do you need different contract clause templates for your organization?"
2. "Do all your team members use the same standard clauses?"
3. "How often do you customize clauses when creating contracts?"
4. "Would you use a feature to set organization-wide default clauses?"

---

## Decision

- [ ] **IMPLEMENT** - Customers confirmed need
- [x] **DEFER** - Validate with customers first
- [ ] **REJECT** - No customer demand

---

## Related Documents

- Previous analysis in this conversation (2026-01-12)
- `docs/ADR-002-contract-engine-v2-architecture.md` - Contract isolation rules
- `supabase/migrations/20251224000000_create_editable_clauses_system.sql` - Current clause tables

---

*Document created: 2026-01-12*
*Last updated: 2026-01-12*
