-- Sprint 2 audit fixes: tighten RLS for buyer_agent_agreements and showing_logs
-- Scope: only policy updates for these two tables.

-- ---------------------------------------------------------------------------
-- 1) buyer_agent_agreements policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS org_select_buyer_agent_agreements ON public.buyer_agent_agreements;
DROP POLICY IF EXISTS org_insert_buyer_agent_agreements ON public.buyer_agent_agreements;
DROP POLICY IF EXISTS org_update_buyer_agent_agreements ON public.buyer_agent_agreements;
DROP POLICY IF EXISTS org_delete_buyer_agent_agreements ON public.buyer_agent_agreements;

DROP POLICY IF EXISTS "Users can view own buyer agent agreements" ON public.buyer_agent_agreements;
DROP POLICY IF EXISTS "Users can create buyer agent agreements" ON public.buyer_agent_agreements;
DROP POLICY IF EXISTS "Users can update own buyer agent agreements" ON public.buyer_agent_agreements;
DROP POLICY IF EXISTS "Users can delete own buyer agent agreements" ON public.buyer_agent_agreements;

CREATE POLICY "Users can view own buyer agent agreements"
  ON public.buyer_agent_agreements FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can create buyer agent agreements"
  ON public.buyer_agent_agreements FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own buyer agent agreements"
  ON public.buyer_agent_agreements FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete own buyer agent agreements"
  ON public.buyer_agent_agreements FOR DELETE TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 2) showing_logs policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS org_select_showing_logs ON public.showing_logs;
DROP POLICY IF EXISTS org_insert_showing_logs ON public.showing_logs;
DROP POLICY IF EXISTS org_update_showing_logs ON public.showing_logs;
DROP POLICY IF EXISTS org_delete_showing_logs ON public.showing_logs;

DROP POLICY IF EXISTS "Users can view own showing logs" ON public.showing_logs;
DROP POLICY IF EXISTS "Users can create showing logs" ON public.showing_logs;
DROP POLICY IF EXISTS "Users can update own showing logs" ON public.showing_logs;
DROP POLICY IF EXISTS "Users can delete own showing logs" ON public.showing_logs;

CREATE POLICY "Users can view own showing logs"
  ON public.showing_logs FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can create showing logs"
  ON public.showing_logs FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own showing logs"
  ON public.showing_logs FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete own showing logs"
  ON public.showing_logs FOR DELETE TO authenticated
  USING (
    org_id IN (SELECT public.get_user_org_ids())
    AND user_id = auth.uid()
  );
