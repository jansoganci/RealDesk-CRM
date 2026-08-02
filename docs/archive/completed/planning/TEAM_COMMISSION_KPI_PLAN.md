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

## Phase 2 (implemented)

- `supabase/migrations/0054_org_member_commission_settings.sql` — `org_member_commission_settings` table (owner write RLS), `resolve_member_broker_settings` RPC, rewritten `rpc_record_commission_and_close_deal` (owner may close any org deal; `commissions.user_id` = `deals.user_id`), and lead-convert RPC accepts optional earning `user_id`.
- Owner UI on Team Members: per-member commission override (save/clear). Fallback: member Profile `user_preferences`, then defaults.
- Deal create/detail: earning agent picker (`deals.user_id`).
- `CommissionSheet` resolves settings for `deal.user_id` via override → profile → defaults.
- History: **forward-only** — no recompute of past commission rows.

### Remaining follow-ups (out of Phase 2)

- CommissionSheet still passes `capContext` YTD as zeros (cap progress at close may understate).
- Optional historical recompute of `commissions` if an org wants corrected past Net/Company Dollar.

## Other risks noted for future reference

- **Rounding**: all commission columns are `numeric(10,2)`/`numeric(8,2)` and `calculateCommission` already rounds before storing, so `SUM()` over already-rounded values carries negligible compounding risk. Worth a one-time smoke test comparing RPC totals to a manual `SUM` in the SQL editor before relying on this for real payouts.
- **`closing_date` timezone**: `closing_date` is a plain `date` column (no timezone); the `created_at::date` fallback for legacy rows casts a `timestamptz` using the database session's timezone. This assumes the Supabase connection's session timezone is UTC (the standard default) — worth confirming explicitly rather than assuming, to avoid off-by-one-day boundary issues for month/quarter cutoffs.
- **"Deals" definition**: currently one `commissions` row is created per deal closing (single `INSERT` in `CommissionSheet.tsx`), so `COUNT(DISTINCT COALESCE(deal_id, id))` is safe today. If a future feature ever records more than one commission row per deal (e.g. separate listing-side/buyer-side rows for the same closing), this counting logic will need revisiting.
- **Suspended/pending members**: by product decision, the per-member table only lists `org_members.status = 'active'` rows (matches pre-existing behavior). Org-wide totals are computed directly from `commissions` regardless of current membership status, so they remain accurate even if a member is later suspended — only their individual row disappears from the table.
