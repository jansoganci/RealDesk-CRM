-- Sprint 6A T3 — contracts RLS audit
-- Re-applies canonical org-scoped policies (no USING(true)); INSERT also requires user_id = auth.uid()
-- so org owners cannot create rows attributed to another user.

DROP POLICY IF EXISTS org_select_contracts ON public.contracts;
DROP POLICY IF EXISTS org_insert_contracts ON public.contracts;
DROP POLICY IF EXISTS org_update_contracts ON public.contracts;
DROP POLICY IF EXISTS org_delete_contracts ON public.contracts;

CREATE POLICY org_select_contracts ON public.contracts FOR SELECT USING (
  (deleted_at IS NULL)
  AND (org_id IN (SELECT public.get_user_org_ids()))
);

CREATE POLICY org_insert_contracts ON public.contracts FOR INSERT WITH CHECK (
  public.is_org_owner(org_id)
  AND (user_id = auth.uid())
);

CREATE POLICY org_update_contracts ON public.contracts FOR UPDATE USING (
  (deleted_at IS NULL)
  AND (org_id IN (SELECT public.get_user_org_ids()))
  AND public.is_org_owner(org_id)
) WITH CHECK (public.is_org_owner(org_id));

CREATE POLICY org_delete_contracts ON public.contracts FOR DELETE USING (false);
