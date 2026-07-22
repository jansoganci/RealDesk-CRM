# Supabase Security Advisor — Remediation Plan

**Date:** 2026-07-20
**Source:** Supabase Dashboard → Database → Security Advisor (96 findings, all `WARN` level)
**Method:** Every finding below was cross-checked against the actual function/policy bodies in `supabase/migrations/`, not just the advisor's generic description. A few findings turned out to be non-issues (function already checks `auth.uid()` correctly); a few turned out to be **worse** than the advisor's generic wording suggests. Priorities reflect real exploitability, not advisor severity (the advisor labels everything here `WARN`).

---

## How to read this doc

- **P0** — confirmed, exploitable, cross-tenant/user data exposure. Fix first, treat as a security bug, not lint cleanup.
- **P1** — real hardening gaps, cheap and mechanical to fix, low risk of breaking anything. Good first PR.
- **P2** — advisor noise that needs a one-line judgment call per function (intentional public RPC vs. accidentally-exposed trigger function).
- **P3** — accepted risk / requires product decision, not urgent.

None of the fixes below have been applied yet — this is the plan only, per project rule (RLS/migrations require explicit approval before changing). Once you sign off, this becomes migration `0043_security_advisor_hardening.sql` (or split into a few migrations if you'd rather land P0 separately from P1).

---

## P0 — Confirmed exploitable, fix first

### P0.1 — Property photo RPCs have no ownership check (IDOR)

`rpc_property_photo_insert`, `rpc_property_photo_delete`, `rpc_property_photos_reorder` (all `SECURITY DEFINER`, all exposed to `anon` + `authenticated` per the advisor) **bypass RLS and never check that the caller's org owns `p_property_id`.**

This is worse than the advisor's generic "SECURITY DEFINER is callable" wording implies — it's a real cross-tenant vulnerability, not just an exposure surface. The table's own RLS (`org_insert_property_photos`, `org_select_property_photos`, `org_update_property_photos`, and `org_delete_property_photos` = `USING (false)`) is correctly org-scoped, but since these functions run as `SECURITY DEFINER` they skip RLS entirely and don't re-implement the check. `src/services/photos.service.ts` passes `propertyId`/`photoId` straight through with no client-side ownership check either — the backend is the only gate, and it's missing.

**Impact:** any authenticated user (any org) can:
- delete another org's property photos (`rpc_property_photo_delete`)
- insert arbitrary `file_path` strings against another org's property (`rpc_property_photo_insert`)
- reorder another org's property photos (`rpc_property_photos_reorder`)

**Fix** — add the same `auth.uid()` → `org_members` → `org_id` ownership check already used correctly in `rpc_create_tenant_with_contract` / `rpc_update_contract_status` / `rpc_delete_contract`:

```sql
CREATE OR REPLACE FUNCTION public.rpc_property_photo_delete(p_property_id uuid, p_photo_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_file_path text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  SELECT org_id INTO v_org_id FROM org_members
  WHERE user_id = v_user_id AND status = 'active' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user';
  END IF;

  -- Ownership check: property must belong to caller's org
  IF NOT EXISTS (
    SELECT 1 FROM properties WHERE id = p_property_id AND org_id = v_org_id
  ) THEN
    RAISE EXCEPTION 'Property not found or access denied';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_property_id::text));

  SELECT file_path INTO v_file_path
  FROM property_photos
  WHERE id = p_photo_id AND property_id = p_property_id
  FOR UPDATE;

  IF v_file_path IS NULL THEN
    RAISE EXCEPTION 'Photo not found';
  END IF;

  DELETE FROM property_photos WHERE id = p_photo_id AND property_id = p_property_id;

  WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY sort_order) - 1 AS rn
    FROM property_photos WHERE property_id = p_property_id
  )
  UPDATE property_photos p SET sort_order = o.rn FROM ordered o WHERE p.id = o.id;

  RETURN v_file_path;
END;
$$;
```

Apply the identical `v_user_id` → `v_org_id` → `EXISTS (... properties ... org_id = v_org_id)` guard to `rpc_property_photo_insert` and `rpc_property_photos_reorder` before their existing logic. This also fixes the `function_search_path_mutable` warning for all three (see P1.1) — do it in one pass.

### P0.2 — `get_user_id_by_email` is a user-enumeration oracle

```sql
CREATE FUNCTION public.get_user_id_by_email(email_input text) RETURNS TABLE(id uuid, email text)
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
    AS $$ SELECT id, email FROM auth.users WHERE LOWER(email) = LOWER(email_input) LIMIT 1; $$;
```

No auth check at all, callable by `anon`. Anyone can POST any email to `/rest/v1/rpc/get_user_id_by_email` and learn (a) whether that email has an account, and (b) that account's `user_id`. Used today by `organization.service.ts:280` for the "invite by email" flow — that's a legitimate use case, but it should require the caller to be authenticated and, ideally, only expose it when the caller has a pending reason to look someone up (e.g. sending an org invite), not as a bare oracle.

**Fix:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_input text)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email FROM auth.users u
  WHERE LOWER(u.email) = LOWER(email_input)
    AND auth.uid() IS NOT NULL  -- must be signed in
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
```
This still allows any signed-in user to probe arbitrary emails, which is an acceptable trade-off for an invite flow but worth knowing — if you want to close that gap too, restrict it further to only fire when the caller is an active `org_members` owner/admin.

### P0.3 — `user_has_active_access` / `has_active_subscription` leak arbitrary users' billing status

Both take a client-supplied `user_uuid` / `check_user_id` with **no check that it matches `auth.uid()`**, and are `SECURITY DEFINER` + exposed to `authenticated` (and `anon` for `user_has_active_access`). This directly violates the project rule in `CLAUDE.md`: *"Services call `getAuthenticatedUserId()` — never trust client-supplied user IDs."* Any authenticated user can check any other user's trial/subscription status by UUID (low-severity info leak, but a real one, and cheap to close).

**Fix** — drop the parameter, always use the caller's own id:
```sql
CREATE OR REPLACE FUNCTION public.user_has_active_access(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  -- ... existing body unchanged ...
END;
$$;
```
Same pattern for `has_active_subscription(check_user_id uuid)`. Keeping the parameter (rather than removing it) avoids touching every call site — the added `IF ... RAISE EXCEPTION` is the only behavior change, and legitimate callers (which already pass their own id) are unaffected.

---

## P1 — Cheap, mechanical, do in one migration

### P1.1 — `function_search_path_mutable` (25 functions)

A function without a pinned `search_path` can be tricked if someone creates a same-named object earlier in the resolution path (schema-hijacking). Fix is a one-line `ALTER FUNCTION ... SET search_path = public` per function — no behavior change for any of these except the 3 covered in P0.1 (fold that fix in at the same time). Signatures pulled from the current migrations:

```sql
ALTER FUNCTION public.calculate_next_due_date(date, character varying, integer) SET search_path = public;
ALTER FUNCTION public.consume_quota(uuid, text, uuid) SET search_path = public;
ALTER FUNCTION public.create_commission_transaction() SET search_path = public;
ALTER FUNCTION public.create_rental_commission() SET search_path = public;
ALTER FUNCTION public.create_sale_commission(uuid, numeric, text) SET search_path = public;
ALTER FUNCTION public.create_user_billing_on_signup() SET search_path = public;
ALTER FUNCTION public.generate_invitation_token() SET search_path = public;
ALTER FUNCTION public.get_invitation_info(text) SET search_path = public;
ALTER FUNCTION public.get_quota(uuid, text) SET search_path = public;
ALTER FUNCTION public.has_active_subscription(uuid) SET search_path = public;
ALTER FUNCTION public.prevent_org_id_change() SET search_path = public;
ALTER FUNCTION public.prevent_update_if_deleted() SET search_path = public;
ALTER FUNCTION public.rpc_property_photo_delete(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.rpc_property_photo_insert(uuid, text) SET search_path = public;
ALTER FUNCTION public.rpc_property_photos_reorder(uuid, uuid[]) SET search_path = public;
ALTER FUNCTION public.seed_default_clause_templates(uuid) SET search_path = public;
ALTER FUNCTION public.set_initial_next_due_date() SET search_path = public;
ALTER FUNCTION public.update_financial_transactions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_recurring_expenses_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.user_has_active_access(uuid) SET search_path = public;
ALTER FUNCTION public.sync_pipeline_stage() SET search_path = public;
```

**Three of these functions could not be found in any tracked migration file:** `set_updated_at_applicant_screenings`, `update_security_deposit_tracker_updated_at`, `update_data_subject_requests_updated_at` (same for the unrelated `rls_auto_enable`, see P2 note). They exist in the live database but not in `supabase/migrations/`, which means the migration history has drifted from production. Before writing `ALTER FUNCTION` for these three, pull their real signatures from the DB (`\df+ public.set_updated_at_applicant_screenings` in `psql`, or the Supabase dashboard's function editor) and add a reconciliation migration that also captures them going forward — otherwise a future `supabase db reset` won't recreate them.

### P1.2 — `extension_in_public`: move `pg_net` out of `public`

```sql
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_net SET SCHEMA extensions;
```
Note: `pg_net` isn't in any tracked migration either (same drift issue as above — it was enabled directly via dashboard). Verify nothing references `net.http_post` etc. with an unqualified/`public`-schema assumption before moving it; grep `supabase/functions/` and any trigger bodies for `net.` calls first.

### P1.3 — `auth_leaked_password_protection`: enable HaveIBeenPwned checking

Dashboard-only setting, not a migration: **Authentication → Providers → Email → enable "Leaked password protection."** Zero code impact, zero risk — just turn it on.

---

## P2 — SECURITY DEFINER RPC surface: per-function verdict

The advisor flags 24 functions as callable by `anon` and/or `authenticated` via `/rest/v1/rpc/*` (48 findings total, 2 per function). Most of these are *intentionally* public RPCs — that's how this app calls Postgres functions from the client (see `CLAUDE.md`: `createContractWithEntities()` RPC pattern). The real question per function is "does it check permissions internally," not "is it exposed." Verdicts below, from reading each function body:

**✅ Already safe — internally checks `auth.uid()` / org membership, no action needed:**
`accept_org_invitation`, `create_contract_atomic`, `create_first_organization`, `create_sale_commission`, `ensure_user_trial`, `get_invitation_with_inviter`, `get_org_members_with_users`, `get_user_org_ids`, `is_org_owner`, `rpc_create_contract_and_update_property`, `rpc_create_lease_contract`, `rpc_create_purchase_contract`, `rpc_create_tenant_with_contract`, `rpc_delete_contract`, `rpc_record_commission_and_close_deal`, `rpc_rollback_tenant_with_contract`, `rpc_update_contract_status`.

Note: `rpc_update_contract_status` and `rpc_delete_contract` were flagged **critical/unsafe** in the older `docs/reference/RPC_FUNCTIONS_SECURITY_AUDIT.md` (2026-01-08) — that audit is now **stale**. Both functions already have the `org_id` check applied in the current baseline migration. Worth adding a note/update to that doc so it doesn't mislead someone later; no fix needed here.

**❌ Fix — leaks data across users, see P0.2 / P0.3:**
`get_user_id_by_email`, `user_has_active_access`, `has_active_subscription`.

**❌ Fix — no ownership check, see P0.1:**
`rpc_property_photo_delete`, `rpc_property_photo_insert`, `rpc_property_photos_reorder`.

**⚠️ Low-severity, no exploit but sloppy — fix opportunistically:**
- `seed_default_clause_templates(p_user_id uuid)` — takes an arbitrary `p_user_id`, no `auth.uid()` check, but the function body only does a `SELECT EXISTS` + `RAISE NOTICE` (no data written, no data returned to caller). Not exploitable today, but it's the same "trust client-supplied user id" anti-pattern — cheap to fix, default the param to `auth.uid()` like P0.3.

**🔍 Trigger functions that shouldn't be publicly callable at all:**
`auto_accept_org_invitations`, `create_commission_transaction`, `create_rental_commission`, `create_user_billing_on_signup`, `handle_new_user_org`. These `RETURN trigger`, take zero meaningful arguments, and exist purely to run as `AFTER INSERT/UPDATE` triggers — they're not meant to be called directly, but because they're `SECURITY DEFINER` and Postgres grants `EXECUTE` to `PUBLIC` by default on function creation, PostgREST exposes them as callable RPC endpoints too. Confirmed via grep that nothing in `src/` calls any of these directly. Calling them directly either errors out (no `NEW`/`OLD` record available outside trigger context) or, in the worst case, does something unintended with no arguments to scope it. Close the surface even though today's error-on-call behavior makes this low-risk:
```sql
REVOKE EXECUTE ON FUNCTION public.auto_accept_org_invitations() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_commission_transaction() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_rental_commission() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_user_billing_on_signup() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_org() FROM anon, authenticated;
```

**⚠️ Correction — `generate_invitation_token()` is NOT a trigger function, do not revoke it from `authenticated`.** It `RETURNS text` (not `trigger`) and is called directly by the client in `organization.service.ts` — `inviteMember()` (line 368) and `resendInvitation()` (line 446), both only reachable from an already-authenticated org owner/admin inviting a teammate. Revoking `EXECUTE` from `authenticated` here would break the "invite team member" feature. It only needs to be closed off from `anon`:
```sql
REVOKE EXECUTE ON FUNCTION public.generate_invitation_token() FROM anon;
```
(`authenticated` keeps `EXECUTE`.) This is a correction to an earlier draft of this doc that had grouped it with the trigger-only functions above by mistake — worth calling out since it's the one item in this plan that could have broken a real feature if applied as originally written.

`rls_auto_enable` is a special case — **it does not exist in any tracked migration.** Its name suggests an admin/maintenance helper (auto-enabling RLS on new tables) that someone ran once from the Supabase SQL editor and never committed. Before revoking or touching it: pull its definition from the dashboard, confirm what it does and whether anything depends on it, and add it to a reconciliation migration. Don't blind-fix this one.

**Consumer-quota functions (`consume_quota`, `get_quota`) and `get_team_performance`:** left as-is. `consume_quota`/`get_quota` take `p_device_id` and are designed to be called pre-auth (device-based trial quota for anonymous users) — that's intentional, not a bug. `get_team_performance` already validates org membership internally (confirmed in `0042_team_performance_commission_kpis.sql`) and isn't in the search_path-mutable list, so it's already in good shape.

---

## P3 — Accepted risk / product decision, not urgent

### P3.1 — `rls_policy_always_true` on `consent_logs` INSERT

```sql
CREATE POLICY "Anyone can insert consent logs" ON public.consent_logs FOR INSERT WITH CHECK (true);
```
This is very likely intentional: cookie-consent banners fire before a user is authenticated, so the insert has to allow `anon`. The advisor flags `WITH CHECK (true)` on principle, but there's no sensitive data at risk (consent record is `session_id` + category booleans + language, not PII beyond an optional `user_id`). Recommend **leaving as-is**, optionally noting in the migration that it's a deliberate pre-auth exception (a comment, not a behavior change) so a future advisor pass doesn't re-flag it as unreviewed.

---

## Suggested execution order

1. **P0.1–P0.3** as one migration (`0043_fix_security_definer_ownership_checks.sql`) — these are real bugs, not lint.
2. **P1.1–P1.2** as a second migration (`0044_pin_function_search_paths.sql`) — bundle the 3 unknown-signature functions once you've pulled them from the live DB, or split them into a follow-up `0045_` once confirmed.
3. **P1.3** — flip the dashboard toggle, no migration needed.
4. **P2 REVOKEs** — same migration as P1.1/P1.2 or its own; low risk, do whenever convenient.
5. **P3.1** — no action, just a comment for posterity.
6. Re-run the Security Advisor after each migration lands to confirm the finding count drops and nothing new appeared.

Also worth a short follow-up task outside this plan: reconcile `supabase/migrations/` against the live schema (`rls_auto_enable`, `pg_net`, and 3 trigger functions exist in prod but not in any tracked migration) so `supabase db push`/`db reset` actually reproduce production.
