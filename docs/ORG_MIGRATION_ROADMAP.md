# Org Migration Roadmap

> **Document Type:** Planning & Implementation Tracking
> **Status:** IN PROGRESS - Phase 4 (Service Layer)
> **Author:** Architecture Planning Session
> **Date:** 2025-12-31
> **Last Updated:** 2025-12-31

---

## 🚀 CURRENT PROGRESS (Updated: 2025-12-31)

### ✅ Phase 1 & 2: Database Foundation - COMPLETE
- All 7 SQL migrations created and applied
- 68 RLS policies created for org-based isolation
- `organizations` and `org_members` tables created
- All business tables have `org_id` and `deleted_at` columns
- Data migration complete (existing users → orgs)
- New user trigger installed (`handle_new_user_org`)

### ✅ Phase 3: Frontend Foundation - COMPLETE
| Task | Status | File |
|------|--------|------|
| Create org types | ✅ Done | `src/types/org.ts` |
| Create OrgContext | ✅ Done | `src/contexts/OrgContext.tsx` |
| Add OrgProvider to App | ✅ Done | `src/App.tsx` |
| Create org helpers | ✅ Done | `src/lib/orgHelpers.ts` |
| Regenerate DB types | ⏸️ Blocked | Needs `npx supabase login` first |

### 🔄 Phase 4: Service Layer Migration - IN PROGRESS
| Service | Status | Notes |
|---------|--------|-------|
| properties.service.ts | ✅ Done | org_id filter + soft delete |
| tenants.service.ts | ✅ Done | org_id filter + soft delete |
| contracts.service.ts | ✅ Done | org_id filter + soft delete |
| owners.service.ts | ✅ Done | org_id filter + soft delete |
| inquiries.service.ts | ✅ Done | org_id filter + soft delete |
| meetings.service.ts | ✅ Done | org_id filter + soft delete |
| **commissions.service.ts** | 🔄 Next | File read, needs updates |
| finance/transactions.service.ts | ⏳ Pending | File read, needs updates |
| finance/recurring.service.ts | ⏳ Pending | File read, needs updates |
| finance/categories.service.ts | ⏳ Pending | Not started |
| clauses.service.ts | ⏳ Pending | Not started |

### ⏳ Phase 4: UI Updates - PENDING
| Task | Status |
|------|--------|
| Update TableActionButtons (add disabled props) | ⏳ Pending |
| Add org name to Sidebar | ⏳ Pending |
| Add i18n keys for org | ⏳ Pending |

### 📋 When Resuming Work

**Next Steps (in order):**
1. Update `commissions.service.ts` - Add imports, org_id filter, soft delete
2. Update `finance/transactions.service.ts` - Same pattern
3. Update `finance/recurring.service.ts` - Same pattern
4. Update `finance/categories.service.ts` - Read file first
5. Update `clauses.service.ts` - Read file first
6. Update `TableActionButtons` - Add `disabledEdit`/`disabledDelete` props
7. Update `Sidebar` - Show org name
8. Add i18n keys - `public/locales/en/common.json` and `tr/common.json`

**Service Update Pattern (copy for each service):**
```typescript
// 1. Add import
import { getActiveOrgId, softDelete } from '../lib/orgHelpers';

// 2. Every SELECT query - add:
const orgId = await getActiveOrgId();
// ...
.eq('org_id', orgId)
.is('deleted_at', null)

// 3. Every DELETE method - change to:
async delete(id: string): Promise<void> {
  await softDelete('table_name', id);
}
```

**Blocked Task:**
- `npx supabase gen types typescript` - Run `npx supabase login` first, then regenerate types

---

## Executive Summary

**Goal:** Transform Emlak CRM from single-tenant (user_id isolation) to multi-tenant (org_id isolation) so agencies can invite team members to share data.

**Approach:** Simplified MVP - only 2 roles (owner/member), no branches, no granular permissions. Add complexity only when customers request it.

**Timeline:** 3-4 weeks (conservative estimate for solo developer working part-time)

**Risk Level:** Medium-High (touches every table, RLS, and service layer)

---

## Part 1: Open Questions & Assumptions

### Open Questions (Must Answer Before Implementation)

