-- Atomically consume both per-user/minute and per-org/hour sensitive-field
-- quotas. Only service_role may execute this function.

CREATE OR REPLACE FUNCTION public.consume_sensitive_field_rate_limit(
  p_user_id uuid,
  p_org_id uuid,
  p_operation text,
  p_field_count integer
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_user_window timestamptz := date_trunc('minute', v_now);
  v_org_window timestamptz := date_trunc('hour', v_now);
  v_user_count integer := 0;
  v_org_count integer := 0;
  v_retry_after integer;
BEGIN
  IF p_operation NOT IN ('encrypt', 'decrypt', 'hash') THEN
    RAISE EXCEPTION 'Invalid sensitive-field operation';
  END IF;

  IF p_field_count < 1 OR p_field_count > 20 THEN
    RAISE EXCEPTION 'Invalid sensitive-field count';
  END IF;

  -- Serialize callers for the same user/org before checking and incrementing.
  PERFORM pg_advisory_xact_lock(hashtextextended('sensitive:user:' || p_user_id::text, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('sensitive:org:' || p_org_id::text, 0));

  SELECT field_count INTO v_user_count
  FROM public.sensitive_field_rate_limits
  WHERE scope_kind = 'user'
    AND scope_id = p_user_id
    AND operation = p_operation
    AND window_start = v_user_window;

  SELECT field_count INTO v_org_count
  FROM public.sensitive_field_rate_limits
  WHERE scope_kind = 'org'
    AND scope_id = p_org_id
    AND operation = p_operation
    AND window_start = v_org_window;

  v_user_count := COALESCE(v_user_count, 0);
  v_org_count := COALESCE(v_org_count, 0);

  IF v_user_count + p_field_count > 20 THEN
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_user_window + interval '1 minute' - v_now)))::integer);
    RETURN jsonb_build_object('allowed', false, 'retry_after', v_retry_after, 'scope', 'user');
  END IF;

  IF v_org_count + p_field_count > 200 THEN
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_org_window + interval '1 hour' - v_now)))::integer);
    RETURN jsonb_build_object('allowed', false, 'retry_after', v_retry_after, 'scope', 'org');
  END IF;

  INSERT INTO public.sensitive_field_rate_limits (
    scope_kind, scope_id, operation, window_start, field_count, updated_at
  ) VALUES (
    'user', p_user_id, p_operation, v_user_window, p_field_count, v_now
  )
  ON CONFLICT (scope_kind, scope_id, operation, window_start)
  DO UPDATE SET
    field_count = public.sensitive_field_rate_limits.field_count + EXCLUDED.field_count,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO public.sensitive_field_rate_limits (
    scope_kind, scope_id, operation, window_start, field_count, updated_at
  ) VALUES (
    'org', p_org_id, p_operation, v_org_window, p_field_count, v_now
  )
  ON CONFLICT (scope_kind, scope_id, operation, window_start)
  DO UPDATE SET
    field_count = public.sensitive_field_rate_limits.field_count + EXCLUDED.field_count,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('allowed', true, 'retry_after', 0, 'scope', null);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_sensitive_field_rate_limit(uuid, uuid, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_sensitive_field_rate_limit(uuid, uuid, text, integer)
  TO service_role;

-- REVERT:
-- DROP FUNCTION public.consume_sensitive_field_rate_limit(uuid, uuid, text, integer);
