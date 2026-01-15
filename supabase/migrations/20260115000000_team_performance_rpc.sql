-- Migration: Team Performance Dashboard
-- Creates indexes and RPC function for team performance metrics

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Index for commission aggregation queries
CREATE INDEX IF NOT EXISTS idx_commissions_org_user_date
  ON commissions(org_id, user_id, created_at)
  WHERE deleted_at IS NULL;

-- Index for active contracts count per user
CREATE INDEX IF NOT EXISTS idx_contracts_user_status_active
  ON contracts(user_id, org_id, status)
  WHERE deleted_at IS NULL AND status = 'Active';

-- Index for org member lookups by role
CREATE INDEX IF NOT EXISTS idx_org_members_org_role_status
  ON org_members(org_id, role, status);

-- ============================================
-- RPC FUNCTION: get_team_performance
-- ============================================

CREATE OR REPLACE FUNCTION get_team_performance(
  p_org_id UUID,
  p_start_date DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_prev_start DATE;
  v_prev_end DATE;
  v_current_user_id UUID;
  v_is_owner BOOLEAN;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();

  -- Check if user is owner of the organization
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id
      AND user_id = v_current_user_id
      AND role = 'owner'
      AND status = 'active'
  ) INTO v_is_owner;

  -- Deny access if not owner
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Access denied: Owner role required to view team performance';
  END IF;

  -- Calculate previous period for trend comparison
  v_prev_start := p_start_date - (p_end_date - p_start_date + 1);
  v_prev_end := p_start_date - INTERVAL '1 day';

  -- Build the result JSON
  SELECT json_build_object(
    'summary', (
      SELECT json_build_object(
        'totalCommission', COALESCE((
          SELECT SUM(amount)
          FROM commissions
          WHERE org_id = p_org_id
            AND created_at::DATE BETWEEN p_start_date AND p_end_date
            AND deleted_at IS NULL
        ), 0),
        'totalDeals', COALESCE((
          SELECT COUNT(DISTINCT id)
          FROM commissions
          WHERE org_id = p_org_id
            AND created_at::DATE BETWEEN p_start_date AND p_end_date
            AND deleted_at IS NULL
        ), 0),
        'activeContracts', COALESCE((
          SELECT COUNT(*)
          FROM contracts
          WHERE org_id = p_org_id
            AND status = 'Active'
            AND deleted_at IS NULL
        ), 0),
        'trend', json_build_object(
          'commission', (
            SELECT CASE
              WHEN COALESCE(prev_total, 0) = 0 THEN 0
              ELSE ROUND(((COALESCE(curr_total, 0) - COALESCE(prev_total, 0)) / NULLIF(prev_total, 0) * 100)::NUMERIC, 0)
            END
            FROM (
              SELECT SUM(amount) as curr_total
              FROM commissions
              WHERE org_id = p_org_id
                AND created_at::DATE BETWEEN p_start_date AND p_end_date
                AND deleted_at IS NULL
            ) curr,
            (
              SELECT SUM(amount) as prev_total
              FROM commissions
              WHERE org_id = p_org_id
                AND created_at::DATE BETWEEN v_prev_start AND v_prev_end
                AND deleted_at IS NULL
            ) prev
          )
        )
      )
    ),
    'members', COALESCE((
      SELECT json_agg(member_row ORDER BY member_row.commission DESC NULLS LAST)
      FROM (
        SELECT
          om.user_id as id,
          COALESCE(up.full_name, split_part(au.email, '@', 1)) as name,
          au.email,
          au.raw_user_meta_data->>'avatar_url' as "avatarUrl",
          COALESCE((
            SELECT SUM(c.amount)
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND c.created_at::DATE BETWEEN p_start_date AND p_end_date
              AND c.deleted_at IS NULL
          ), 0) as commission,
          COALESCE((
            SELECT COUNT(DISTINCT c.id)
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND c.created_at::DATE BETWEEN p_start_date AND p_end_date
              AND c.deleted_at IS NULL
          ), 0) as deals,
          COALESCE((
            SELECT COUNT(*)
            FROM contracts ct
            WHERE ct.user_id = om.user_id
              AND ct.org_id = p_org_id
              AND ct.status = 'Active'
              AND ct.deleted_at IS NULL
          ), 0) as "activeContracts",
          om.status
        FROM org_members om
        JOIN auth.users au ON au.id = om.user_id
        LEFT JOIN user_preferences up ON up.user_id = om.user_id
        WHERE om.org_id = p_org_id
          AND om.status = 'active'
      ) member_row
    ), '[]'::json),
    'period', json_build_object(
      'start', p_start_date,
      'end', p_end_date,
      'label', CASE
        WHEN p_start_date = date_trunc('month', CURRENT_DATE)::DATE THEN 'This Month'
        WHEN p_start_date = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::DATE THEN 'Last Month'
        WHEN p_start_date = date_trunc('quarter', CURRENT_DATE)::DATE THEN 'This Quarter'
        WHEN p_start_date = date_trunc('year', CURRENT_DATE)::DATE THEN 'This Year'
        ELSE to_char(p_start_date, 'Mon DD') || ' - ' || to_char(p_end_date, 'Mon DD')
      END
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_team_performance(UUID, DATE, DATE) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_team_performance IS 'Returns team performance metrics for organization owners. Includes summary totals, individual member stats, and trend data.';