| # | Question | Impact | Default Assumption |
|---|----------|--------|-------------------|
| Q1 | Should members be able to CREATE records, or only VIEW? | RLS policies | Members = read-only |
| Q2 | What happens to a user's data if they're removed from an org? | Data ownership | Data stays with org, not user |
| Q3 | Can a user belong to multiple orgs? | OrgContext design | No - one org per user in V1 |
| Q4 | How does billing work with orgs? | Billing tables | Keep billing at user-level (org owner pays) |
| Q5 | Should soft-deleted records be visible to anyone? | UI + RLS | No - hidden everywhere |
| Q6 | What's the invite flow? Email? Magic link? | Frontend scope | Defer - manual DB insert for V1 |
| Q7 | Do existing storage paths need migration? | Storage complexity | No - keep old paths, new uploads use org_id paths |

### Assumptions (Validate These)

| # | Assumption | Risk if Wrong |
|---|------------|---------------|
| A1 | All 14 business tables have `user_id` column | Migration script fails |
| A2 | No user has data in multiple user_id values | Data integrity issues |
| A3 | `update_updated_at_column()` function exists | Trigger creation fails |
| A4 | All current RLS policies follow naming pattern | Policy drop fails |
| A5 | No foreign key constraints block adding org_id | ALTER TABLE fails |
| A6 | Production has < 100k rows per table | Migration performance OK |

### Terminology (Normalized)

| Term | Definition |
|------|------------|
| Organization (org) | A real estate agency - the top-level tenant |
| Member | A user who belongs to an org |
| Owner | A member with full CRUD + invite permissions |
| Member (role) | A member with read-only access |
| Soft delete | Setting `deleted_at` instead of DELETE |
| Hard delete | Actual row removal (avoided in V1) |

---

## Part 2: Phase-by-Phase Roadmap

### Phase 0: Design & Validation (No Code)
**Duration:** 1-2 days
**Goal:** Validate assumptions, finalize decisions, prepare test plan

### Phase 1: Database Foundation
**Duration:** 2-3 days
**Goal:** Create org tables, add columns, migrate existing data
**Dependency:** Phase 0 complete

### Phase 2: RLS Migration
**Duration:** 2-3 days
**Goal:** Replace user_id RLS with org_id RLS
**Dependency:** Phase 1 complete
**Risk:** HIGH - incorrect RLS = data leak or lockout

### Phase 3: Frontend Foundation
**Duration:** 2-3 days
**Goal:** OrgContext, types, hook infrastructure
**Dependency:** Phase 2 complete (RLS must work first)

### Phase 4: Service Layer Migration
**Duration:** 4-5 days
**Goal:** Update all services with org_id filtering
**Dependency:** Phase 3 complete

### Phase 5: Integration Testing
**Duration:** 2-3 days
**Goal:** Full app testing with 2 test users
**Dependency:** Phase 4 complete

### Phase 6: Production Deployment
**Duration:** 1 day
**Goal:** Deploy and verify in production
**Dependency:** Phase 5 complete

---

## Part 3: Detailed Task Breakdown

### Phase 0: Design & Validation (No Code)

**Goal:** Make sure we understand what we're building before writing any code.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P0.1 | Answer all Open Questions (Q1-Q7) | - | Blocks everything |
| P0.2 | Validate Assumptions (A1-A6) with DB queries | - | Medium |
| P0.3 | List all current RLS policy names (exact strings) | - | Low |
| P0.4 | Count rows per table in production | - | Low |
| P0.5 | Create local test database with production schema | - | Low |
| P0.6 | Write manual test checklist for Phase 5 | - | Low |
| P0.7 | Decision: Finalize all open questions | P0.1 | Blocks Phase 1 |

