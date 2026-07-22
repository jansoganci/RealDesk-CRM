# Sprint 4 — Batch F: TimelineTab Fix + AlertCenter Polling

> **Audit Source:** `docs/sprint-audits.md` → Sprint 4 (Gaps #1 and #3)
> **Project:** `/Users/jans/Projelerim/RealDesk-CRM/`

---

## Task F1: responsible_party = 'other' — DB Constraint Fix

### Problem
`TimelineTab.tsx` line 379 has `<option value="other">` in the responsible party select. But the DB constraint in `0006_sprint3_deal_core_tables.sql` (lines 345-351) only allows: `buyer, seller, buyer_agent, seller_agent, lender, title_co, inspector`. Saving a custom milestone with "other" throws a DB error.

### Files to Change

#### F1a. Create new migration: `supabase/migrations/0031_add_other_to_responsible_party.sql`

```sql
-- Add 'other' to the responsible_party check constraint
-- TimelineTab.tsx already allows 'other' in the UI for custom milestones
-- but the DB rejects it (original constraint from 0006)

ALTER TABLE deal_milestones
DROP CONSTRAINT IF EXISTS deal_milestones_responsible_party_check;

ALTER TABLE deal_milestones
ADD CONSTRAINT deal_milestones_responsible_party_check
CHECK (
  responsible_party IS NULL
  OR responsible_party = ANY (ARRAY[
    'buyer'::text,
    'seller'::text,
    'seller_agent'::text,
    'buyer_agent'::text,
    'lender'::text,
    'title_co'::text,
    'inspector'::text,
    'other'::text   -- ADDED for custom milestones
  ])
);
```

**Note:** Check the last migration number first. Run:
```bash
ls supabase/migrations/ | tail -1
```
Use the next number (e.g., if last is `0030`, name it `0031`).

---

## Task F2: AlertCenter Polling

### Problem
`useAlertCenter.ts` fetches notifications only on mount. `useDailyBrief.ts` and `useExpiringAgreements.ts` poll every 5 minutes. Users see stale notification badge until page refresh.

### Files to Change

#### F2a. `src/features/deals/hooks/useAlertCenter.ts`

**Add polling timer (after the mount effect, around line 42):**

```typescript
useEffect(() => {
  if (!currentOrg?.id) return;
  const timer = setInterval(() => {
    void refresh();
  }, 5 * 60 * 1000); // 5 minutes, matching useDailyBrief
  return () => clearInterval(timer);
}, [currentOrg?.id, refresh]);
```

**The complete file after changes:**

The hook currently has:
1. useState declarations (lines 6-11)
2. refresh callback (lines 13-38)
3. Mount useEffect (lines 40-42)

**Add the polling useEffect after the mount useEffect (around line 43):**

```typescript
// Auto-poll every 5 minutes
useEffect(() => {
  if (!currentOrg?.id) return;
  const timer = setInterval(() => {
    void refresh();
  }, 5 * 60 * 1000);
  return () => clearInterval(timer);
}, [currentOrg?.id, refresh]);
```

That's it — 8 lines added.

---

## Total Files Changed (Batch F)

| File | Type | Lines |
|------|------|-------|
| `supabase/migrations/0031_add_other_to_responsible_party.sql` | **NEW** | ~15 |
| `src/features/deals/hooks/useAlertCenter.ts` | Modified | +8 |

**Estimated time in Cursor:** ~10 minutes

---

## Verification

- Create a custom milestone with `responsible_party = 'other'` → saves without DB error
- Previous milestones with valid parties (buyer, seller, etc.) still load and display correctly
- Notification badge updates automatically without page refresh (wait up to 5 min or check after mount)
- `npm run gen:types` works after migration
