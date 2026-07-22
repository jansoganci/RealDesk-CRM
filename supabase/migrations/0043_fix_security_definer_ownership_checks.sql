-- Security Advisor remediation, P0: SECURITY DEFINER functions that bypass RLS
-- without re-implementing the ownership/auth check RLS would otherwise provide.
-- See docs/security/SUPABASE_ADVISOR_REMEDIATION_PLAN.md for the full analysis.
--
-- Fixes (same name/signature as before, so no frontend/service-layer changes needed):
--   1. rpc_property_photo_insert / rpc_property_photo_delete / rpc_property_photos_reorder
--      had NO org ownership check at all -> any authenticated user in any org could
--      insert/delete/reorder another org's property photos (IDOR).
--   2. get_user_id_by_email had no auth check and was callable by `anon` -> user-
--      enumeration oracle (arbitrary email -> registered? + user_id).
--   3. user_has_active_access / has_active_subscription took a client-supplied user id
--      with no check it matched the caller -> any signed-in user could probe any other
--      user's trial/subscription status.
--
-- All also gain `SET search_path = public` (function_search_path_mutable advisor finding).
--
-- Note on grants: CREATE OR REPLACE FUNCTION preserves existing privileges, and Supabase
-- projects typically grant EXECUTE directly to `anon`/`authenticated` (not only via the
-- PUBLIC pseudo-role) via default privileges on the public schema. So every REVOKE below
-- targets PUBLIC and anon explicitly, then re-grants to authenticated, to guarantee anon
-- loses access regardless of which grant path applied it originally.

-- ---------------------------------------------------------------------------
-- 1a. rpc_property_photo_insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_property_photo_insert(p_property_id uuid, p_file_path text)
RETURNS public.property_photos
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_count integer;
  v_next integer;
  v_row public.property_photos;
begin
  if v_user_id is null then
    raise exception 'User not authenticated. Please log in.';
  end if;

  select org_id into v_org_id
  from org_members
  where user_id = v_user_id and status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception 'No active organization found for user.';
  end if;

  -- Ownership check: property must belong to the caller's org
  if not exists (
    select 1 from public.properties
    where id = p_property_id and org_id = v_org_id
  ) then
    raise exception 'Property not found or access denied: %', p_property_id;
  end if;

  -- Serialize per property
  perform pg_advisory_xact_lock(hashtext(p_property_id::text));

  select count(*) into v_count from public.property_photos where property_id = p_property_id;
  if v_count >= 10 then
    raise exception 'Maximum 10 photos allowed per property';
  end if;

  select coalesce(max(sort_order) + 1, 0) into v_next from public.property_photos where property_id = p_property_id;

  insert into public.property_photos(property_id, file_path, sort_order)
  values (p_property_id, p_file_path, v_next)
  returning * into v_row;

  return v_row;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_property_photo_insert(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_property_photo_insert(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_property_photo_insert(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 1b. rpc_property_photo_delete
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_property_photo_delete(p_property_id uuid, p_photo_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_file_path text;
begin
  if v_user_id is null then
    raise exception 'User not authenticated. Please log in.';
  end if;

  select org_id into v_org_id
  from org_members
  where user_id = v_user_id and status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception 'No active organization found for user.';
  end if;

  -- Ownership check: property must belong to the caller's org
  if not exists (
    select 1 from public.properties
    where id = p_property_id and org_id = v_org_id
  ) then
    raise exception 'Property not found or access denied: %', p_property_id;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text));

  select file_path into v_file_path
  from public.property_photos
  where id = p_photo_id and property_id = p_property_id
  for update;

  if v_file_path is null then
    raise exception 'Photo not found';
  end if;

  delete from public.property_photos where id = p_photo_id and property_id = p_property_id;

  -- Compact ordering to 0..n-1
  with ordered as (
    select id, row_number() over (order by sort_order) - 1 as rn
    from public.property_photos
    where property_id = p_property_id
  )
  update public.property_photos p
  set sort_order = o.rn
  from ordered o
  where p.id = o.id;

  return v_file_path;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_property_photo_delete(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_property_photo_delete(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_property_photo_delete(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 1c. rpc_property_photos_reorder
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_property_photos_reorder(p_property_id uuid, p_photo_ids uuid[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
begin
  if v_user_id is null then
    raise exception 'User not authenticated. Please log in.';
  end if;

  select org_id into v_org_id
  from org_members
  where user_id = v_user_id and status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception 'No active organization found for user.';
  end if;

  -- Ownership check: property must belong to the caller's org
  if not exists (
    select 1 from public.properties
    where id = p_property_id and org_id = v_org_id
  ) then
    raise exception 'Property not found or access denied: %', p_property_id;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_property_id::text));

  -- Update using unnest with ordinality for a single-pass reorder
  with new_orders as (
    select id, ord - 1 as new_sort
    from unnest(p_photo_ids) with ordinality as t(id, ord)
  )
  update public.property_photos p
  set sort_order = n.new_sort
  from new_orders n
  where p.id = n.id and p.property_id = p_property_id;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_property_photos_reorder(uuid, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_property_photos_reorder(uuid, uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.rpc_property_photos_reorder(uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. get_user_id_by_email — restrict to authenticated callers only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_input text)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(email_input)
    AND auth.uid() IS NOT NULL  -- caller must be signed in
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3a. user_has_active_access — caller may only check their own access
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_active_access(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  billing_record RECORD;
BEGIN
  IF user_uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO billing_record
  FROM user_billing
  WHERE user_id = user_uuid;

  IF billing_record IS NULL THEN
    RETURN false;
  END IF;

  -- Check if trial is still active
  IF billing_record.billing_status = 'trial' AND billing_record.trial_end > NOW() THEN
    RETURN true;
  END IF;

  -- Check if subscription is active
  IF billing_record.billing_status = 'active' AND billing_record.current_period_end > NOW() THEN
    RETURN true;
  END IF;

  -- Check if canceled but still in period
  IF billing_record.billing_status = 'canceled'
     AND billing_record.current_period_end > NOW()
     AND billing_record.cancel_at_period_end = true THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.user_has_active_access(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_active_access(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_has_active_access(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3b. has_active_subscription — caller may only check their own subscription
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_active_subscription(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