**Validation Queries to Run:**
```sql
-- A1: Check user_id exists on all tables
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'user_id' AND table_schema = 'public';

-- A3: Check update function exists
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';

-- A4: List all current RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- A6: Row counts
SELECT relname, n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

**Success Criteria:**
- [ ] All 7 open questions have documented answers
- [ ] All 6 assumptions validated (or plan adjusted)
- [ ] Full list of current RLS policy names captured
- [ ] Test checklist written
- [ ] Local test database ready

**What Could Go Wrong:**
- Assumption is false → adjust plan before starting
- Open question has no clear answer → make decision and document it

---

### Phase 1: Database Foundation

**Goal:** Create org infrastructure and prepare data, without breaking existing app.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P1.1 | Create `organizations` table | - | Low |
| P1.2 | Create `org_members` table | P1.1 | Low |
| P1.3 | Add RLS to org tables (org_select, org_insert, etc.) | P1.2 | Medium |
| P1.4 | Add `org_id` column to all 14 tables (NULLABLE) | P1.1 | Low |
| P1.5 | Add `deleted_at` column to all 14 tables | - | Low |
| P1.6 | Create indexes on new columns | P1.4, P1.5 | Low |
| P1.7 | Write data migration script (DO $$ block) | P1.4 | HIGH |
| P1.8 | **TEST:** Run migration on local DB | P1.7 | HIGH |
| P1.9 | Verify all rows have org_id populated | P1.8 | HIGH |
| P1.10 | Add NOT NULL constraint to org_id | P1.9 | Medium |

**Critical Test for P1.8:**
```sql
-- After migration, this should return 0 for all tables
SELECT 'properties' as tbl, COUNT(*) FROM properties WHERE org_id IS NULL
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants WHERE org_id IS NULL
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts WHERE org_id IS NULL
-- ... repeat for all 14 tables
```

**Success Criteria:**
- [ ] `organizations` and `org_members` tables exist
- [ ] All 14 business tables have `org_id` and `deleted_at` columns
- [ ] All existing rows have `org_id` populated
- [ ] NOT NULL constraint added without errors
- [ ] Existing app still works (no RLS changes yet)

**What Could Go Wrong:**
- Migration script misses some user_ids → orphaned data
- User exists in auth.users but not in any data table → no org created
- NOT NULL constraint fails → some rows missed in migration
- FK constraint blocks column addition → drop/recreate constraint

**Rollback:**
```sql
-- If Phase 1 fails:
ALTER TABLE properties DROP COLUMN IF EXISTS org_id;
ALTER TABLE properties DROP COLUMN IF EXISTS deleted_at;
-- Repeat for all tables
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
```

---

### Phase 2: RLS Migration

**Goal:** Switch from user_id-based RLS to org_id-based RLS.

**WARNING:** This is the highest-risk phase. Incorrect RLS = data leak or complete lockout.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P2.1 | Document all current policy names (exact) | Phase 1 | Low |
| P2.2 | Write DROP POLICY statements for all old policies | P2.1 | Medium |
| P2.3 | Write CREATE POLICY statements for all new policies | - | HIGH |
| P2.4 | Write policies for property_photos (parent join) | P2.3 | HIGH |
| P2.5 | Create new-user trigger (auto-create org) | Phase 1 | Medium |
| P2.6 | **TEST:** Apply to local DB, test with 2 users | P2.3 | HIGH |
| P2.7 | Test: User A cannot see User B's data | P2.6 | HIGH |
| P2.8 | Test: Owner can CRUD, Member can only read | P2.6 | HIGH |
| P2.9 | Test: New user signup creates org | P2.5, P2.6 | Medium |
| P2.10 | Test: All existing features still work | P2.6 | HIGH |

**Critical Tests:**
```sql
-- Test as User A (owner of Org A)
SET request.jwt.claim.sub = 'user-a-uuid';
SELECT * FROM properties; -- Should only see Org A properties
INSERT INTO properties (..., org_id) VALUES (..., 'org-a-uuid'); -- Should work
INSERT INTO properties (..., org_id) VALUES (..., 'org-b-uuid'); -- Should FAIL

