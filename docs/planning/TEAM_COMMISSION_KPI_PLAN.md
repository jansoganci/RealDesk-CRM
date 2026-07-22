# Team Commission KPI Tracking

## Summary

Owners can now see, per team member and org-wide, for a selectable period on `/team` (plus a compact owner-only summary card on `/dashboard`):

- Deals closed
- Gross commission (`commission` / `grossCommission` — unchanged meaning from before this change)
- Net commission payable to the agent ("hakediş") — `netCommission`
- Brokerage/company take ("company dollar") — `companyDollar` = `broker_dollar + franchise_fee_amount`

This was previously untracked at the team level: the `/team` page existed but its backing RPC summed a legacy generic `amount` column and counted unrelated "active rental contracts," never adopting the richer gross/net/broker-split commission model that `commissionCalculator.ts` and the `commissions` table have supported since the Sprint 5 commission-split work (`0015_sprint5_user_preferences_commission_settings.sql`, `0016_sprint5_commissions_extension.sql`).

## What changed

- `supabase/migrations/0042_team_performance_commission_kpis.sql` — rewrites `public.get_team_performance` (same name/signature, so no frontend RPC-call-site change) to aggregate `gross_commission`, `net_commission`, `broker_dollar`, `franchise_fee_amount` per member and org-wide, filtered by `closing_date` (falling back to `created_at::date` for legacy rows without one) instead of `created_at::date` alone. Deals are counted as `COUNT(DISTINCT COALESCE(deal_id, id))`. Owner-only access check and `activeContracts` metric are unchanged.
- `src/features/team/types/team.types.ts`, `TeamPerformance.tsx`, `public/locales/en/team.json` — new Net/Company Dollar summary cards, a prominent org-wide Company Dollar callout, and matching table columns.
- `src/features/dashboard/hooks/useTeamPerformanceSummary.ts`, `src/features/dashboard/components/TeamPerformanceSummaryCard.tsx`, `Dashboard.tsx` — a compact "this month" summary card, visible only when `useOrg().isOwner` is true, linking to `/team`.

## Known limitation — deferred, not fixed in this pass

**The commission split used to compute `broker_dollar`/`net_commission`/`franchise_fee_amount` on a closed deal is calculated using the *closer's own* broker settings, not the settings of the agent who actually owns the deal.**

Specifically: `src/features/deals/components/CommissionSheet.tsx:125` calls `userPreferencesService.getBrokerSettings()` with no arguments. That resolves (`commissions.service.ts:58`, `getAuthenticatedUserId()`) to the **currently logged-in user's own** `user_preferences.broker_split_pct` / `annual_cap_amount`, not `deal.user_id`'s. Only organization owners can open "Record closing" at all (`DealOutcomeActions` is gated `readOnly={isMember}` in `DealDetail.tsx`), and owners routinely close deals that belong to other agents on their team. So today, every cross-agent closing stores split/cap numbers computed from the *owner's* settings, not the actual selling/listing agent's.

**Impact:** `netCommission` ("hakediş") and `companyDollar` figures in this new KPI view are only fully accurate when:
- every team member shares the same `broker_split_pct`/cap settings, or
- each agent closes their own deals (owner never records closings on a teammate's behalf).

If those don't hold, the per-member Net and Company Dollar numbers can be wrong for deals an owner closed on behalf of someone else. `gross_commission` and deal counts are unaffected (they don't depend on split settings). A short caveat about this is shown in the `/team` UI (`team.json`'s `caveats.splitAccuracy` key).

### Phase 2 (not implemented — scope for a future pass)

1. Add per-member commission-settings storage that an owner can configure for teammates independently of that teammate's own self-service `user_preferences` row — either new columns on `org_members` (mirroring the Sprint 5 columns: `broker_split_pct`, `annual_cap_amount`, `cap_anniversary_date`, franchise fields) or a new `org_member_commission_settings` table keyed by `(org_id, user_id)` with owner-only write RLS.
2. Change `CommissionSheet.tsx` to resolve `deal.user_id`'s settings (via the new table/columns, falling back to that member's own `user_preferences` row if no org-level override exists) instead of the currently authenticated user's settings.
3. Decide whether to backfill/recompute historical `commissions` rows once correct per-member settings exist, or only apply the fix going forward — this is a financial-correctness decision that should involve the org owner, not just a silent recompute.
4. This is auth/authorization-adjacent and touches money calculations directly — treat as its own reviewed migration + change, not bundled into unrelated work.

## Other risks noted for future reference

- **Rounding**: all commission columns are `numeric(10,2)`/`numeric(8,2)` and `calculateCommission` already rounds before storing, so `SUM()` over already-rounded values carries negligible compounding risk. Worth a one-time smoke test comparing RPC totals to a manual `SUM` in the SQL editor before relying on this for real payouts.
- **`closing_date` timezone**: `closing_date` is a plain `date` column (no timezone); the `created_at::date` fallback for legacy rows casts a `timestamptz` using the database session's timezone. This assumes the Supabase connection's session timezone is UTC (the standard default) — worth confirming explicitly rather than assuming, to avoid off-by-one-day boundary issues for month/quarter cutoffs.
- **"Deals" definition**: currently one `commissions` row is created per deal closing (single `INSERT` in `CommissionSheet.tsx`), so `COUNT(DISTINCT COALESCE(deal_id, id))` is safe today. If a future feature ever records more than one commission row per deal (e.g. separate listing-side/buyer-side rows for the same closing), this counting logic will need revisiting.
- **Suspended/pending members**: by product decision, the per-member table only lists `org_members.status = 'active'` rows (matches pre-existing behavior). Org-wide totals are computed directly from `commissions` regardless of current membership status, so they remain accurate even if a member is later suspended — only their individual row disappears from the table.
