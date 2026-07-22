-- Team KPI tracking: rewrite get_team_performance to use the sprint5 commission-split
-- columns (gross/net/broker dollar/franchise fee) instead of the legacy generic `amount`
-- column, and filter by actual closing date instead of row-creation date.
--
-- Same function name/signature as the original (0001_baseline_from_legacy.sql:1283-1429),
-- so the frontend RPC call site (useTeamPerformance.ts) needs no change.

CREATE OR REPLACE FUNCTION public.get_team_performance(p_org_id uuid, p_start_date date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_end_date date DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
          SELECT SUM(COALESCE(gross_commission, amount))
          FROM commissions
          WHERE org_id = p_org_id
            AND COALESCE(closing_date, created_at::date) BETWEEN p_start_date AND p_end_date
            AND deleted_at IS NULL
        ), 0),
        'totalGrossCommission', COALESCE((
          SELECT SUM(COALESCE(gross_commission, amount))
          FROM commissions
          WHERE org_id = p_org_id
            AND COALESCE(closing_date, created_at::date) BETWEEN p_start_date AND p_end_date
            AND deleted_at IS NULL
        ), 0),
        'totalNetCommission', COALESCE((
          SELECT SUM(COALESCE(net_commission, amount))
          FROM commissions
          WHERE org_id = p_org_id
            AND COALESCE(closing_date, created_at::date) BETWEEN p_start_date AND p_end_date
            AND deleted_at IS NULL
        ), 0),
        'totalCompanyDollar', COALESCE((
          SELECT SUM(COALESCE(broker_dollar, 0) + COALESCE(franchise_fee_amount, 0))
          FROM commissions
          WHERE org_id = p_org_id
            AND COALESCE(closing_date, created_at::date) BETWEEN p_start_date AND p_end_date
            AND deleted_at IS NULL
        ), 0),
        'totalDeals', COALESCE((
          SELECT COUNT(DISTINCT COALESCE(deal_id, id))
          FROM commissions
          WHERE org_id = p_org_id
            AND COALESCE(closing_date, created_at::date) BETWEEN p_start_date AND p_end_date
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
              SELECT SUM(COALESCE(gross_commission, amount)) as curr_total
              FROM commissions
              WHERE org_id = p_org_id
                AND COALESCE(closing_date, created_at::date) BETWEEN p_start_date AND p_end_date
                AND deleted_at IS NULL
            ) curr,
            (
              SELECT SUM(COALESCE(gross_commission, amount)) as prev_total
              FROM commissions
              WHERE org_id = p_org_id
                AND COALESCE(closing_date, created_at::date) BETWEEN v_prev_start AND v_prev_end
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
            SELECT SUM(COALESCE(c.gross_commission, c.amount))
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND COALESCE(c.closing_date, c.created_at::date) BETWEEN p_start_date AND p_end_date
              AND c.deleted_at IS NULL
          ), 0) as commission,
          COALESCE((
            SELECT SUM(COALESCE(c.gross_commission, c.amount))
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND COALESCE(c.closing_date, c.created_at::date) BETWEEN p_start_date AND p_end_date
              AND c.deleted_at IS NULL
          ), 0) as "grossCommission",
          COALESCE((
            SELECT SUM(COALESCE(c.net_commission, c.amount))
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND COALESCE(c.closing_date, c.created_at::date) BETWEEN p_start_date AND p_end_date
              AND c.deleted_at IS NULL
          ), 0) as "netCommission",
          COALESCE((
            SELECT SUM(COALESCE(c.broker_dollar, 0) + COALESCE(c.franchise_fee_amount, 0))
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND COALESCE(c.closing_date, c.created_at::date) BETWEEN p_start_date AND p_end_date
              AND c.deleted_at IS NULL
          ), 0) as "companyDollar",
          COALESCE((
            SELECT COUNT(DISTINCT COALESCE(c.deal_id, c.id))
            FROM commissions c
            WHERE c.user_id = om.user_id
              AND c.org_id = p_org_id
              AND COALESCE(c.closing_date, c.created_at::date) BETWEEN p_start_date AND p_end_date
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

COMMENT ON FUNCTION public.get_team_performance(p_org_id uuid, p_start_date date, p_end_date date) IS 'Returns team performance metrics for organization owners. Includes summary totals (gross/net/company-dollar commission split), individual member stats, and trend data. Filters by actual closing_date (falls back to created_at for legacy rows without one).';