-- Test as User B (member of Org A)
SET request.jwt.claim.sub = 'user-b-uuid';
SELECT * FROM properties; -- Should see Org A properties (read OK)
INSERT INTO properties (...) VALUES (...); -- Should FAIL (member can't write)
```

**Success Criteria:**
- [ ] All old RLS policies dropped
- [ ] All new RLS policies created
- [ ] User A cannot see User B's data (different orgs)
- [ ] User A and B CAN see same data (same org)
- [ ] Owner can CRUD, Member can only SELECT
- [ ] New user signup creates org automatically
- [ ] No 403/RLS errors in existing app flows

**What Could Go Wrong:**
- Policy name mismatch → DROP fails, duplicates
- Subquery in RLS has wrong table reference → all access blocked
- Missing policy → data leak or lockout
- New user trigger fails → signup broken

**Rollback:**
```sql
-- Emergency: Allow all authenticated users (DANGEROUS)
DROP POLICY IF EXISTS "org_select_properties" ON properties;
CREATE POLICY "temp_allow_all" ON properties FOR ALL USING (true);
-- Then manually restore old policies
```

---

### Phase 3: Frontend Foundation

**Goal:** Create TypeScript infrastructure for org-aware frontend.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P3.1 | Create `src/types/org.ts` | - | Low |
| P3.2 | Create `OrgContext` and `OrgProvider` | P3.1 | Medium |
| P3.3 | Create `useOrg()` hook | P3.2 | Low |
| P3.4 | Wrap app root with `OrgProvider` | P3.3 | Medium |
| P3.5 | Add `isOwner` check to UI (hide edit buttons for members) | P3.3 | Low |
| P3.6 | **TEST:** useOrg returns correct org data | P3.4 | Medium |
| P3.7 | **TEST:** isOwner is true for owner, false for member | P3.6 | Medium |

**Success Criteria:**
- [ ] `useOrg()` hook works throughout app
- [ ] `currentOrg.id` is accessible in all components
- [ ] `isOwner` correctly reflects role
- [ ] No runtime errors on page load

**What Could Go Wrong:**
- OrgContext fetch fails → app crashes on load
- User has no org membership → infinite loading
- Multiple org memberships (if allowed later) → wrong org selected

---

### Phase 4: Service Layer Migration

**Goal:** Update all services to use org_id filtering.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P4.1 | Update `properties.service.ts` | Phase 3 | Medium |
| P4.2 | Update `tenants.service.ts` | Phase 3 | Medium |
| P4.3 | Update `contracts.service.ts` | Phase 3 | Medium |
| P4.4 | Update `owners.service.ts` | Phase 3 | Medium |
| P4.5 | Update `inquiries.service.ts` | Phase 3 | Medium |
| P4.6 | Update `meetings.service.ts` | Phase 3 | Medium |
| P4.7 | Update `commissions.service.ts` | Phase 3 | Medium |
| P4.8 | Update `finance/transactions.service.ts` | Phase 3 | Medium |
| P4.9 | Update `finance/recurring.service.ts` | Phase 3 | Medium |
| P4.10 | Update `finance/categories.service.ts` | Phase 3 | Medium |
| P4.11 | Update `clauses.service.ts` | Phase 3 | Medium |
| P4.12 | Update all RPC function calls | P4.1-P4.11 | HIGH |
| P4.13 | Implement soft delete in all delete methods | Phase 3 | Medium |
| P4.14 | **TEST:** Each service CRUD operations | P4.1-P4.13 | HIGH |

**Service Update Pattern:**
```typescript
// Every SELECT must add:
.eq('org_id', orgId)
.is('deleted_at', null)

// Every INSERT must add:
{ ...data, org_id: orgId }

// Every DELETE becomes:
.update({ deleted_at: new Date().toISOString() })
```

**Success Criteria:**
- [ ] All 11 services updated
- [ ] All CRUD operations work correctly
- [ ] Soft delete works (deleted records not visible)
- [ ] No TypeScript errors
- [ ] No runtime errors

**What Could Go Wrong:**
- Missing org_id filter → see other org's data (but RLS should block)
- Forgot to pass orgId → runtime error
- Soft delete not added → records actually deleted

---

### Phase 5: Integration Testing

**Goal:** Full end-to-end testing with real user flows.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P5.1 | Create test user A (owner of Org A) | Phase 4 | Low |
| P5.2 | Create test user B (member of Org A) | P5.1 | Low |
| P5.3 | Create test user C (owner of Org B) | P5.1 | Low |
| P5.4 | Test: A creates property → visible to A and B, not C | P5.1-P5.3 | HIGH |
| P5.5 | Test: B tries to create property → fails | P5.2 | Medium |
| P5.6 | Test: A deletes property → soft deleted, invisible | P5.1 | Medium |
| P5.7 | Test: Full flow - create tenant, contract, etc. | P5.1 | HIGH |
| P5.8 | Test: New user signup → org created automatically | - | Medium |
| P5.9 | Test: All dashboard stats correct | P5.1-P5.3 | Medium |
| P5.10 | Test: PDF generation still works | P5.1 | Medium |
| P5.11 | Test: Photo upload/delete works | P5.1 | Medium |

**Manual Test Checklist:**
```
[ ] Login as Owner A
[ ] Create property → appears in list
[ ] Create tenant → appears in list
[ ] Create contract → appears in list
[ ] Delete property → disappears (soft delete)
[ ] Logout

[ ] Login as Member B (same org as A)
[ ] See A's property → YES
[ ] Try to edit A's property → BLOCKED
[ ] Try to create new property → BLOCKED
[ ] Logout

[ ] Login as Owner C (different org)
[ ] See A's property → NO
[ ] Create own property → works
[ ] Logout

[ ] New signup as User D
[ ] Org created automatically → YES
[ ] Can create properties → YES
```

**Success Criteria:**
- [ ] All manual tests pass
- [ ] No console errors
- [ ] No 403/RLS errors
- [ ] Data isolation confirmed

---

### Phase 6: Production Deployment

**Goal:** Deploy to production safely.

| Task | Description | Dependency | Risk |
|------|-------------|------------|------|
| P6.1 | Backup production database | - | Critical |
| P6.2 | Run migrations in order | Phase 5, P6.1 | HIGH |
| P6.3 | Verify data migration completed | P6.2 | HIGH |
| P6.4 | Deploy frontend | P6.2 | Medium |
| P6.5 | Smoke test all main flows | P6.4 | HIGH |
| P6.6 | Monitor for errors (30 min) | P6.5 | Medium |
| P6.7 | Announce to users if needed | P6.6 | Low |

**Deployment Order:**
1. Put app in maintenance mode (optional)
2. Backup database
3. Run all migrations
4. Verify migrations
5. Deploy frontend
6. Test
7. Remove maintenance mode

**Success Criteria:**
- [ ] All migrations run without error
- [ ] All existing users can login and see their data
- [ ] No data loss
- [ ] No 500 errors in logs

**Rollback Triggers:**
- Migration fails → restore from backup
- Users can't see their data → check RLS, possibly revert
- 500 errors spike → revert frontend, investigate

---

## Part 4: Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS policy locks out all users | Medium | Critical | Test thoroughly on local first |
| RLS policy allows cross-org access | Medium | Critical | Test with 2 users in different orgs |
| Data migration misses rows | Low | High | Validate with COUNT queries |
| NOT NULL constraint fails | Low | Medium | Fix data before adding constraint |
| New user trigger fails | Medium | High | Test signup flow explicitly |
| Frontend crashes on load | Medium | High | Add error boundaries, test OrgContext |
| Performance degradation | Low | Medium | Test with realistic data volume |

---

## Part 5: Pre-Implementation Checklist

Before writing ANY code, confirm:

**Open Questions Resolved:**
- [ ] Q1: Member permissions decided (read-only confirmed)
- [ ] Q2: Removed member data policy decided
- [ ] Q3: Multi-org support decided (single org V1)
- [ ] Q4: Billing scope decided (user-level)
- [ ] Q5: Soft delete visibility decided (hidden)
- [ ] Q6: Invite flow scope decided (manual V1)
- [ ] Q7: Storage path migration decided (no migration)

**Assumptions Validated:**
- [ ] A1: All tables have user_id (verified with query)
- [ ] A2: No multi-user_id records (verified)
- [ ] A3: update_updated_at_column exists (verified)
- [ ] A4: Current policy names documented
- [ ] A5: No blocking FK constraints (verified)
- [ ] A6: Row counts acceptable (verified)

**Infrastructure Ready:**
- [ ] Local test database with production schema
- [ ] Manual test checklist written
- [ ] Rollback scripts prepared
- [ ] Database backup process confirmed

**Team Alignment:**
- [ ] Timeline realistic for my schedule
- [ ] No other major features in parallel
- [ ] Can dedicate focused time blocks

---

## Part 6: Decision Log

Document all decisions made during planning:

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-31 | 2 roles only (owner/member) | Ship fast, add complexity when requested |
| 2025-12-31 | No branches in V1 | No customer has requested this |
| 2025-12-31 | Member = read-only | Simplest permission model |
| 2025-12-31 | Keep billing at user-level | Org billing adds complexity |
| 2025-12-31 | No platform admin in V1 | Use Supabase Dashboard for admin |
| 2025-12-31 | No storage path migration | Old paths work, new uploads use org_id |
| TBD | Invite flow approach | Need to decide: email, magic link, or manual |

---

## Next Steps

1. **Review this document** - Does it make sense? Any missing pieces?
2. **Answer open questions** - Make decisions on Q1-Q7
3. **Validate assumptions** - Run the SQL queries
4. **Complete pre-implementation checklist** - All boxes checked
5. **THEN start Phase 1** - Not before

---

*"Plan slowly, implement fast once the plan is solid."*
