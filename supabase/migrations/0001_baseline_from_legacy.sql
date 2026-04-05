--
-- PostgreSQL database dump
--

-- (psql-only \\restrict removed — not valid in SQL Editor / plain SQL)

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: accept_org_invitation(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.accept_org_invitation(p_token text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Get current user's email
  SELECT email INTO v_invitation
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Find invitation by token
  SELECT oi.* INTO v_invitation
  FROM public.org_invitations oi
  WHERE oi.invitation_token = p_token
    AND oi.accepted_at IS NULL
    AND oi.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation not found or expired'
    );
  END IF;
  
  -- Verify email matches (case-insensitive)
  IF LOWER(v_invitation.email) != LOWER((SELECT email FROM auth.users WHERE id = v_user_id)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation email does not match your account'
    );
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = v_invitation.org_id AND user_id = v_user_id
  ) THEN
    -- Mark as accepted anyway
    UPDATE public.org_invitations
    SET accepted_at = now(), updated_at = now()
    WHERE id = v_invitation.id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'You are already a member of this organization',
      'org_id', v_invitation.org_id
    );
  END IF;
  
  -- Create org_members record
  INSERT INTO public.org_members (
    org_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    joined_at
  ) VALUES (
    v_invitation.org_id,
    v_user_id,
    v_invitation.role,
    'active',
    v_invitation.invited_by,
    v_invitation.invited_at,
    now()
  );
  
  -- Mark invitation as accepted
  UPDATE public.org_invitations
  SET accepted_at = now(), updated_at = now()
  WHERE id = v_invitation.id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined organization',
    'org_id', v_invitation.org_id
  );
END;
$$;


--
-- Name: FUNCTION accept_org_invitation(p_token text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.accept_org_invitation(p_token text) IS 'Accepts an org invitation using a token (for users who registered before clicking link)';


--
-- Name: auto_accept_org_invitations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_accept_org_invitations() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Find all pending, non-expired invitations for this user's email
  FOR invitation_record IN
    SELECT id, org_id, email, role, invited_by
    FROM public.org_invitations
    WHERE LOWER(email) = LOWER(NEW.email)
      AND accepted_at IS NULL
      AND expires_at > now()
  LOOP
    -- Create org_members record
    INSERT INTO public.org_members (
      org_id,
      user_id,
      role,
      status,
      invited_by,
      invited_at,
      joined_at
    ) VALUES (
      invitation_record.org_id,
      NEW.id,
      invitation_record.role,
      'active',
      invitation_record.invited_by,
      now(),
      now()
    )
    ON CONFLICT (org_id, user_id) DO NOTHING; -- Skip if already member
    
    -- Mark invitation as accepted
    UPDATE public.org_invitations
    SET accepted_at = now(),
        updated_at = now()
    WHERE id = invitation_record.id;
    
    RAISE NOTICE 'Auto-accepted invitation for user % to org %', NEW.email, invitation_record.org_id;
  END LOOP;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION auto_accept_org_invitations(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_accept_org_invitations() IS 'Automatically accepts pending org invitations when a user signs up';


--
-- Name: calculate_next_due_date(date, character varying, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_next_due_date(current_due_date date, freq character varying, day_of_month integer DEFAULT NULL::integer) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  next_date DATE;
BEGIN
  CASE freq
    WHEN 'monthly' THEN
      IF day_of_month IS NOT NULL THEN
        -- Use specific day of month
        next_date := (current_due_date + INTERVAL '1 month')::DATE;
        next_date := DATE_TRUNC('month', next_date)::DATE + (day_of_month - 1);
      ELSE
        -- Use same day next month
        next_date := current_due_date + INTERVAL '1 month';
      END IF;

    WHEN 'quarterly' THEN
      next_date := current_due_date + INTERVAL '3 months';

    WHEN 'yearly' THEN
      next_date := current_due_date + INTERVAL '1 year';

    ELSE
      next_date := current_due_date;
  END CASE;

  RETURN next_date;
END;
$$;


--
-- Name: consume_quota(uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_quota(p_user_id uuid DEFAULT NULL::uuid, p_device_id text DEFAULT NULL::text, p_client_request_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_today DATE;
    v_used INTEGER;
    v_limit INTEGER := 3;  -- Free tier limit (updated from 5 to 3)
    v_is_premium BOOLEAN := false;
    v_existing_success BOOLEAN;
    v_existing_refunded BOOLEAN;
    v_existing_response JSONB;
BEGIN
    -- Set device_id session for RLS
    IF p_device_id IS NOT NULL THEN
        PERFORM set_config('request.device_id', p_device_id, true);
    END IF;

    -- Validate inputs
    IF p_user_id IS NULL AND p_device_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Either user_id or device_id required',
            'quota_used', 0,
            'quota_limit', v_limit,
            'quota_remaining', 0
        );
    END IF;

    v_today := CURRENT_DATE;

    -- ========================================
    -- STEP 1: IDEMPOTENCY CHECK (FIXED)
    -- ========================================
    IF p_client_request_id IS NOT NULL THEN
        -- Check for existing request
        SELECT success, refunded
        INTO v_existing_success, v_existing_refunded
        FROM quota_consumption_log
        WHERE request_id = p_client_request_id;

        IF FOUND THEN
            IF v_existing_refunded = true THEN
                -- ✅ FIX: Refunded requests are retryable (quota was restored)
                DELETE FROM quota_consumption_log WHERE request_id = p_client_request_id;
                RAISE LOG '[QUOTA] Refunded request deleted, allowing retry: request_id=%', p_client_request_id;
                -- Continue to normal flow below

            ELSIF v_existing_success = true THEN
                -- ✅ Successful non-refunded request: return cached (idempotent)
                SELECT jsonb_build_object(
                    'success', success,
                    'idempotent', true,
                    'is_premium', (quota_limit > 100),
                    'quota_used', quota_used,
                    'quota_limit', quota_limit,
                    'quota_remaining', quota_limit - quota_used
                ) INTO v_existing_response
                FROM quota_consumption_log
                WHERE request_id = p_client_request_id;

                RAISE LOG '[QUOTA] Returning cached success response for request_id=%', p_client_request_id;
                RETURN v_existing_response;

            ELSE
                -- ✅ Failed non-refunded request: return cached failure (no retry without refund)
                SELECT jsonb_build_object(
                    'success', false,
                    'idempotent', true,
                    'error', error_message,
                    'quota_used', quota_used,
                    'quota_limit', quota_limit,
                    'quota_remaining', 0
                ) INTO v_existing_response
                FROM quota_consumption_log
                WHERE request_id = p_client_request_id;

                RAISE LOG '[QUOTA] Returning cached failure response for request_id=%', p_client_request_id;
                RETURN v_existing_response;
            END IF;
        END IF;
    END IF;

    -- ========================================
    -- STEP 2: SERVER-SIDE PREMIUM CHECK 🔒
    -- ========================================
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE (
            (p_user_id IS NOT NULL AND user_id = p_user_id)
            OR (p_device_id IS NOT NULL AND device_id = p_device_id)
        )
        AND status = 'active'
        AND expires_at > NOW()
        AND status != 'cancelled'
    ) INTO v_is_premium;

    RAISE LOG '[QUOTA] Premium check: user_id=%, device_id=%, is_premium=%',
        p_user_id, p_device_id, v_is_premium;

    -- Premium users bypass quota
    IF v_is_premium THEN
        -- Log premium usage (for analytics)
        IF p_client_request_id IS NOT NULL THEN
            INSERT INTO quota_consumption_log (
                request_id, user_id, device_id, quota_used, quota_limit, success
            ) VALUES (
                p_client_request_id, p_user_id, p_device_id, 0, 999999, true
            ) ON CONFLICT (request_id) DO NOTHING;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', false,
            'is_premium', true,
            'quota_used', 0,
            'quota_limit', 999999,
            'quota_remaining', 999999,
            'premium_bypass', true
        );
    END IF;

    -- ========================================
    -- STEP 3: ROW LOCKING + QUOTA CHECK
    -- ========================================
    BEGIN
        -- Try to insert first (optimistic path for new day)
        INSERT INTO daily_quotas (user_id, device_id, date, used, limit_value)
        VALUES (p_user_id, p_device_id, v_today, 1, v_limit)
        RETURNING used, limit_value INTO v_used, v_limit;

        RAISE LOG '[QUOTA] New record created: used=%, limit=%', v_used, v_limit;

    EXCEPTION
        WHEN unique_violation THEN
            -- Record exists, acquire lock and update
            RAISE LOG '[QUOTA] Record exists, acquiring lock...';

            -- Acquire row lock with FOR UPDATE
            SELECT used, limit_value INTO v_used, v_limit
            FROM daily_quotas
            WHERE COALESCE(user_id::text, '') = COALESCE(p_user_id::text, '')
            AND COALESCE(device_id, '') = COALESCE(p_device_id, '')
            AND date = v_today
            FOR UPDATE;

            -- Check if quota available WHILE HOLDING LOCK
            IF v_used >= v_limit THEN
                -- Log exceeded attempt
                IF p_client_request_id IS NOT NULL THEN
                    INSERT INTO quota_consumption_log (
                        request_id, user_id, device_id, quota_used, quota_limit,
                        success, error_message
                    ) VALUES (
                        p_client_request_id, p_user_id, p_device_id, v_used, v_limit,
                        false, 'Daily quota exceeded'
                    ) ON CONFLICT (request_id) DO NOTHING;
                END IF;

                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Daily quota exceeded',
                    'quota_used', v_used,
                    'quota_limit', v_limit,
                    'quota_remaining', 0,
                    'is_premium', false
                );
            END IF;

            -- Atomically increment
            UPDATE daily_quotas
            SET used = used + 1, updated_at = NOW()
            WHERE COALESCE(user_id::text, '') = COALESCE(p_user_id::text, '')
            AND COALESCE(device_id, '') = COALESCE(p_device_id, '')
            AND date = v_today
            RETURNING used, limit_value INTO v_used, v_limit;

            RAISE LOG '[QUOTA] Updated: used=%, limit=%', v_used, v_limit;
    END;

    -- ========================================
    -- STEP 4: LOG CONSUMPTION
    -- ========================================
    IF p_client_request_id IS NOT NULL THEN
        INSERT INTO quota_consumption_log (
            request_id, user_id, device_id, quota_used, quota_limit, success
        ) VALUES (
            p_client_request_id, p_user_id, p_device_id, v_used, v_limit, true
        ) ON CONFLICT (request_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'is_premium', false,
        'quota_used', v_used,
        'quota_limit', v_limit,
        'quota_remaining', v_limit - v_used
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG '[QUOTA] ERROR: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'quota_used', 0,
            'quota_limit', v_limit,
            'quota_remaining', 0
        );
END;
$$;


--
-- Name: create_commission_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_commission_transaction() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_category_name TEXT;
    v_subcategory TEXT;
    v_description TEXT;
BEGIN
    -- Map commission type to category name
    IF NEW.type = 'rental' THEN
        v_category_name := 'Rental Commissions';
        v_subcategory := 'Contract Commission';
        v_description := 'Kira komisyonu: ' || NEW.property_address;
    ELSIF NEW.type = 'sale' THEN
        v_category_name := 'Sale Commissions';
        v_subcategory := 'Property Sale';
        v_description := 'Satış komisyonu: ' || NEW.property_address;
    ELSE
        -- Unknown type - still create transaction with generic category
        v_category_name := 'Other Income';
        v_subcategory := 'Commission';
        v_description := 'Komisyon: ' || NEW.property_address;
    END IF;

    -- Skip if amount is zero or null
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
        RETURN NEW;
    END IF;

    -- Validate org_id exists
    IF NEW.org_id IS NULL THEN
        RAISE WARNING 'Cannot create financial transaction: org_id is NULL for commission %', NEW.id;
        RETURN NEW;
    END IF;

    -- Insert financial transaction linked to commission
    INSERT INTO financial_transactions (
        user_id,
        org_id,
        transaction_date,
        type,
        category,
        subcategory,
        amount,
        currency,
        description,
        notes,
        payment_method,
        payment_status,
        property_id,
        contract_id,
        commission_id
    ) VALUES (
        NEW.user_id,
        NEW.org_id,
        CURRENT_DATE,
        'income',
        v_category_name,
        v_subcategory,
        NEW.amount,
        COALESCE(NEW.currency, 'TRY'),
        v_description,
        NEW.notes,
        'bank_transfer',  -- Default payment method
        'completed',      -- Commission is earned when created
        NEW.property_id,
        NEW.contract_id,  -- Will be NULL for sale commissions
        NEW.id            -- Link back to commission
    );

    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION create_commission_transaction(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_commission_transaction() IS 'Automatically creates a financial_transaction record when a commission is inserted. Includes org_id support for multi-tenant architecture. Maps commission type to appropriate income category (Rental/Sale Commissions). Links transaction back to commission via commission_id for audit trail.';


--
-- Name: create_contract_atomic(jsonb, jsonb, jsonb, jsonb, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_contract_atomic(owner_data jsonb, tenant_data jsonb, property_data jsonb, contract_data jsonb, contract_details_data jsonb, user_id_param uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_owner_id uuid;
  v_tenant_id uuid;
  v_property_id uuid;
  v_contract_id uuid;
  v_contract_details_id uuid;
  v_result jsonb;
  v_owner_created boolean := false;
  v_tenant_created boolean := false;
  v_property_created boolean := false;
  v_org_id uuid;
BEGIN
  -- Security check
  IF user_id_param != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  -- Get org_id from org_members (user must be active owner)
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = user_id_param
    AND status = 'active'
    AND role = 'owner'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not an active owner of any organization';
  END IF;

  -- Validate required fields
  IF owner_data->>'name' IS NULL OR owner_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Owner data incomplete: name and tc_hash required';
  END IF;

  IF tenant_data->>'name' IS NULL OR tenant_data->>'tc_hash' IS NULL THEN
    RAISE EXCEPTION 'Tenant data incomplete: name and tc_hash required';
  END IF;

  IF property_data->>'normalized_address' IS NULL THEN
    RAISE EXCEPTION 'Property data incomplete: normalized_address required';
  END IF;

  -- STEP 1: Get or create owner (TC stored ENCRYPTED here)
  SELECT id INTO v_owner_id
  FROM property_owners
  WHERE tc_hash = owner_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    INSERT INTO property_owners (
      user_id, org_id, name, tc_encrypted, tc_hash, iban_encrypted, phone, email
    )
    VALUES (
      user_id_param,
      v_org_id,
      owner_data->>'name',
      owner_data->>'tc_encrypted',
      owner_data->>'tc_hash',
      owner_data->>'iban_encrypted',
      owner_data->>'phone',
      owner_data->>'email'
    )
    RETURNING id INTO v_owner_id;
    v_owner_created := true;
  ELSE
    UPDATE property_owners
    SET
      phone = owner_data->>'phone',
      email = owner_data->>'email',
      iban_encrypted = owner_data->>'iban_encrypted',
      updated_at = now()
    WHERE id = v_owner_id;
  END IF;

  -- STEP 2: Get or create tenant (TC stored ENCRYPTED here)
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE tc_hash = tenant_data->>'tc_hash'
    AND user_id = user_id_param
    AND org_id = v_org_id
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (
      user_id, org_id, name, tc_encrypted, tc_hash, phone, email, address
    )
    VALUES (
      user_id_param,
      v_org_id,
      tenant_data->>'name',
      tenant_data->>'tc_encrypted',
      tenant_data->>'tc_hash',
      tenant_data->>'phone',
      tenant_data->>'email',
      tenant_data->>'address'
    )
    RETURNING id INTO v_tenant_id;
    v_tenant_created := true;
  ELSE
    UPDATE tenants
    SET
      address = tenant_data->>'address',
      phone = tenant_data->>'phone',
      email = tenant_data->>'email',
      updated_at = now()
    WHERE id = v_tenant_id;
  END IF;

  -- STEP 3: Get or create property
  SELECT p.id INTO v_property_id
  FROM properties p
  WHERE p.normalized_address = property_data->>'normalized_address'
    AND p.owner_id = v_owner_id
    AND p.user_id = user_id_param
    AND p.org_id = v_org_id
  LIMIT 1;

  IF v_property_id IS NULL THEN
    INSERT INTO properties (
      user_id, org_id, owner_id, mahalle, cadde_sokak, bina_no, daire_no,
      ilce, il, full_address, normalized_address, type, use_purpose,
      address, status
    )
    VALUES (
      user_id_param,
      v_org_id,
      v_owner_id,
      property_data->>'mahalle',
      property_data->>'cadde_sokak',
      property_data->>'bina_no',
      property_data->>'daire_no',
      property_data->>'ilce',
      property_data->>'il',
      property_data->>'full_address',
      property_data->>'normalized_address',
      COALESCE(property_data->>'type', 'apartment'),
      property_data->>'use_purpose',
      property_data->>'full_address',
      'Occupied'
    )
    RETURNING id INTO v_property_id;
    v_property_created := true;
  ELSE
    UPDATE properties
    SET status = 'Occupied', updated_at = now()
    WHERE id = v_property_id;
  END IF;

  -- STEP 4: Archive any existing active contracts for this property
  UPDATE contracts
  SET status = 'Archived', updated_at = now()
  WHERE property_id = v_property_id
    AND status = 'Active'
    AND user_id = user_id_param
    AND org_id = v_org_id;

  -- STEP 5: Create contract (WITH commission_amount support)
  INSERT INTO contracts (
    user_id, org_id, tenant_id, property_id, start_date, end_date,
    rent_amount, deposit, currency, status,
    rent_increase_reminder_enabled,
    commission_amount  -- NEW: Manual commission amount
  )
  VALUES (
    user_id_param,
    v_org_id,
    v_tenant_id,
    v_property_id,
    (contract_data->>'start_date')::date,
    (contract_data->>'end_date')::date,
    (contract_data->>'rent_amount')::numeric,
    (contract_data->>'deposit')::numeric,
    COALESCE((contract_data->>'currency')::text, 'TRY'),
    'Active',
    false,
    NULLIF((contract_data->>'commission_amount')::numeric, 0)  -- NEW: NULL if 0 or missing
  )
  RETURNING id INTO v_contract_id;

  -- STEP 6: Create contract details (WITHOUT plaintext TC/IBAN - SECURITY FIX)
  -- TC and IBAN are already stored ENCRYPTED in property_owners and tenants tables
  -- PDF generation uses form data directly (in-memory), not database
  IF contract_details_data IS NOT NULL AND contract_details_data::text != 'null' THEN
    INSERT INTO contract_details (
      contract_id,
      user_id,
      org_id,
      deposit_amount,
      deposit_currency,
      payment_day_of_month,
      payment_method,
      annual_rent,
      contract_duration_months,
      rent_increase_rate,
      usage_purpose,
      special_conditions,
      furniture_list,
      utilities_included
    )
    VALUES (
      v_contract_id,
      user_id_param,
      v_org_id,
      (contract_details_data->>'deposit_amount')::numeric,
      COALESCE(contract_details_data->>'deposit_currency', 'TRY'),
      (contract_details_data->>'payment_day_of_month')::integer,
      contract_details_data->>'payment_method',
      (contract_details_data->>'annual_rent')::numeric,
      (contract_details_data->>'contract_duration_months')::integer,
      (contract_details_data->>'rent_increase_rate')::numeric,
      contract_details_data->>'usage_purpose',
      contract_details_data->>'special_conditions',
      contract_details_data->'furniture_list',
      contract_details_data->'utilities_included'
    )
    RETURNING id INTO v_contract_details_id;
  END IF;

  -- STEP 7: Return result
  v_result := jsonb_build_object(
    'success', true,
    'owner_id', v_owner_id,
    'tenant_id', v_tenant_id,
    'property_id', v_property_id,
    'contract_id', v_contract_id,
    'contract_details_id', v_contract_details_id,
    'created_owner', v_owner_created,
    'created_tenant', v_tenant_created,
    'created_property', v_property_created,
    'message', 'Contract created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Contract creation failed: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION create_contract_atomic(owner_data jsonb, tenant_data jsonb, property_data jsonb, contract_data jsonb, contract_details_data jsonb, user_id_param uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_contract_atomic(owner_data jsonb, tenant_data jsonb, property_data jsonb, contract_data jsonb, contract_details_data jsonb, user_id_param uuid) IS 'Atomically creates/finds owner, tenant, property, and contract with org_id support for multi-tenant architecture. Supports manual commission override via commission_amount column. If commission_amount is NULL, commission trigger uses rent_amount (1 month rent). Requires user to be an active owner of an organization.';


--
-- Name: create_rental_commission(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_rental_commission() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_org_id UUID;
  v_commission_amount NUMERIC;
BEGIN
    -- Only create commission for active contracts with rent amount
    IF NEW.status = 'Active' AND NEW.rent_amount > 0 THEN
        -- Check if commission already exists for this contract
        IF NOT EXISTS (
            SELECT 1 FROM commissions
            WHERE contract_id = NEW.id AND type = 'rental'
        ) THEN
            -- Get org_id from contract (NEW.org_id) or fallback to property
            SELECT COALESCE(NEW.org_id, p.org_id) INTO v_org_id
            FROM properties p
            WHERE p.id = NEW.property_id
            LIMIT 1;
            
            -- Validate org_id exists
            IF v_org_id IS NULL THEN
                RAISE WARNING 'Cannot create commission: org_id not found for contract %', NEW.id;
                RETURN NEW;
            END IF;
            
            -- Calculate commission amount: manual if provided, else rent_amount
            v_commission_amount := COALESCE(NEW.commission_amount, NEW.rent_amount);
            
            -- Skip if commission amount is zero or negative
            IF v_commission_amount <= 0 THEN
                RETURN NEW;
            END IF;
            
            INSERT INTO commissions (
                property_id,
                contract_id,
                type,
                amount,              -- Uses calculated amount (manual or rent_amount)
                currency,
                property_address,
                notes,
                user_id,
                org_id
            )
            SELECT
                NEW.property_id,
                NEW.id,
                'rental',
                v_commission_amount, -- Manual commission or rent_amount fallback
                NEW.currency,
                p.address,
                CASE 
                    WHEN NEW.commission_amount IS NOT NULL THEN 
                        'Commission from rental contract (manual amount)'
                    ELSE 
                        'Commission from rental contract'
                END,
                (SELECT user_id FROM properties WHERE id = NEW.property_id LIMIT 1),
                v_org_id
            FROM properties p
            WHERE p.id = NEW.property_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION create_rental_commission(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_rental_commission() IS 'Automatically creates a rental commission when an active contract is created or updated. Supports manual commission override via commission_amount column. If commission_amount is NULL, uses rent_amount (1 month rent). Includes org_id support for multi-tenant architecture.';


--
-- Name: create_sale_commission(uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_sale_commission(p_property_id uuid, p_sale_price numeric, p_currency text DEFAULT 'TRY'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_commission_id UUID;
    v_commission_amount NUMERIC;
    v_property_address TEXT;
    v_property_user_id UUID;
    v_current_user_id UUID;
    v_commission_rate NUMERIC;
BEGIN
    -- Get current authenticated user
    v_current_user_id := auth.uid();

    -- Verify user is authenticated
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated. Please log in.';
    END IF;

    -- Get property details and verify ownership
    SELECT address, user_id
    INTO v_property_address, v_property_user_id
    FROM properties
    WHERE id = p_property_id;

    -- Check if property exists
    IF v_property_address IS NULL THEN
        RAISE EXCEPTION 'Property with id % not found', p_property_id;
    END IF;

    -- SECURITY CHECK: Verify current user owns the property
    IF v_property_user_id != v_current_user_id THEN
        RAISE EXCEPTION 'Access denied: You can only create sale commissions for your own properties';
    END IF;

    -- Check if sale commission already exists for this property
    IF EXISTS (
        SELECT 1 FROM commissions
        WHERE property_id = p_property_id AND type = 'sale'
    ) THEN
        RAISE EXCEPTION 'Sale commission already exists for property %', v_property_address;
    END IF;

    -- Get user's commission rate preference (default to 4.0% if not set)
    SELECT COALESCE(commission_rate, 4.0) INTO v_commission_rate
    FROM user_preferences
    WHERE user_id = v_current_user_id;

    -- If no user preferences exist, use default 4.0%
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 4.0;
    END IF;

    -- Calculate commission using user's rate
    v_commission_amount := p_sale_price * (v_commission_rate / 100);

    -- Insert commission record
    -- NOTE: This will trigger create_commission_transaction() automatically
    INSERT INTO commissions (
        user_id,
        property_id,
        type,
        amount,
        currency,
        property_address,
        notes
    ) VALUES (
        v_property_user_id,
        p_property_id,
        'sale',
        v_commission_amount,
        p_currency,
        v_property_address,
        format('Commission from property sale (%s%%)', v_commission_rate)
    )
    RETURNING id INTO v_commission_id;

    -- FIX: Update property status to 'Sold' (not 'Inactive')
    UPDATE properties
    SET
        status = 'Sold',
        sold_at = timezone('utc'::text, now()),
        sold_price = p_sale_price
    WHERE id = p_property_id
      AND user_id = v_current_user_id;  -- Security check on update

    RETURN v_commission_id;
END;
$$;


--
-- Name: FUNCTION create_sale_commission(p_property_id uuid, p_sale_price numeric, p_currency text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_sale_commission(p_property_id uuid, p_sale_price numeric, p_currency text) IS 'Creates a sale commission for a property and marks it as Sold.
Uses user''s commission rate preference (default 4.0%).
Automatically creates a financial_transaction via trigger.
Security: Only property owner can create commission.';


--
-- Name: create_user_billing_on_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_billing_on_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_billing (user_id, trial_start, trial_end)
  VALUES (
    NEW.id,
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION create_user_billing_on_signup(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_user_billing_on_signup() IS 'Automatically creates a user_billing record with 14-day trial when a new user signs up.
Triggered by INSERT on auth.users table.';


--
-- Name: generate_invitation_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invitation_token() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  -- Generate unique secure token (32 characters)
  LOOP
    -- Create random token using encode(gen_random_bytes)
    token := encode(gen_random_bytes(24), 'base64');
    -- Make URL-safe by replacing + and / with - and _
    token := replace(replace(token, '+', '-'), '/', '_');
    -- Remove padding
    token := rtrim(token, '=');
    
    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM public.org_invitations 
      WHERE invitation_token = token
    ) INTO token_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;


--
-- Name: FUNCTION generate_invitation_token(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.generate_invitation_token() IS 'Generates a unique, URL-safe random token for invitations';


--
-- Name: get_invitation_info(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_invitation_info(p_token text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'valid', true,
    'org_name', o.name,
    'org_logo', o.logo_url,
    'role', oi.role,
    'invited_by_name', (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = oi.invited_by),
    'invited_at', oi.invited_at,
    'expires_at', oi.expires_at,
    'expired', oi.expires_at < now()
  )
  INTO v_result
  FROM public.org_invitations oi
  JOIN public.organizations o ON o.id = oi.org_id
  WHERE oi.invitation_token = p_token
    AND oi.accepted_at IS NULL;
  
  IF v_result IS NULL THEN
    v_result := json_build_object('valid', false);
  END IF;
  
  RETURN v_result;
END;
$$;


--
-- Name: FUNCTION get_invitation_info(p_token text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_invitation_info(p_token text) IS 'Gets public information about an invitation (for showing on accept page)';


--
-- Name: get_invitation_with_inviter(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_invitation_with_inviter(p_invitation_id uuid) RETURNS json
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'invitation', json_build_object(
      'id', oi.id,
      'email', oi.email,
      'role', oi.role,
      'invitation_token', oi.invitation_token,
      'expires_at', oi.expires_at,
      'org_id', oi.org_id,
      'invited_by', oi.invited_by,
      'invited_at', oi.invited_at,
      'accepted_at', oi.accepted_at
    ),
    'organization', json_build_object(
      'id', o.id,
      'name', o.name,
      'logo_url', o.logo_url
    ),
    'inviter', CASE
      WHEN oi.invited_by IS NULL THEN NULL
      ELSE json_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', u.raw_user_meta_data->>'full_name'
      )
    END
  )
  INTO v_result
  FROM org_invitations oi
  JOIN organizations o ON o.id = oi.org_id
  LEFT JOIN auth.users u ON u.id = oi.invited_by
  WHERE oi.id = p_invitation_id;
  
  RETURN v_result;
END;
$$;


--
-- Name: FUNCTION get_invitation_with_inviter(p_invitation_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_invitation_with_inviter(p_invitation_id uuid) IS 'Returns invitation with organization and inviter details. SECURITY DEFINER to access auth.users. Used by Edge Functions for sending invitation emails.';


--
-- Name: get_org_members_with_users(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_org_members_with_users(p_org_id uuid) RETURNS TABLE(id uuid, org_id uuid, user_id uuid, role text, status text, invited_by uuid, invited_at timestamp with time zone, joined_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, user_email text, user_full_name text, user_avatar_url text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    om.id,
    om.org_id,
    om.user_id,
    om.role,
    om.status,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.created_at,
    om.updated_at,
    u.email AS user_email,
    u.raw_user_meta_data->>'full_name' AS user_full_name,
    u.raw_user_meta_data->>'avatar_url' AS user_avatar_url
  FROM org_members om
  LEFT JOIN auth.users u ON om.user_id = u.id
  WHERE om.org_id = p_org_id
    AND om.org_id IN (SELECT get_user_org_ids())  -- RLS check
  ORDER BY om.joined_at ASC;
$$;


--
-- Name: FUNCTION get_org_members_with_users(p_org_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_org_members_with_users(p_org_id uuid) IS 'Returns organization members with user details (email, name, avatar). SECURITY DEFINER to access auth.users.';


--
-- Name: get_quota(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_quota(p_user_id uuid DEFAULT NULL::uuid, p_device_id text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_today DATE;
    v_used INTEGER;
    v_limit INTEGER;
    v_is_premium BOOLEAN := false;
BEGIN
    -- Set device_id session for RLS
    IF p_device_id IS NOT NULL THEN
        PERFORM set_config('request.device_id', p_device_id, true);
    END IF;

    -- Validate inputs
    IF p_user_id IS NULL AND p_device_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Either user_id or device_id required',
            'quota_used', 0,
            'quota_limit', 3,
            'quota_remaining', 0
        );
    END IF;

    v_today := CURRENT_DATE;

    -- Check premium status
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE (
            (p_user_id IS NOT NULL AND user_id = p_user_id)
            OR (p_device_id IS NOT NULL AND device_id = p_device_id)
        )
        AND status = 'active'
        AND expires_at > NOW()
        AND status != 'cancelled'
    ) INTO v_is_premium;

    -- Premium users get unlimited quota
    IF v_is_premium THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_premium', true,
            'quota_used', 0,
            'quota_limit', 999999,
            'quota_remaining', 999999
        );
    END IF;

    -- Get or create daily quota record
    SELECT used, limit_value INTO v_used, v_limit
    FROM daily_quotas
    WHERE COALESCE(user_id::text, '') = COALESCE(p_user_id::text, '')
    AND COALESCE(device_id, '') = COALESCE(p_device_id, '')
    AND date = v_today;

    -- If no record exists, return default values
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_premium', false,
            'quota_used', 0,
            'quota_limit', 3,
            'quota_remaining', 3
        );
    END IF;

    -- ✅ FIX: Use COALESCE consistently (updated from 5 to 3)
    RETURN jsonb_build_object(
        'success', true,
        'is_premium', false,
        'quota_used', COALESCE(v_used, 0),
        'quota_limit', COALESCE(v_limit, 3),
        'quota_remaining', GREATEST(COALESCE(v_limit, 3) - COALESCE(v_used, 0), 0)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'quota_used', 0,
            'quota_limit', 3,
            'quota_remaining', 0
        );
END;
$$;


--
-- Name: get_team_performance(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_team_performance(p_org_id uuid, p_start_date date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_end_date date DEFAULT CURRENT_DATE) RETURNS json
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


--
-- Name: FUNCTION get_team_performance(p_org_id uuid, p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_team_performance(p_org_id uuid, p_start_date date, p_end_date date) IS 'Returns team performance metrics for organization owners. Includes summary totals, individual member stats, and trend data.';


--
-- Name: get_user_id_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_id_by_email(email_input text) RETURNS TABLE(id uuid, email text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT id, email
    FROM auth.users
    WHERE LOWER(email) = LOWER(email_input)
    LIMIT 1;
  $$;


--
-- Name: get_user_org_ids(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_org_ids() RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT org_id
  FROM org_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;


--
-- Name: FUNCTION get_user_org_ids(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_user_org_ids() IS 'Returns org_ids for the current authenticated user. SECURITY DEFINER to bypass RLS and prevent circular dependency.';


--
-- Name: handle_new_user_org(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_org() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Determine organization name from user metadata
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'My Agency'
  );

  -- Check if organization already exists for this user (by slug = user.id)
  SELECT id INTO new_org_id
  FROM public.organizations
  WHERE slug = NEW.id::text;

  -- If org doesn't exist, create it
  IF new_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, NEW.id::text)
    RETURNING id INTO new_org_id;
  END IF;

  -- Add user as owner of their organization (ON CONFLICT handles duplicates)
  INSERT INTO public.org_members (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now())
  ON CONFLICT (org_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: has_active_subscription(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_active_subscription(check_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = check_user_id
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  );
END;
$$;


--
-- Name: FUNCTION has_active_subscription(check_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.has_active_subscription(check_user_id uuid) IS 'Returns true if user has an active subscription';


--
-- Name: is_org_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_owner(check_org_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = check_org_id
      AND status = 'active'
      AND role = 'owner'
  );
$$;


--
-- Name: prevent_org_id_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_org_id_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'org_id cannot be changed. Current: %, Attempted: %', OLD.org_id, NEW.org_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_org_id_change(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_org_id_change() IS 'Prevents org_id from being modified. Used by all org-scoped tables.';


--
-- Name: prevent_update_if_deleted(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_update_if_deleted() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot update soft-deleted records. Record was deleted at: %', OLD.deleted_at
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_update_if_deleted(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_update_if_deleted() IS 'Prevents updates to soft-deleted records. Defense in depth with RLS.';


--
-- Name: rpc_create_contract_and_update_property(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_create_contract_and_update_property(p_contract jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_contract_id uuid;
  v_property_id uuid;
  v_status text;
  v_user_id uuid;
  v_org_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;

  -- Extract values we need
  v_property_id := nullif(p_contract->>'property_id','')::uuid;
  v_status := p_contract->>'status';

  -- Insert contract with user_id AND org_id
  INSERT INTO contracts (
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    status,
    notes,
    rent_increase_reminder_enabled,
    rent_increase_reminder_days,
    rent_increase_reminder_contacted,
    expected_new_rent,
    reminder_notes,
    currency,
    user_id,
    org_id
  ) VALUES (
    nullif(p_contract->>'tenant_id','')::uuid,
    v_property_id,
    (p_contract->>'start_date')::date,
    (p_contract->>'end_date')::date,
    nullif(p_contract->>'rent_amount','')::numeric,
    v_status,
    nullif(p_contract->>'notes',''),
    coalesce((p_contract->>'rent_increase_reminder_enabled')::boolean, false),
    coalesce((p_contract->>'rent_increase_reminder_days')::int, 90),
    coalesce((p_contract->>'rent_increase_reminder_contacted')::boolean, false),
    nullif(p_contract->>'expected_new_rent','')::numeric,
    nullif(p_contract->>'reminder_notes',''),
    coalesce(p_contract->>'currency', 'TRY'),
    v_user_id,
    v_org_id
  ) RETURNING id INTO v_contract_id;

  -- If new contract is Active, mark property as Occupied
  IF v_status = 'Active' THEN
    UPDATE properties
      SET status = 'Occupied'
      WHERE id = v_property_id
        AND org_id = v_org_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to update property status - property not found or access denied';
    END IF;
  END IF;

  -- Fetch and return the created contract as jsonb
  SELECT to_jsonb(c.*) INTO v_result
  FROM contracts c
  WHERE c.id = v_contract_id;

  RETURN v_result;
END;
$$;


--
-- Name: rpc_create_tenant_with_contract(jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_create_tenant_with_contract(p_tenant jsonb, p_contract jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DECLARE
    v_tenant_id uuid;
    v_contract_id uuid;
    v_property_id uuid;
    v_contract_status text;
    v_result jsonb;
    v_user_id uuid;
    v_org_id uuid;
  BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'User not authenticated.';
    END IF;

    -- Get org_id from org_members
    SELECT org_id INTO v_org_id
    FROM org_members
    WHERE user_id = v_user_id AND status = 'active'
    LIMIT 1;

    IF v_org_id IS NULL THEN
      RAISE EXCEPTION 'No active organization found.';
    END IF;

    v_property_id := (p_contract->>'property_id')::uuid;
    v_contract_status := p_contract->>'status';

    -- Create tenant with org_id
    INSERT INTO tenants (name, phone, email, notes, tc_hash, user_id, org_id)
    VALUES (
      p_tenant->>'name',
      p_tenant->>'phone',
      p_tenant->>'email',
      p_tenant->>'notes',
      p_tenant->>'tc_hash',
      v_user_id,
      v_org_id
    ) RETURNING id INTO v_tenant_id;

    -- Create contract with org_id
    INSERT INTO contracts (
      tenant_id, property_id, start_date, end_date, rent_amount, status, notes,
      rent_increase_reminder_enabled, rent_increase_reminder_days,
      rent_increase_reminder_contacted, expected_new_rent, reminder_notes,
      currency, user_id, org_id
    ) VALUES (
      v_tenant_id, v_property_id,
      (p_contract->>'start_date')::date,
      (p_contract->>'end_date')::date,
      NULLIF(p_contract->>'rent_amount','')::numeric,
      COALESCE(p_contract->>'status', 'Active'),
      p_contract->>'notes',
      COALESCE((p_contract->>'rent_increase_reminder_enabled')::boolean, false),
      COALESCE((p_contract->>'rent_increase_reminder_days')::int, 90),
      false,
      NULLIF(p_contract->>'expected_new_rent','')::numeric,
      p_contract->>'reminder_notes',
      COALESCE(p_contract->>'currency', 'TRY'),
      v_user_id,
      v_org_id
    ) RETURNING id INTO v_contract_id;

    -- Update property if Active
    IF v_contract_status = 'Active' THEN
      UPDATE properties SET status = 'Occupied', updated_at = NOW()
      WHERE id = v_property_id AND org_id = v_org_id;
    END IF;

    RETURN jsonb_build_object(
      'tenant_id', v_tenant_id,
      'contract_id', v_contract_id,
      'property_id', v_property_id,
      'success', true
    );
  EXCEPTION
    WHEN OTHERS THEN RAISE;
  END;
  $$;


--
-- Name: rpc_delete_contract(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_delete_contract(p_contract_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_contract public.contracts;
  v_active_contracts_count int;
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- ✅ Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;
  
  -- ✅ Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;
  
  -- ✅ Get contract AND validate it belongs to user's org
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only contracts from user's org
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied: %', p_contract_id;
  END IF;
  
  -- ✅ Delete the contract with org_id validation
  DELETE FROM public.contracts 
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only delete contracts from user's org
  
  -- If deleted contract was Active, check if property should be set to Empty
  IF v_contract.status = 'Active' THEN
    -- Check if property has any other active contracts (from same org)
    SELECT COUNT(*) INTO v_active_contracts_count
    FROM public.contracts
    WHERE property_id = v_contract.property_id
      AND status = 'Active'
      AND org_id = v_org_id;  -- ✅ Security check: only count contracts from same org
    
    -- If no active contracts remain, set property to Empty
    IF v_active_contracts_count = 0 THEN
      UPDATE public.properties
      SET status = 'Empty',
          updated_at = NOW()
      WHERE id = v_contract.property_id
        AND org_id = v_org_id;  -- ✅ Security check: only update properties from user's org
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'property_id', v_contract.property_id);
END;
$$;


--
-- Name: rpc_property_photo_delete(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_property_photo_delete(p_property_id uuid, p_photo_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_file_path text;
begin
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: property_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    file_path text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rpc_property_photo_insert(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_property_photo_insert(p_property_id uuid, p_file_path text) RETURNS public.property_photos
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_count integer;
  v_next integer;
  v_row public.property_photos;
begin
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


--
-- Name: rpc_property_photos_reorder(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_property_photos_reorder(p_property_id uuid, p_photo_ids uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
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


--
-- Name: rpc_rollback_tenant_with_contract(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_rollback_tenant_with_contract(p_tenant_id uuid, p_contract_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_property_id uuid;
  v_user_id uuid;
  v_org_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;

  -- Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;

  -- Get property_id before deleting contract
  SELECT property_id INTO v_property_id
  FROM contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied';
  END IF;

  -- Delete contract first (due to foreign key constraints)
  DELETE FROM contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;

  -- Delete tenant
  DELETE FROM tenants
  WHERE id = p_tenant_id
    AND org_id = v_org_id;

  -- Reset property status to Empty if we had updated it
  IF v_property_id IS NOT NULL THEN
    UPDATE properties
    SET status = 'Empty',
        updated_at = NOW()
    WHERE id = v_property_id
      AND org_id = v_org_id;
  END IF;

  v_result := jsonb_build_object(
    'tenant_deleted', p_tenant_id,
    'contract_deleted', p_contract_id,
    'property_reset', v_property_id,
    'success', true
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in rpc_rollback_tenant_with_contract: %', SQLERRM;
    RAISE;
END;
$$;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    property_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    rent_amount numeric(10,2),
    status text DEFAULT 'Active'::text NOT NULL,
    contract_pdf_path text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rent_increase_reminder_enabled boolean DEFAULT false,
    rent_increase_reminder_days integer DEFAULT 90,
    rent_increase_reminder_contacted boolean DEFAULT false,
    expected_new_rent numeric(10,2),
    reminder_notes text,
    currency text,
    user_id uuid NOT NULL,
    deposit numeric(10,2),
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    commission_amount numeric(10,2),
    CONSTRAINT valid_contract_status CHECK ((status = ANY (ARRAY['Active'::text, 'Archived'::text, 'Inactive'::text]))),
    CONSTRAINT valid_date_range CHECK ((end_date > start_date))
);


--
-- Name: COLUMN contracts.deposit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contracts.deposit IS 'Security deposit amount';


--
-- Name: COLUMN contracts.commission_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contracts.commission_amount IS 'Manual commission amount. If NULL, commission trigger uses rent_amount (1 month rent). If provided, commission trigger uses this value instead of rent_amount.';


--
-- Name: rpc_update_contract_status(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_update_contract_status(p_contract_id uuid, p_new_status text) RETURNS public.contracts
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_contract public.contracts;
  v_old_status text;
  v_active_contracts_count int;
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- ✅ Get authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated. Please log in.';
  END IF;
  
  -- ✅ Get user's active org_id
  SELECT org_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND status = 'active'
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No active organization found for user.';
  END IF;
  
  -- ✅ Get contract AND validate it belongs to user's org
  SELECT * INTO v_contract 
  FROM public.contracts 
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only contracts from user's org
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied: %', p_contract_id;
  END IF;
  
  v_old_status := v_contract.status;
  
  -- ✅ Update contract with org_id validation
  UPDATE public.contracts
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_contract_id
    AND org_id = v_org_id;  -- ✅ Security check: only update contracts from user's org
  
  -- ✅ Get updated contract
  SELECT * INTO v_contract
  FROM public.contracts
  WHERE id = p_contract_id
    AND org_id = v_org_id;
  
  -- If contract was Active and new status is not Active, check property status
  IF v_old_status = 'Active' AND p_new_status != 'Active' THEN
    -- Check if property has any other active contracts (from same org)
    SELECT COUNT(*) INTO v_active_contracts_count
    FROM public.contracts
    WHERE property_id = v_contract.property_id
      AND status = 'Active'
      AND id != p_contract_id
      AND org_id = v_org_id;  -- ✅ Security check: only count contracts from same org
    
    -- If no active contracts remain, set property to Empty
    IF v_active_contracts_count = 0 THEN
      UPDATE public.properties
      SET status = 'Empty',
          updated_at = NOW()
      WHERE id = v_contract.property_id
        AND org_id = v_org_id;  -- ✅ Security check: only update properties from user's org
    END IF;
  END IF;
  
  -- If contract is being activated, set property to Occupied
  IF p_new_status = 'Active' AND v_old_status != 'Active' THEN
    -- Note: The unique index uniq_active_contract_per_property will prevent multiple active contracts
    -- Set property to Occupied
    UPDATE public.properties
    SET status = 'Occupied',
        updated_at = NOW()
    WHERE id = v_contract.property_id
      AND org_id = v_org_id;  -- ✅ Security check: only update properties from user's org
  END IF;
  
  RETURN v_contract;
END;
$$;


--
-- Name: seed_default_clause_templates(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seed_default_clause_templates(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Check if templates already exist for this user
  IF EXISTS (
    SELECT 1
    FROM contract_clause_templates
    WHERE user_id = p_user_id
    LIMIT 1
  ) THEN
    -- Templates already seeded, skip
    RAISE NOTICE 'Templates already exist for user %', p_user_id;
    RETURN;
  END IF;

  -- Note: Actual template seeding is done in the application layer
  -- (clausesService.seedTemplatesForUser) which reads from contractContent.ts
  -- This function just checks if seeding is needed

  RAISE NOTICE 'User % needs clause templates seeded (to be done in app layer)', p_user_id;
END;
$$;


--
-- Name: FUNCTION seed_default_clause_templates(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.seed_default_clause_templates(p_user_id uuid) IS 'Checks if user needs template seeding. Actual seeding is done in application layer (clausesService.seedTemplatesForUser) which reads default clauses from contractContent.ts and inserts 33 templates (13 GENEL_SARTLAR + 19 OZEL_SARTLAR + 1 TAHLIYE_TAAHHUTNAMESI).';


--
-- Name: set_initial_next_due_date(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_initial_next_due_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If next_due_date is not provided, set it to start_date
  IF NEW.next_due_date IS NULL THEN
    NEW.next_due_date := NEW.start_date;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: update_financial_transactions_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_financial_transactions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_recurring_expenses_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_recurring_expenses_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: user_has_active_access(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_active_access(user_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  billing_record RECORD;
BEGIN
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


--
-- Name: FUNCTION user_has_active_access(user_uuid uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_active_access(user_uuid uuid) IS 'Checks if a user has active access based on trial period or subscription status.
Returns true if:
  - User is in trial and trial_end has not passed, OR
  - User has active subscription and current_period_end has not passed, OR
  - User canceled subscription but still has access until period_end.
Returns false otherwise.';


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    contract_id uuid,
    type text NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    property_address text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid NOT NULL,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT commissions_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT commissions_type_check CHECK ((type = ANY (ARRAY['rental'::text, 'sale'::text])))
);


--
-- Name: consent_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    version text DEFAULT 'v1.0'::text NOT NULL,
    categories jsonb NOT NULL,
    user_id uuid,
    session_id text NOT NULL,
    user_agent text,
    language text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT consent_logs_language_check CHECK ((language = ANY (ARRAY['tr'::text, 'en'::text])))
);


--
-- Name: TABLE consent_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.consent_logs IS 'Stores user cookie consent decisions for GDPR/KVKK compliance. Records must be retained for 5 years minimum.';


--
-- Name: COLUMN consent_logs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.id IS 'Primary key - unique identifier for each consent record';


--
-- Name: COLUMN consent_logs."timestamp"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs."timestamp" IS 'When the consent decision was made (ISO 8601 timestamp)';


--
-- Name: COLUMN consent_logs.version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.version IS 'Version of the consent banner/implementation (e.g., "v1.0")';


--
-- Name: COLUMN consent_logs.categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.categories IS 'JSONB object storing consent for each category: {essential: true, analytics: boolean, marketing: boolean}';


--
-- Name: COLUMN consent_logs.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.user_id IS 'Foreign key to auth.users - NULL for anonymous users, populated if user is authenticated';


--
-- Name: COLUMN consent_logs.session_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.session_id IS 'Unique session identifier for tracking consent across page loads';


--
-- Name: COLUMN consent_logs.user_agent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.user_agent IS 'Browser user agent string for debugging and analytics';


--
-- Name: COLUMN consent_logs.language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.language IS 'Language in which consent was given: "tr" (Turkish) or "en" (English)';


--
-- Name: COLUMN consent_logs.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.consent_logs.created_at IS 'Database record creation timestamp';


--
-- Name: contract_clause_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_clause_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contract_id uuid NOT NULL,
    user_id uuid NOT NULL,
    clause_type text NOT NULL,
    clause_index integer NOT NULL,
    custom_content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT contract_clause_overrides_clause_index_check CHECK ((clause_index >= 0)),
    CONSTRAINT contract_clause_overrides_clause_type_check CHECK ((clause_type = ANY (ARRAY['GENEL_SARTLAR'::text, 'OZEL_SARTLAR'::text, 'TAHLIYE_TAAHHUTNAMESI'::text])))
);


--
-- Name: TABLE contract_clause_overrides; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contract_clause_overrides IS 'Per-contract clause customizations. When a user edits a clause for a specific contract, the customized text is stored here. During PDF generation, overrides take precedence over templates.';


--
-- Name: COLUMN contract_clause_overrides.custom_content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_clause_overrides.custom_content IS 'Customized clause text. Still supports template variables ({{paymentDay}}, etc.) which are replaced at PDF generation time.';


--
-- Name: contract_clause_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_clause_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    clause_type text NOT NULL,
    clause_index integer NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT contract_clause_templates_clause_index_check CHECK ((clause_index >= 0)),
    CONSTRAINT contract_clause_templates_clause_type_check CHECK ((clause_type = ANY (ARRAY['GENEL_SARTLAR'::text, 'OZEL_SARTLAR'::text, 'TAHLIYE_TAAHHUTNAMESI'::text])))
);


--
-- Name: TABLE contract_clause_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contract_clause_templates IS 'Default clause templates per user (seeded from contractContent.ts). Each user has their own set of 33 templates (13 GENEL_SARTLAR + 19 OZEL_SARTLAR + 1 TAHLIYE_TAAHHUTNAMESI).';


--
-- Name: COLUMN contract_clause_templates.clause_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_clause_templates.clause_type IS 'Type of clause: GENEL_SARTLAR (general conditions), OZEL_SARTLAR (special conditions), or TAHLIYE_TAAHHUTNAMESI (eviction commitment)';


--
-- Name: COLUMN contract_clause_templates.clause_index; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_clause_templates.clause_index IS 'Zero-based position in array (e.g., 0-12 for GENEL_SARTLAR)';


--
-- Name: COLUMN contract_clause_templates.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_clause_templates.content IS 'Clause text. Supports template variables: {{paymentDay}}, {{ownerIBAN}}, {{ownerName}}, {{tenantName}}, {{contractDate}}';


--
-- Name: contract_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    contract_id uuid NOT NULL,
    deposit_amount numeric(10,2),
    deposit_currency text DEFAULT 'TRY'::text,
    payment_day_of_month integer DEFAULT 1,
    usage_purpose text DEFAULT 'Mesken'::text,
    contract_duration_months integer,
    rent_increase_rate numeric(5,2),
    furniture_list jsonb,
    special_conditions text,
    utilities_included jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_method text,
    annual_rent numeric(10,2),
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    handover_photos_url text,
    CONSTRAINT valid_deposit_amount CHECK (((deposit_amount IS NULL) OR (deposit_amount >= (0)::numeric))),
    CONSTRAINT valid_deposit_currency CHECK ((deposit_currency = ANY (ARRAY['TRY'::text, 'USD'::text, 'EUR'::text]))),
    CONSTRAINT valid_duration CHECK (((contract_duration_months IS NULL) OR (contract_duration_months > 0))),
    CONSTRAINT valid_increase_rate CHECK (((rent_increase_rate IS NULL) OR (rent_increase_rate >= (0)::numeric))),
    CONSTRAINT valid_payment_day CHECK (((payment_day_of_month >= 1) AND (payment_day_of_month <= 31)))
);


--
-- Name: TABLE contract_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contract_details IS 'Additional contract details for PDF generation';


--
-- Name: COLUMN contract_details.deposit_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.deposit_amount IS 'Security deposit amount';


--
-- Name: COLUMN contract_details.payment_day_of_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.payment_day_of_month IS 'Day of the month when rent is due (1-31)';


--
-- Name: COLUMN contract_details.usage_purpose; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.usage_purpose IS 'Purpose of rental: Mesken (residential), Ticari (commercial), Ofis (office)';


--
-- Name: COLUMN contract_details.furniture_list; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.furniture_list IS 'JSON array of furniture items: [{item, brand, condition, value}]';


--
-- Name: COLUMN contract_details.utilities_included; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.utilities_included IS 'JSON object of included utilities: {water, electricity, gas, internet, building_dues, heating}';


--
-- Name: COLUMN contract_details.payment_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.payment_method IS 'Payment method (cash, bank transfer, etc.)';


--
-- Name: COLUMN contract_details.annual_rent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.annual_rent IS 'Total annual rent amount';


--
-- Name: COLUMN contract_details.handover_photos_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_details.handover_photos_url IS 'Google Drive folder URL containing property condition photos before tenant handover. Used to generate QR code on contract PDF.';


--
-- Name: contract_instances_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_instances_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    template_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    rendered_content text NOT NULL,
    parties jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    signed_at timestamp with time zone,
    signed_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pdf_path text,
    CONSTRAINT contract_instances_v2_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'final'::text, 'signed'::text, 'archived'::text, 'cancelled'::text]))),
    CONSTRAINT contract_instances_v2_type_check CHECK ((type = ANY (ARRAY['sale'::text, 'rent'::text, 'commission'::text, 'showing'::text])))
);


--
-- Name: TABLE contract_instances_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contract_instances_v2 IS 'Actual contract instances with flexible JSONB form data';


--
-- Name: COLUMN contract_instances_v2.form_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_instances_v2.form_data IS 'JSONB field for flexible form data (seller, buyer, property, terms)';


--
-- Name: COLUMN contract_instances_v2.parties; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_instances_v2.parties IS 'JSONB field for party information (seller, buyer, landlord, tenant, agent)';


--
-- Name: COLUMN contract_instances_v2.pdf_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contract_instances_v2.pdf_path IS 'Supabase Storage path to generated PDF file';


--
-- Name: contract_templates_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_templates_v2 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    placeholders text[] DEFAULT '{}'::text[] NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contract_templates_v2_type_check CHECK ((type = ANY (ARRAY['sale'::text, 'rent'::text, 'commission'::text, 'showing'::text])))
);


--
-- Name: TABLE contract_templates_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contract_templates_v2 IS 'Reusable contract templates with placeholder variables';


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    rate_date date NOT NULL,
    from_currency character(3) NOT NULL,
    to_currency character(3) NOT NULL,
    rate numeric(18,8) NOT NULL,
    source character varying(50),
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT exchange_rates_check CHECK ((from_currency <> to_currency)),
    CONSTRAINT exchange_rates_rate_check CHECK ((rate > (0)::numeric))
);


--
-- Name: TABLE exchange_rates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.exchange_rates IS 'Daily exchange rate snapshots anchored to TRY. Rates represent units of target currency per 1 TRY.';


--
-- Name: COLUMN exchange_rates.rate_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exchange_rates.rate_date IS 'Date for which this rate is valid (used to match transaction dates)';


--
-- Name: COLUMN exchange_rates.rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exchange_rates.rate IS 'Exchange rate: 1 from_currency = rate to_currency (high precision for accuracy)';


--
-- Name: COLUMN exchange_rates.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exchange_rates.source IS 'Provider/source of the exchange rate (e.g., TCMB, ECB, openexchangerates)';


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    parent_category character varying(100),
    monthly_budget numeric(12,2),
    icon character varying(50),
    color character varying(20),
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid,
    deleted_at timestamp with time zone,
    CONSTRAINT check_default_no_user CHECK ((((is_default = true) AND (user_id IS NULL)) OR ((is_default = false) AND (user_id IS NOT NULL)))),
    CONSTRAINT expense_categories_monthly_budget_check CHECK ((monthly_budget >= (0)::numeric)),
    CONSTRAINT expense_categories_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[])))
);


--
-- Name: TABLE expense_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.expense_categories IS 'Defines income and expense categories for transaction classification';


--
-- Name: COLUMN expense_categories.monthly_budget; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expense_categories.monthly_budget IS 'Optional budget limit for expense categories';


--
-- Name: COLUMN expense_categories.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expense_categories.icon IS 'Lucide icon name for UI display';


--
-- Name: COLUMN expense_categories.color; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expense_categories.color IS 'Hex color code for charts and visual categorization';


--
-- Name: COLUMN expense_categories.is_default; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expense_categories.is_default IS 'True for system-provided categories (cannot be edited/deleted by users)';


--
-- Name: COLUMN expense_categories.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.expense_categories.is_active IS 'False to hide category from selection without deleting historical data';


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_transactions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    transaction_date date NOT NULL,
    type character varying(20) NOT NULL,
    category character varying(100) NOT NULL,
    subcategory character varying(100),
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'TRY'::character varying NOT NULL,
    description text NOT NULL,
    notes text,
    payment_method character varying(50),
    payment_status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    property_id uuid,
    contract_id uuid,
    commission_id uuid,
    receipt_url text,
    invoice_number character varying(100),
    is_recurring boolean DEFAULT false NOT NULL,
    recurring_frequency character varying(20),
    recurring_day integer,
    recurring_end_date date,
    parent_transaction_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT financial_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT financial_transactions_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['completed'::character varying, 'pending'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT financial_transactions_recurring_day_check CHECK (((recurring_day >= 1) AND (recurring_day <= 31))),
    CONSTRAINT financial_transactions_recurring_frequency_check CHECK (((recurring_frequency)::text = ANY ((ARRAY['monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::text[]))),
    CONSTRAINT financial_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying])::text[]))),
    CONSTRAINT valid_recurring_fields CHECK (((is_recurring = false) OR ((is_recurring = true) AND (recurring_frequency IS NOT NULL))))
);


--
-- Name: TABLE financial_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.financial_transactions IS 'Stores all income and expense transactions for lightweight accounting';


--
-- Name: COLUMN financial_transactions.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.financial_transactions.type IS 'Transaction type: income or expense';


--
-- Name: COLUMN financial_transactions.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.financial_transactions.category IS 'Main category (e.g., Rental Commissions, Office Rent, Marketing)';


--
-- Name: COLUMN financial_transactions.subcategory; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.financial_transactions.subcategory IS 'Optional subcategory for detailed tracking';


--
-- Name: COLUMN financial_transactions.payment_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.financial_transactions.payment_status IS 'Payment status: completed, pending, or cancelled';


--
-- Name: COLUMN financial_transactions.is_recurring; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.financial_transactions.is_recurring IS 'Whether this transaction repeats automatically';


--
-- Name: COLUMN financial_transactions.parent_transaction_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.financial_transactions.parent_transaction_id IS 'References the original recurring transaction if this was auto-generated';


--
-- Name: inquiry_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiry_matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inquiry_id uuid NOT NULL,
    property_id uuid NOT NULL,
    matched_at timestamp with time zone DEFAULT now(),
    notification_sent boolean DEFAULT false,
    contacted boolean DEFAULT false,
    user_id uuid NOT NULL,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title text,
    start_time timestamp with time zone NOT NULL,
    tenant_id uuid,
    property_id uuid,
    owner_id uuid,
    notes text,
    reminder_minutes integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: onboarding_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    step_number integer NOT NULL,
    step_name text NOT NULL,
    action_taken text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT onboarding_events_action_taken_check CHECK ((action_taken = ANY (ARRAY['completed'::text, 'skipped'::text, 'abandoned'::text])))
);


--
-- Name: TABLE onboarding_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.onboarding_events IS 'Tracks onboarding step completion for analytics';


--
-- Name: COLUMN onboarding_events.step_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_events.step_number IS 'Step number (1, 2, or 3)';


--
-- Name: COLUMN onboarding_events.step_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_events.step_name IS 'Step name: goal_selection, organization_setup, quick_start';


--
-- Name: COLUMN onboarding_events.action_taken; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_events.action_taken IS 'Action: completed, skipped, or abandoned';


--
-- Name: COLUMN onboarding_events.data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.onboarding_events.data IS 'Additional data stored as JSON (e.g., selected options)';


--
-- Name: org_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    invitation_token text NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_invitations_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text])))
);


--
-- Name: TABLE org_invitations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.org_invitations IS 'Pending organization invitations for users who have not registered yet';


--
-- Name: COLUMN org_invitations.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.org_invitations.email IS 'Email address of the invited user (case-insensitive, stored lowercase)';


--
-- Name: COLUMN org_invitations.invitation_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.org_invitations.invitation_token IS 'Secure random token for accepting invitation';


--
-- Name: COLUMN org_invitations.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.org_invitations.expires_at IS 'Invitation expiration time (default 7 days)';


--
-- Name: COLUMN org_invitations.accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.org_invitations.accepted_at IS 'Timestamp when invitation was accepted (NULL = pending)';


--
-- Name: org_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text]))),
    CONSTRAINT org_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text])))
);


--
-- Name: TABLE org_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.org_members IS 'User membership in organizations with role-based access';


--
-- Name: COLUMN org_members.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.org_members.role IS 'owner = full CRUD + invite, member = read-only';


--
-- Name: COLUMN org_members.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.org_members.status IS 'pending = invited, active = can access, suspended = blocked';


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    onboarding_completed boolean DEFAULT false,
    onboarding_completed_at timestamp with time zone,
    primary_use_case text,
    team_size_range text,
    onboarding_skipped boolean DEFAULT false,
    onboarding_skipped_at timestamp with time zone,
    onboarding_step integer DEFAULT 0
);


--
-- Name: TABLE organizations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.organizations IS 'Top-level tenant - represents a real estate agency';


--
-- Name: COLUMN organizations.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.slug IS 'URL-friendly identifier, uses user UUID for auto-created orgs';


--
-- Name: COLUMN organizations.onboarding_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.onboarding_completed IS 'Whether user has completed the onboarding flow';


--
-- Name: COLUMN organizations.primary_use_case; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.primary_use_case IS 'Primary use case selected in Step 1: properties, clients, contracts, team, all';


--
-- Name: COLUMN organizations.team_size_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.team_size_range IS 'Team size range selected in Step 2: 1, 2-5, 6-20, 21+';


--
-- Name: COLUMN organizations.onboarding_step; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.organizations.onboarding_step IS 'Tracks last completed onboarding step: 0 = none, 1 = step 1, 2 = step 2, 3 = step 3';


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    address text NOT NULL,
    city text,
    district text,
    status text DEFAULT 'Empty'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    listing_url text,
    rent_amount numeric,
    currency text DEFAULT 'USD'::text,
    sale_price numeric,
    sold_at timestamp with time zone,
    sold_price numeric,
    user_id uuid NOT NULL,
    property_type text DEFAULT 'rental'::text NOT NULL,
    buyer_name text,
    buyer_phone text,
    buyer_email text,
    offer_date timestamp with time zone,
    offer_amount numeric,
    mahalle text,
    cadde_sokak text,
    bina_no text,
    daire_no text,
    ilce text,
    il text,
    full_address text,
    normalized_address text,
    type text DEFAULT 'apartment'::text,
    use_purpose text,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT properties_currency_check CHECK ((currency = ANY (ARRAY['USD'::text, 'TRY'::text]))),
    CONSTRAINT properties_property_type_check CHECK ((property_type = ANY (ARRAY['rental'::text, 'sale'::text]))),
    CONSTRAINT valid_property_status CHECK ((status = ANY (ARRAY['Empty'::text, 'Occupied'::text, 'Inactive'::text, 'Available'::text, 'Under Offer'::text, 'Sold'::text])))
);


--
-- Name: COLUMN properties.listing_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.listing_url IS 'External listing URL (e.g., sahibinden.com link)';


--
-- Name: COLUMN properties.mahalle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.mahalle IS 'Mahalle (neighborhood)';


--
-- Name: COLUMN properties.cadde_sokak; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.cadde_sokak IS 'Cadde/Sokak (street/avenue)';


--
-- Name: COLUMN properties.bina_no; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.bina_no IS 'Bina numarası (building number)';


--
-- Name: COLUMN properties.daire_no; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.daire_no IS 'Daire numarası (apartment number)';


--
-- Name: COLUMN properties.ilce; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.ilce IS 'İlçe (district)';


--
-- Name: COLUMN properties.il; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.il IS 'İl (city/province)';


--
-- Name: COLUMN properties.full_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.full_address IS 'Generated full address for display';


--
-- Name: COLUMN properties.normalized_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.properties.normalized_address IS 'Normalized address for matching';


--
-- Name: property_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_inquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    preferred_city text,
    preferred_district text,
    min_rent_budget numeric,
    max_rent_budget numeric,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    inquiry_type text DEFAULT 'rental'::text NOT NULL,
    min_sale_budget numeric,
    max_sale_budget numeric,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT property_inquiries_inquiry_type_check CHECK ((inquiry_type = ANY (ARRAY['rental'::text, 'sale'::text]))),
    CONSTRAINT valid_inquiry_status CHECK ((status = ANY (ARRAY['active'::text, 'matched'::text, 'contacted'::text, 'converted'::text, 'closed'::text])))
);


--
-- Name: TABLE property_inquiries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.property_inquiries IS 'Property inquiries table with support for both rental and sale inquiries.
Use inquiry_type field to distinguish between rental and sale inquiries.';


--
-- Name: COLUMN property_inquiries.min_rent_budget; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_inquiries.min_rent_budget IS 'Minimum budget for rental properties (monthly rent)';


--
-- Name: COLUMN property_inquiries.max_rent_budget; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_inquiries.max_rent_budget IS 'Maximum budget for rental properties (monthly rent)';


--
-- Name: COLUMN property_inquiries.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_inquiries.status IS 'Status of inquiry: active, matched, contacted, converted, closed';


--
-- Name: COLUMN property_inquiries.inquiry_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_inquiries.inquiry_type IS 'Type of property inquiry: rental or sale';


--
-- Name: COLUMN property_inquiries.min_sale_budget; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_inquiries.min_sale_budget IS 'Minimum budget for sale properties (purchase price)';


--
-- Name: COLUMN property_inquiries.max_sale_budget; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_inquiries.max_sale_budget IS 'Maximum budget for sale properties (purchase price)';


--
-- Name: property_owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_owners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    address text,
    user_id uuid NOT NULL,
    tc_encrypted text,
    tc_hash text,
    iban_encrypted text,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: COLUMN property_owners.tc_encrypted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_owners.tc_encrypted IS 'AES-256-GCM encrypted TC Kimlik No';


--
-- Name: COLUMN property_owners.tc_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_owners.tc_hash IS 'SHA-256 hash of TC for lookups';


--
-- Name: COLUMN property_owners.iban_encrypted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.property_owners.iban_encrypted IS 'AES-256-GCM encrypted IBAN';


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'TRY'::character varying NOT NULL,
    frequency character varying(20) NOT NULL,
    day_of_month integer,
    start_date date NOT NULL,
    end_date date,
    next_due_date date NOT NULL,
    last_generated_date date,
    payment_method character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    auto_create_transaction boolean DEFAULT true NOT NULL,
    reminder_days_before integer DEFAULT 3,
    notes text,
    vendor_name character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT recurring_expenses_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT recurring_expenses_day_of_month_check CHECK (((day_of_month >= 1) AND (day_of_month <= 31))),
    CONSTRAINT recurring_expenses_frequency_check CHECK (((frequency)::text = ANY ((ARRAY['monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::text[]))),
    CONSTRAINT recurring_expenses_reminder_days_before_check CHECK ((reminder_days_before >= 0)),
    CONSTRAINT valid_end_date CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT valid_next_due_date CHECK ((next_due_date >= start_date))
);


--
-- Name: TABLE recurring_expenses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.recurring_expenses IS 'Tracks recurring bills and expenses for automatic transaction generation';


--
-- Name: COLUMN recurring_expenses.frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.frequency IS 'How often the expense recurs: monthly, quarterly, or yearly';


--
-- Name: COLUMN recurring_expenses.day_of_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.day_of_month IS 'Specific day of month for monthly recurrence (1-31)';


--
-- Name: COLUMN recurring_expenses.next_due_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.next_due_date IS 'Next date when this expense is due';


--
-- Name: COLUMN recurring_expenses.last_generated_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.last_generated_date IS 'Last date when a transaction was auto-created from this recurring expense';


--
-- Name: COLUMN recurring_expenses.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.is_active IS 'Set to false to pause recurring expense without deleting it';


--
-- Name: COLUMN recurring_expenses.auto_create_transaction; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.auto_create_transaction IS 'Whether to automatically generate transactions when due';


--
-- Name: COLUMN recurring_expenses.reminder_days_before; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.recurring_expenses.reminder_days_before IS 'Number of days before due date to send reminder (0 = day of)';


--
-- Name: stripe_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE stripe_customers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.stripe_customers IS 'Tracks Stripe customer IDs mapped to Supabase users';


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    stripe_subscription_id text NOT NULL,
    stripe_product_id text NOT NULL,
    stripe_price_id text NOT NULL,
    status text NOT NULL,
    currency text NOT NULL,
    "interval" text NOT NULL,
    amount integer NOT NULL,
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscriptions IS 'Stores Stripe subscription data for billing and access control';


--
-- Name: COLUMN subscriptions.stripe_product_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.stripe_product_id IS 'Used for feature access checks (same across all currencies)';


--
-- Name: COLUMN subscriptions.stripe_price_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.stripe_price_id IS 'Specific price ID for the currency/interval combination';


--
-- Name: COLUMN subscriptions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.status IS 'Stripe subscription status: active, canceled, past_due, trialing, incomplete, incomplete_expired, unpaid';


--
-- Name: COLUMN subscriptions.amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.amount IS 'Price in smallest currency unit (kuruş for TRY, cents for USD)';


--
-- Name: COLUMN subscriptions.cancel_at_period_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'True if user canceled but subscription still active until period end';


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid NOT NULL,
    tc_encrypted text,
    tc_hash text,
    address text,
    org_id uuid NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: COLUMN tenants.tc_encrypted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.tc_encrypted IS 'AES-256-GCM encrypted TC Kimlik No';


--
-- Name: COLUMN tenants.tc_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.tc_hash IS 'SHA-256 hash of TC for lookups';


--
-- Name: COLUMN tenants.address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tenants.address IS 'Tenant current address';


--
-- Name: user_billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_billing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan_id text DEFAULT 'pro_monthly'::text NOT NULL,
    plan_name text DEFAULT 'Pro Monthly'::text NOT NULL,
    billing_status text DEFAULT 'trial'::text NOT NULL,
    trial_start timestamp with time zone DEFAULT now() NOT NULL,
    trial_end timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    trial_used boolean DEFAULT false,
    subscription_start timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamp with time zone,
    payment_method_type text,
    last_payment_date timestamp with time zone,
    next_billing_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_billing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_billing IS 'Tracks billing status, subscriptions, and trial periods for each user';


--
-- Name: COLUMN user_billing.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.user_id IS 'Foreign key to auth.users - one billing record per user';


--
-- Name: COLUMN user_billing.stripe_customer_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.stripe_customer_id IS 'Stripe customer ID for payment processing';


--
-- Name: COLUMN user_billing.stripe_subscription_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.stripe_subscription_id IS 'Stripe subscription ID for recurring billing';


--
-- Name: COLUMN user_billing.plan_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.plan_id IS 'Current plan identifier: pro_monthly or pro_yearly';


--
-- Name: COLUMN user_billing.billing_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.billing_status IS 'Current billing status: trial, active, canceled, expired, or past_due';


--
-- Name: COLUMN user_billing.trial_start; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.trial_start IS 'When the 14-day free trial started';


--
-- Name: COLUMN user_billing.trial_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.trial_end IS 'When the 14-day free trial ends';


--
-- Name: COLUMN user_billing.current_period_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_billing.current_period_end IS 'When the current subscription period ends';


--
-- Name: user_onboarding_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_onboarding_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    org_id uuid NOT NULL,
    question_key text NOT NULL,
    answer jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE user_onboarding_responses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_onboarding_responses IS 'Stores user responses to onboarding survey questions for business intelligence.';


--
-- Name: COLUMN user_onboarding_responses.question_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_onboarding_responses.question_key IS 'Unique key for the onboarding question (e.g., goal, experience_level, referral_source)';


--
-- Name: COLUMN user_onboarding_responses.answer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_onboarding_responses.answer IS 'JSONB storage for the answer, supporting strings, arrays, or objects';


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL,
    language text DEFAULT 'tr'::text,
    currency text DEFAULT 'TRY'::text,
    meeting_reminder_minutes integer DEFAULT 30,
    full_name character varying(255),
    phone_number character varying(20),
    commission_rate numeric(5,2) DEFAULT 4.0,
    onboarding_banner_dismissed_at bigint,
    CONSTRAINT allowed_reminder_minutes CHECK ((meeting_reminder_minutes = ANY (ARRAY[30, 40, 60]))),
    CONSTRAINT commission_rate_range CHECK (((commission_rate >= 0.1) AND (commission_rate <= 20.0)))
);


--
-- Name: COLUMN user_preferences.full_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.full_name IS 'User''s full name for display in profile';


--
-- Name: COLUMN user_preferences.phone_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.phone_number IS 'User''s contact phone number';


--
-- Name: COLUMN user_preferences.commission_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.commission_rate IS 'Default commission rate as percentage (e.g., 4.0 for 4%). Used for sale commission calculations.';


--
-- Name: COLUMN user_preferences.onboarding_banner_dismissed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_preferences.onboarding_banner_dismissed_at IS 'Timestamp (milliseconds) when user dismissed the onboarding completion banner. Banner reappears after 7 days.';


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: consent_logs consent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_logs
    ADD CONSTRAINT consent_logs_pkey PRIMARY KEY (id);


--
-- Name: contract_clause_overrides contract_clause_overrides_contract_id_clause_type_clause_in_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_overrides
    ADD CONSTRAINT contract_clause_overrides_contract_id_clause_type_clause_in_key UNIQUE (contract_id, clause_type, clause_index);


--
-- Name: contract_clause_overrides contract_clause_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_overrides
    ADD CONSTRAINT contract_clause_overrides_pkey PRIMARY KEY (id);


--
-- Name: contract_clause_templates contract_clause_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_templates
    ADD CONSTRAINT contract_clause_templates_pkey PRIMARY KEY (id);


--
-- Name: contract_clause_templates contract_clause_templates_user_id_clause_type_clause_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_templates
    ADD CONSTRAINT contract_clause_templates_user_id_clause_type_clause_index_key UNIQUE (user_id, clause_type, clause_index);


--
-- Name: contract_details contract_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_details
    ADD CONSTRAINT contract_details_pkey PRIMARY KEY (id);


--
-- Name: contract_instances_v2 contract_instances_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_instances_v2
    ADD CONSTRAINT contract_instances_v2_pkey PRIMARY KEY (id);


--
-- Name: contract_templates_v2 contract_templates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates_v2
    ADD CONSTRAINT contract_templates_v2_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_rate_date_from_currency_to_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_rate_date_from_currency_to_currency_key UNIQUE (rate_date, from_currency, to_currency);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_user_id_name_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_user_id_name_type_key UNIQUE (user_id, name, type);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: inquiry_matches inquiry_matches_inquiry_id_property_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_matches
    ADD CONSTRAINT inquiry_matches_inquiry_id_property_id_key UNIQUE (inquiry_id, property_id);


--
-- Name: inquiry_matches inquiry_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_matches
    ADD CONSTRAINT inquiry_matches_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: onboarding_events onboarding_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_events
    ADD CONSTRAINT onboarding_events_pkey PRIMARY KEY (id);


--
-- Name: org_invitations org_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invitations
    ADD CONSTRAINT org_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: org_invitations org_invitations_org_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invitations
    ADD CONSTRAINT org_invitations_org_id_email_key UNIQUE (org_id, email);


--
-- Name: org_invitations org_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invitations
    ADD CONSTRAINT org_invitations_pkey PRIMARY KEY (id);


--
-- Name: org_members org_members_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- Name: org_members org_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_inquiries property_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_inquiries
    ADD CONSTRAINT property_inquiries_pkey PRIMARY KEY (id);


--
-- Name: property_owners property_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_owners
    ADD CONSTRAINT property_owners_pkey PRIMARY KEY (id);


--
-- Name: property_photos property_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_photos
    ADD CONSTRAINT property_photos_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: stripe_customers stripe_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_pkey PRIMARY KEY (id);


--
-- Name: stripe_customers stripe_customers_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: stripe_customers stripe_customers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_user_id_key UNIQUE (user_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: subscriptions subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: contract_details unique_contract_details; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_details
    ADD CONSTRAINT unique_contract_details UNIQUE (contract_id);


--
-- Name: user_billing user_billing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_billing
    ADD CONSTRAINT user_billing_pkey PRIMARY KEY (id);


--
-- Name: user_billing user_billing_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_billing
    ADD CONSTRAINT user_billing_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: user_billing user_billing_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_billing
    ADD CONSTRAINT user_billing_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: user_billing user_billing_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_billing
    ADD CONSTRAINT user_billing_user_id_key UNIQUE (user_id);


--
-- Name: user_onboarding_responses user_onboarding_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_responses
    ADD CONSTRAINT user_onboarding_responses_pkey PRIMARY KEY (id);


--
-- Name: user_onboarding_responses user_onboarding_responses_user_id_question_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_responses
    ADD CONSTRAINT user_onboarding_responses_user_id_question_key_key UNIQUE (user_id, question_key);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: contracts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_status_idx ON public.contracts USING btree (status);


--
-- Name: idx_clause_overrides_contract_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clause_overrides_contract_id ON public.contract_clause_overrides USING btree (contract_id);


--
-- Name: idx_clause_overrides_contract_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clause_overrides_contract_type ON public.contract_clause_overrides USING btree (contract_id, clause_type);


--
-- Name: idx_clause_overrides_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clause_overrides_user_id ON public.contract_clause_overrides USING btree (user_id);


--
-- Name: idx_clause_templates_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clause_templates_active ON public.contract_clause_templates USING btree (user_id, is_active) WHERE (is_active = true);


--
-- Name: idx_clause_templates_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clause_templates_user_id ON public.contract_clause_templates USING btree (user_id);


--
-- Name: idx_clause_templates_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clause_templates_user_type ON public.contract_clause_templates USING btree (user_id, clause_type);


--
-- Name: idx_commissions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_created_at ON public.commissions USING btree (created_at DESC);


--
-- Name: idx_commissions_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_not_deleted ON public.commissions USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_commissions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_org_id ON public.commissions USING btree (org_id);


--
-- Name: idx_commissions_org_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_org_user_date ON public.commissions USING btree (org_id, user_id, created_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_commissions_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_property_id ON public.commissions USING btree (property_id);


--
-- Name: idx_commissions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_type ON public.commissions USING btree (type);


--
-- Name: idx_commissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_user_id ON public.commissions USING btree (user_id);


--
-- Name: idx_consent_logs_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_logs_session_id ON public.consent_logs USING btree (session_id);


--
-- Name: idx_consent_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_logs_timestamp ON public.consent_logs USING btree ("timestamp");


--
-- Name: idx_consent_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consent_logs_user_id ON public.consent_logs USING btree (user_id);


--
-- Name: idx_contract_clause_overrides_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_clause_overrides_not_deleted ON public.contract_clause_overrides USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contract_clause_overrides_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_clause_overrides_org_id ON public.contract_clause_overrides USING btree (org_id);


--
-- Name: idx_contract_clause_templates_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_clause_templates_not_deleted ON public.contract_clause_templates USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contract_clause_templates_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_clause_templates_org_id ON public.contract_clause_templates USING btree (org_id);


--
-- Name: idx_contract_details_contract_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_details_contract_id ON public.contract_details USING btree (contract_id);


--
-- Name: idx_contract_details_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_details_not_deleted ON public.contract_details USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contract_details_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_details_org_id ON public.contract_details USING btree (org_id);


--
-- Name: idx_contract_details_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_details_user_id ON public.contract_details USING btree (user_id);


--
-- Name: idx_contract_instances_v2_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_instances_v2_created_at ON public.contract_instances_v2 USING btree (created_at DESC);


--
-- Name: idx_contract_instances_v2_form_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_instances_v2_form_data ON public.contract_instances_v2 USING gin (form_data);


--
-- Name: idx_contract_instances_v2_has_pdf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_instances_v2_has_pdf ON public.contract_instances_v2 USING btree (user_id, type) WHERE (pdf_path IS NOT NULL);


--
-- Name: idx_contract_instances_v2_parties; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_instances_v2_parties ON public.contract_instances_v2 USING gin (parties);


--
-- Name: idx_contract_instances_v2_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_instances_v2_status ON public.contract_instances_v2 USING btree (user_id, status);


--
-- Name: idx_contract_instances_v2_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_instances_v2_user_type ON public.contract_instances_v2 USING btree (user_id, type);


--
-- Name: idx_contract_templates_v2_is_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_templates_v2_is_default ON public.contract_templates_v2 USING btree (user_id, type, is_default) WHERE (is_default = true);


--
-- Name: idx_contract_templates_v2_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contract_templates_v2_user_type ON public.contract_templates_v2 USING btree (user_id, type);


--
-- Name: idx_contracts_commission_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_commission_amount ON public.contracts USING btree (commission_amount) WHERE (commission_amount IS NOT NULL);


--
-- Name: idx_contracts_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_not_deleted ON public.contracts USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contracts_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_org_id ON public.contracts USING btree (org_id);


--
-- Name: idx_contracts_tenant_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_tenant_status ON public.contracts USING btree (tenant_id, status, user_id) WHERE (status = 'Active'::text);


--
-- Name: idx_contracts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_user_id ON public.contracts USING btree (user_id);


--
-- Name: idx_contracts_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_user_status ON public.contracts USING btree (user_id, status);


--
-- Name: idx_contracts_user_status_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contracts_user_status_active ON public.contracts USING btree (user_id, org_id, status) WHERE ((deleted_at IS NULL) AND (status = 'Active'::text));


--
-- Name: idx_exchange_rates_currencies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates USING btree (from_currency, to_currency);


--
-- Name: idx_exchange_rates_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_lookup ON public.exchange_rates USING btree (rate_date DESC, from_currency, to_currency);


--
-- Name: idx_expense_categories_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_not_deleted ON public.expense_categories USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_expense_categories_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_org_id ON public.expense_categories USING btree (org_id);


--
-- Name: idx_expense_categories_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_type ON public.expense_categories USING btree (type, is_default);


--
-- Name: idx_expense_categories_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_user_type ON public.expense_categories USING btree (user_id, type, is_active);


--
-- Name: idx_financial_transactions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_category ON public.financial_transactions USING btree (category, type);


--
-- Name: idx_financial_transactions_commission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_commission ON public.financial_transactions USING btree (commission_id) WHERE (commission_id IS NOT NULL);


--
-- Name: idx_financial_transactions_contract; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_contract ON public.financial_transactions USING btree (contract_id) WHERE (contract_id IS NOT NULL);


--
-- Name: idx_financial_transactions_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_not_deleted ON public.financial_transactions USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_financial_transactions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_org_id ON public.financial_transactions USING btree (org_id);


--
-- Name: idx_financial_transactions_property; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_property ON public.financial_transactions USING btree (property_id) WHERE (property_id IS NOT NULL);


--
-- Name: idx_financial_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_type ON public.financial_transactions USING btree (type, payment_status);


--
-- Name: idx_financial_transactions_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_transactions_user_date ON public.financial_transactions USING btree (user_id, transaction_date DESC);


--
-- Name: idx_inquiries_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_active ON public.property_inquiries USING btree (status) WHERE (status = 'active'::text);


--
-- Name: idx_inquiries_active_rental; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_active_rental ON public.property_inquiries USING btree (inquiry_type, status) WHERE ((inquiry_type = 'rental'::text) AND (status = 'active'::text));


--
-- Name: idx_inquiries_active_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_active_sale ON public.property_inquiries USING btree (inquiry_type, status) WHERE ((inquiry_type = 'sale'::text) AND (status = 'active'::text));


--
-- Name: idx_inquiries_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_city ON public.property_inquiries USING btree (preferred_city);


--
-- Name: idx_inquiries_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_district ON public.property_inquiries USING btree (preferred_district);


--
-- Name: idx_inquiries_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_status ON public.property_inquiries USING btree (status);


--
-- Name: idx_inquiries_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_type ON public.property_inquiries USING btree (inquiry_type);


--
-- Name: idx_inquiries_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_type_status ON public.property_inquiries USING btree (inquiry_type, status);


--
-- Name: idx_inquiries_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiries_user_status ON public.property_inquiries USING btree (user_id, status);


--
-- Name: idx_inquiry_matches_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiry_matches_not_deleted ON public.inquiry_matches USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_inquiry_matches_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiry_matches_org_id ON public.inquiry_matches USING btree (org_id);


--
-- Name: idx_inquiry_matches_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inquiry_matches_user_id ON public.inquiry_matches USING btree (user_id);


--
-- Name: idx_matches_inquiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_inquiry ON public.inquiry_matches USING btree (inquiry_id);


--
-- Name: idx_matches_notification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_notification ON public.inquiry_matches USING btree (notification_sent) WHERE (notification_sent = false);


--
-- Name: idx_matches_property; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_property ON public.inquiry_matches USING btree (property_id);


--
-- Name: idx_meetings_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_not_deleted ON public.meetings USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_meetings_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_org_id ON public.meetings USING btree (org_id);


--
-- Name: idx_meetings_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_owner_id ON public.meetings USING btree (owner_id);


--
-- Name: idx_meetings_property_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_property_id ON public.meetings USING btree (property_id);


--
-- Name: idx_meetings_start_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_start_time ON public.meetings USING btree (start_time);


--
-- Name: idx_meetings_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_tenant_id ON public.meetings USING btree (tenant_id);


--
-- Name: idx_meetings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_meetings_user_id ON public.meetings USING btree (user_id);


--
-- Name: idx_onboarding_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_created_at ON public.onboarding_events USING btree (created_at);


--
-- Name: idx_onboarding_events_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_org_id ON public.onboarding_events USING btree (org_id);


--
-- Name: idx_onboarding_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_events_user_id ON public.onboarding_events USING btree (user_id);


--
-- Name: idx_onboarding_responses_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_responses_org_id ON public.user_onboarding_responses USING btree (org_id);


--
-- Name: idx_onboarding_responses_org_question; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_responses_org_question ON public.user_onboarding_responses USING btree (org_id, question_key);


--
-- Name: INDEX idx_onboarding_responses_org_question; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_onboarding_responses_org_question IS 'Composite index for querying responses by organization and question key (analytics queries)';


--
-- Name: idx_onboarding_responses_question_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_responses_question_key ON public.user_onboarding_responses USING btree (question_key);


--
-- Name: idx_onboarding_responses_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_responses_user ON public.user_onboarding_responses USING btree (user_id);


--
-- Name: INDEX idx_onboarding_responses_user; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_onboarding_responses_user IS 'Index for querying all responses for a specific user';


--
-- Name: idx_onboarding_responses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_responses_user_id ON public.user_onboarding_responses USING btree (user_id);


--
-- Name: idx_org_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_invitations_email ON public.org_invitations USING btree (email);


--
-- Name: idx_org_invitations_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_invitations_expires ON public.org_invitations USING btree (expires_at) WHERE (accepted_at IS NULL);


--
-- Name: idx_org_invitations_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_invitations_org_id ON public.org_invitations USING btree (org_id);


--
-- Name: idx_org_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_invitations_token ON public.org_invitations USING btree (invitation_token);


--
-- Name: idx_org_members_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_org_id ON public.org_members USING btree (org_id);


--
-- Name: idx_org_members_org_role_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_org_role_status ON public.org_members USING btree (org_id, role, status);


--
-- Name: idx_org_members_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_status ON public.org_members USING btree (status);


--
-- Name: idx_org_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_user_id ON public.org_members USING btree (user_id);


--
-- Name: idx_org_members_user_role_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_user_role_status ON public.org_members USING btree (user_id, role, status) WHERE (status = 'active'::text);


--
-- Name: idx_org_members_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_user_status ON public.org_members USING btree (user_id, status);


--
-- Name: idx_organizations_onboarding_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_onboarding_completed ON public.organizations USING btree (onboarding_completed) WHERE (onboarding_completed = false);


--
-- Name: idx_organizations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);


--
-- Name: idx_owners_tc_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owners_tc_hash ON public.property_owners USING btree (tc_hash);


--
-- Name: idx_properties_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_not_deleted ON public.properties USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_properties_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_org_id ON public.properties USING btree (org_id);


--
-- Name: idx_properties_rental_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_rental_status ON public.properties USING btree (property_type, status) WHERE (property_type = 'rental'::text);


--
-- Name: idx_properties_sale_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_sale_status ON public.properties USING btree (property_type, status) WHERE (property_type = 'sale'::text);


--
-- Name: idx_properties_status_city_district; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_status_city_district ON public.properties USING btree (status, city, district) WHERE (status = 'Empty'::text);


--
-- Name: idx_properties_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_type ON public.properties USING btree (property_type);


--
-- Name: idx_properties_type_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_type_status ON public.properties USING btree (property_type, status);


--
-- Name: idx_properties_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_user_id ON public.properties USING btree (user_id);


--
-- Name: idx_properties_user_id_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_user_id_org_id ON public.properties USING btree (user_id, org_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_properties_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_properties_user_status ON public.properties USING btree (user_id, status);


--
-- Name: idx_property_inquiries_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_inquiries_not_deleted ON public.property_inquiries USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_property_inquiries_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_inquiries_org_id ON public.property_inquiries USING btree (org_id);


--
-- Name: idx_property_inquiries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_inquiries_user_id ON public.property_inquiries USING btree (user_id);


--
-- Name: idx_property_owners_name_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_owners_name_user ON public.property_owners USING btree (lower(name), user_id);


--
-- Name: idx_property_owners_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_owners_not_deleted ON public.property_owners USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_property_owners_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_owners_org_id ON public.property_owners USING btree (org_id);


--
-- Name: idx_property_owners_tc_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_owners_tc_hash ON public.property_owners USING btree (tc_hash, user_id) WHERE (tc_hash IS NOT NULL);


--
-- Name: idx_property_owners_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_property_owners_user_id ON public.property_owners USING btree (user_id);


--
-- Name: idx_recurring_expenses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses USING btree (category, is_active);


--
-- Name: idx_recurring_expenses_next_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_next_due ON public.recurring_expenses USING btree (next_due_date, is_active) WHERE (is_active = true);


--
-- Name: idx_recurring_expenses_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_not_deleted ON public.recurring_expenses USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_recurring_expenses_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_org_id ON public.recurring_expenses USING btree (org_id);


--
-- Name: idx_recurring_expenses_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recurring_expenses_user_active ON public.recurring_expenses USING btree (user_id, is_active);


--
-- Name: idx_stripe_customers_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_customers_stripe_customer_id ON public.stripe_customers USING btree (stripe_customer_id);


--
-- Name: idx_stripe_customers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers USING btree (user_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions USING btree (stripe_customer_id);


--
-- Name: idx_subscriptions_stripe_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_product_id ON public.subscriptions USING btree (stripe_product_id);


--
-- Name: idx_subscriptions_stripe_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: idx_tenants_name_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_name_user ON public.tenants USING btree (lower(name), user_id);


--
-- Name: idx_tenants_not_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_not_deleted ON public.tenants USING btree (id) WHERE (deleted_at IS NULL);


--
-- Name: idx_tenants_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_org_id ON public.tenants USING btree (org_id);


--
-- Name: idx_tenants_tc_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_tc_hash ON public.tenants USING btree (tc_hash);


--
-- Name: idx_tenants_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_user_id ON public.tenants USING btree (user_id);


--
-- Name: idx_user_billing_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_billing_period_end ON public.user_billing USING btree (current_period_end);


--
-- Name: idx_user_billing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_billing_status ON public.user_billing USING btree (billing_status);


--
-- Name: idx_user_billing_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_billing_stripe_customer_id ON public.user_billing USING btree (stripe_customer_id);


--
-- Name: idx_user_billing_stripe_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_billing_stripe_subscription_id ON public.user_billing USING btree (stripe_subscription_id);


--
-- Name: idx_user_billing_trial_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_billing_trial_end ON public.user_billing USING btree (trial_end);


--
-- Name: idx_user_billing_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_billing_user_id ON public.user_billing USING btree (user_id);


--
-- Name: properties_owner_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX properties_owner_id_idx ON public.properties USING btree (owner_id);


--
-- Name: property_photos_property_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX property_photos_property_id_idx ON public.property_photos USING btree (property_id);


--
-- Name: uniq_active_contract_per_property; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_active_contract_per_property ON public.contracts USING btree (property_id) WHERE (status = 'Active'::text);


--
-- Name: uniq_property_photo_order; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uniq_property_photo_order ON public.property_photos USING btree (property_id, sort_order);


--
-- Name: financial_transactions set_financial_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_financial_transactions_updated_at();


--
-- Name: recurring_expenses set_recurring_expense_next_due_date; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_recurring_expense_next_due_date BEFORE INSERT ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.set_initial_next_due_date();


--
-- Name: recurring_expenses set_recurring_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_recurring_expenses_updated_at BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.update_recurring_expenses_updated_at();


--
-- Name: user_onboarding_responses tr_user_onboarding_responses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_user_onboarding_responses_updated_at BEFORE UPDATE ON public.user_onboarding_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commissions trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: contract_clause_overrides trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.contract_clause_overrides FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: contract_clause_templates trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.contract_clause_templates FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: contract_details trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.contract_details FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: contracts trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: expense_categories trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: financial_transactions trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: inquiry_matches trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.inquiry_matches FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: meetings trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: properties trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: property_inquiries trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.property_inquiries FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: property_owners trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.property_owners FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: recurring_expenses trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: tenants trg_prevent_org_id_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_org_id_change BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.prevent_org_id_change();


--
-- Name: commissions trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: contract_clause_overrides trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.contract_clause_overrides FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: contract_clause_templates trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.contract_clause_templates FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: contract_details trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.contract_details FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: contracts trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: expense_categories trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: financial_transactions trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: inquiry_matches trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.inquiry_matches FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: meetings trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: properties trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: property_inquiries trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.property_inquiries FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: property_owners trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.property_owners FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: recurring_expenses trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.recurring_expenses FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: tenants trg_prevent_update_if_deleted; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_update_if_deleted BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_deleted();


--
-- Name: commissions trigger_commission_to_transaction; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_commission_to_transaction AFTER INSERT ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.create_commission_transaction();


--
-- Name: contracts trigger_create_rental_commission; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_rental_commission AFTER INSERT OR UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.create_rental_commission();


--
-- Name: contract_clause_overrides update_contract_clause_overrides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_clause_overrides_updated_at BEFORE UPDATE ON public.contract_clause_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contract_clause_templates update_contract_clause_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_clause_templates_updated_at BEFORE UPDATE ON public.contract_clause_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contract_details update_contract_details_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_details_updated_at BEFORE UPDATE ON public.contract_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contract_instances_v2 update_contract_instances_v2_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_instances_v2_updated_at BEFORE UPDATE ON public.contract_instances_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contract_templates_v2 update_contract_templates_v2_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contract_templates_v2_updated_at BEFORE UPDATE ON public.contract_templates_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contracts update_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: property_inquiries update_inquiries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.property_inquiries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: org_invitations update_org_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_org_invitations_updated_at BEFORE UPDATE ON public.org_invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: org_members update_org_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON public.org_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizations update_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: properties update_properties_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: property_owners update_property_owners_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_property_owners_updated_at BEFORE UPDATE ON public.property_owners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commissions commissions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: commissions commissions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: commissions commissions_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: consent_logs consent_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_logs
    ADD CONSTRAINT consent_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: contract_clause_overrides contract_clause_overrides_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_overrides
    ADD CONSTRAINT contract_clause_overrides_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_clause_overrides contract_clause_overrides_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_overrides
    ADD CONSTRAINT contract_clause_overrides_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: contract_clause_overrides contract_clause_overrides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_overrides
    ADD CONSTRAINT contract_clause_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contract_clause_templates contract_clause_templates_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_templates
    ADD CONSTRAINT contract_clause_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: contract_clause_templates contract_clause_templates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_clause_templates
    ADD CONSTRAINT contract_clause_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contract_details contract_details_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_details
    ADD CONSTRAINT contract_details_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_details contract_details_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_details
    ADD CONSTRAINT contract_details_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: contract_instances_v2 contract_instances_v2_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_instances_v2
    ADD CONSTRAINT contract_instances_v2_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates_v2(id) ON DELETE SET NULL;


--
-- Name: contract_instances_v2 contract_instances_v2_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_instances_v2
    ADD CONSTRAINT contract_instances_v2_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contract_templates_v2 contract_templates_v2_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates_v2
    ADD CONSTRAINT contract_templates_v2_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: contracts contracts_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contracts contracts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: expense_categories expense_categories_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: expense_categories expense_categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: financial_transactions financial_transactions_commission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_commission_id_fkey FOREIGN KEY (commission_id) REFERENCES public.commissions(id) ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: financial_transactions financial_transactions_parent_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_parent_transaction_id_fkey FOREIGN KEY (parent_transaction_id) REFERENCES public.financial_transactions(id) ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inquiry_matches inquiry_matches_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_matches
    ADD CONSTRAINT inquiry_matches_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.property_inquiries(id) ON DELETE CASCADE;


--
-- Name: inquiry_matches inquiry_matches_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_matches
    ADD CONSTRAINT inquiry_matches_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: inquiry_matches inquiry_matches_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_matches
    ADD CONSTRAINT inquiry_matches_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: inquiry_matches inquiry_matches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiry_matches
    ADD CONSTRAINT inquiry_matches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: meetings meetings_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: meetings meetings_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.property_owners(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: onboarding_events onboarding_events_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_events
    ADD CONSTRAINT onboarding_events_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: onboarding_events onboarding_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_events
    ADD CONSTRAINT onboarding_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: org_invitations org_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invitations
    ADD CONSTRAINT org_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: org_invitations org_invitations_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_invitations
    ADD CONSTRAINT org_invitations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: org_members org_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);


--
-- Name: org_members org_members_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: org_members org_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_members
    ADD CONSTRAINT org_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.property_owners(id) ON DELETE CASCADE;


--
-- Name: properties properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_inquiries property_inquiries_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_inquiries
    ADD CONSTRAINT property_inquiries_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: property_inquiries property_inquiries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_inquiries
    ADD CONSTRAINT property_inquiries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_owners property_owners_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_owners
    ADD CONSTRAINT property_owners_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: property_owners property_owners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_owners
    ADD CONSTRAINT property_owners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: property_photos property_photos_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_photos
    ADD CONSTRAINT property_photos_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: recurring_expenses recurring_expenses_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: recurring_expenses recurring_expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stripe_customers stripe_customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_customers
    ADD CONSTRAINT stripe_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


--
-- Name: tenants tenants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_billing user_billing_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_billing
    ADD CONSTRAINT user_billing_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_onboarding_responses user_onboarding_responses_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_responses
    ADD CONSTRAINT user_onboarding_responses_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_onboarding_responses user_onboarding_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_responses
    ADD CONSTRAINT user_onboarding_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: consent_logs Anyone can insert consent logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert consent logs" ON public.consent_logs FOR INSERT WITH CHECK (true);


--
-- Name: exchange_rates Anyone can read exchange rates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read exchange rates" ON public.exchange_rates FOR SELECT USING (true);


--
-- Name: contract_instances_v2 Users can delete their own instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own instances" ON public.contract_instances_v2 FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can delete their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: contract_templates_v2 Users can delete their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own templates" ON public.contract_templates_v2 FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: contract_instances_v2 Users can insert their own instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own instances" ON public.contract_instances_v2 FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: contract_templates_v2 Users can insert their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own templates" ON public.contract_templates_v2 FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_billing Users can update their own billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own billing" ON public.user_billing FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: contract_instances_v2 Users can update their own instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own instances" ON public.contract_instances_v2 FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: contract_templates_v2 Users can update their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own templates" ON public.contract_templates_v2 FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: consent_logs Users can view own consent logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own consent logs" ON public.consent_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: stripe_customers Users can view own customer record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own customer record" ON public.stripe_customers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_billing Users can view their own billing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own billing" ON public.user_billing FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: contract_instances_v2 Users can view their own instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own instances" ON public.contract_instances_v2 FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: contract_templates_v2 Users can view their own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own templates" ON public.contract_templates_v2 FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: consent_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_clause_overrides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_clause_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_clause_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_clause_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_details ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_instances_v2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_instances_v2 ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_templates_v2; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contract_templates_v2 ENABLE ROW LEVEL SECURITY;

--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

--
-- Name: exchange_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: expense_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: inquiry_matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inquiry_matches ENABLE ROW LEVEL SECURITY;

--
-- Name: meetings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_events onboarding_events_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_events_insert ON public.onboarding_events FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (org_id IN ( SELECT org_members.org_id
   FROM public.org_members
  WHERE ((org_members.user_id = auth.uid()) AND (org_members.status = 'active'::text))))));


--
-- Name: onboarding_events onboarding_events_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_events_select ON public.onboarding_events FOR SELECT USING ((org_id IN ( SELECT org_members.org_id
   FROM public.org_members
  WHERE ((org_members.user_id = auth.uid()) AND (org_members.status = 'active'::text)))));


--
-- Name: user_onboarding_responses onboarding_responses_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_responses_insert ON public.user_onboarding_responses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_onboarding_responses onboarding_responses_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_responses_select ON public.user_onboarding_responses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_onboarding_responses onboarding_responses_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY onboarding_responses_update ON public.user_onboarding_responses FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: commissions org_delete_commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_commissions ON public.commissions FOR DELETE USING (false);


--
-- Name: contract_clause_overrides org_delete_contract_clause_overrides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_contract_clause_overrides ON public.contract_clause_overrides FOR DELETE USING (false);


--
-- Name: contract_clause_templates org_delete_contract_clause_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_contract_clause_templates ON public.contract_clause_templates FOR DELETE USING (false);


--
-- Name: contract_details org_delete_contract_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_contract_details ON public.contract_details FOR DELETE USING (false);


--
-- Name: contracts org_delete_contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_contracts ON public.contracts FOR DELETE USING (false);


--
-- Name: expense_categories org_delete_expense_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_expense_categories ON public.expense_categories FOR DELETE USING (false);


--
-- Name: financial_transactions org_delete_financial_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_financial_transactions ON public.financial_transactions FOR DELETE USING (false);


--
-- Name: inquiry_matches org_delete_inquiry_matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_inquiry_matches ON public.inquiry_matches FOR DELETE USING (false);


--
-- Name: org_invitations org_delete_invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_invitations ON public.org_invitations FOR DELETE USING (((org_id IN ( SELECT org_members.org_id
   FROM public.org_members
  WHERE ((org_members.user_id = auth.uid()) AND (org_members.status = 'active'::text) AND (org_members.role = 'owner'::text)))) OR (auth.uid() IS NULL)));


--
-- Name: meetings org_delete_meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_meetings ON public.meetings FOR DELETE USING (false);


--
-- Name: org_members org_delete_org_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_org_members ON public.org_members FOR DELETE USING (public.is_org_owner(org_id));


--
-- Name: organizations org_delete_organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_organizations ON public.organizations FOR DELETE USING (false);


--
-- Name: property_inquiries org_delete_property_inquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_property_inquiries ON public.property_inquiries FOR DELETE USING (false);


--
-- Name: property_owners org_delete_property_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_property_owners ON public.property_owners FOR DELETE USING (false);


--
-- Name: property_photos org_delete_property_photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_property_photos ON public.property_photos FOR DELETE USING (false);


--
-- Name: recurring_expenses org_delete_recurring_expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_recurring_expenses ON public.recurring_expenses FOR DELETE USING (false);


--
-- Name: tenants org_delete_tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_delete_tenants ON public.tenants FOR DELETE USING (false);


--
-- Name: commissions org_insert_commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_commissions ON public.commissions FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contract_clause_overrides org_insert_contract_clause_overrides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_contract_clause_overrides ON public.contract_clause_overrides FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contract_clause_templates org_insert_contract_clause_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_contract_clause_templates ON public.contract_clause_templates FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contract_details org_insert_contract_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_contract_details ON public.contract_details FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contracts org_insert_contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_contracts ON public.contracts FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: expense_categories org_insert_expense_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_expense_categories ON public.expense_categories FOR INSERT WITH CHECK (((org_id IS NOT NULL) AND public.is_org_owner(org_id)));


--
-- Name: financial_transactions org_insert_financial_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_financial_transactions ON public.financial_transactions FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: inquiry_matches org_insert_inquiry_matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_inquiry_matches ON public.inquiry_matches FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: org_invitations org_insert_invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_invitations ON public.org_invitations FOR INSERT WITH CHECK ((org_id IN ( SELECT org_members.org_id
   FROM public.org_members
  WHERE ((org_members.user_id = auth.uid()) AND (org_members.status = 'active'::text) AND (org_members.role = 'owner'::text)))));


--
-- Name: meetings org_insert_meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_meetings ON public.meetings FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: org_members org_insert_org_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_org_members ON public.org_members FOR INSERT WITH CHECK (((auth.uid() IS NULL) OR public.is_org_owner(org_id)));


--
-- Name: organizations org_insert_organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_organizations ON public.organizations FOR INSERT WITH CHECK (false);


--
-- Name: properties org_insert_properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_properties ON public.properties FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: property_inquiries org_insert_property_inquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_property_inquiries ON public.property_inquiries FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: property_owners org_insert_property_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_property_owners ON public.property_owners FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: property_photos org_insert_property_photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_property_photos ON public.property_photos FOR INSERT TO authenticated WITH CHECK ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE ((properties.deleted_at IS NULL) AND public.is_org_owner(properties.org_id)))));


--
-- Name: recurring_expenses org_insert_recurring_expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_recurring_expenses ON public.recurring_expenses FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: tenants org_insert_tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_insert_tenants ON public.tenants FOR INSERT WITH CHECK (public.is_org_owner(org_id));


--
-- Name: org_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: org_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

--
-- Name: commissions org_select_commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_commissions ON public.commissions FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: contract_clause_overrides org_select_contract_clause_overrides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_contract_clause_overrides ON public.contract_clause_overrides FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: contract_clause_templates org_select_contract_clause_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_contract_clause_templates ON public.contract_clause_templates FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: contract_details org_select_contract_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_contract_details ON public.contract_details FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: contracts org_select_contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_contracts ON public.contracts FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: expense_categories org_select_expense_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_expense_categories ON public.expense_categories FOR SELECT USING (((deleted_at IS NULL) AND ((org_id IS NULL) OR (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)))));


--
-- Name: financial_transactions org_select_financial_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_financial_transactions ON public.financial_transactions FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: inquiry_matches org_select_inquiry_matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_inquiry_matches ON public.inquiry_matches FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: org_invitations org_select_invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_invitations ON public.org_invitations FOR SELECT USING ((org_id IN ( SELECT org_members.org_id
   FROM public.org_members
  WHERE ((org_members.user_id = auth.uid()) AND (org_members.status = 'active'::text) AND (org_members.role = 'owner'::text)))));


--
-- Name: meetings org_select_meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_meetings ON public.meetings FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: org_members org_select_org_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_org_members ON public.org_members FOR SELECT USING ((org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)));


--
-- Name: organizations org_select_organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_organizations ON public.organizations FOR SELECT USING ((id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)));


--
-- Name: properties org_select_properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_properties ON public.properties FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: property_inquiries org_select_property_inquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_property_inquiries ON public.property_inquiries FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: property_owners org_select_property_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_property_owners ON public.property_owners FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: property_photos org_select_property_photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_property_photos ON public.property_photos FOR SELECT USING ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE ((properties.deleted_at IS NULL) AND (properties.org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))))));


--
-- Name: recurring_expenses org_select_recurring_expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_recurring_expenses ON public.recurring_expenses FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: tenants org_select_tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_select_tenants ON public.tenants FOR SELECT USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids))));


--
-- Name: commissions org_update_commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_commissions ON public.commissions FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contract_clause_overrides org_update_contract_clause_overrides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_contract_clause_overrides ON public.contract_clause_overrides FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contract_clause_templates org_update_contract_clause_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_contract_clause_templates ON public.contract_clause_templates FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contract_details org_update_contract_details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_contract_details ON public.contract_details FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: contracts org_update_contracts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_contracts ON public.contracts FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: expense_categories org_update_expense_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_expense_categories ON public.expense_categories FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IS NOT NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (((org_id IS NOT NULL) AND public.is_org_owner(org_id)));


--
-- Name: financial_transactions org_update_financial_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_financial_transactions ON public.financial_transactions FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: inquiry_matches org_update_inquiry_matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_inquiry_matches ON public.inquiry_matches FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: org_invitations org_update_invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_invitations ON public.org_invitations FOR UPDATE USING (((org_id IN ( SELECT org_members.org_id
   FROM public.org_members
  WHERE ((org_members.user_id = auth.uid()) AND (org_members.status = 'active'::text) AND (org_members.role = 'owner'::text)))) OR (auth.uid() IS NULL)));


--
-- Name: meetings org_update_meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_meetings ON public.meetings FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: org_members org_update_org_members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_org_members ON public.org_members FOR UPDATE USING (public.is_org_owner(org_id));


--
-- Name: organizations org_update_organizations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_organizations ON public.organizations FOR UPDATE USING (((id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(id)));


--
-- Name: properties org_update_properties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_properties ON public.properties FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: property_inquiries org_update_property_inquiries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_property_inquiries ON public.property_inquiries FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: property_owners org_update_property_owners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_property_owners ON public.property_owners FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: property_photos org_update_property_photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_property_photos ON public.property_photos FOR UPDATE USING ((property_id IN ( SELECT properties.id
   FROM public.properties
  WHERE ((properties.deleted_at IS NULL) AND public.is_org_owner(properties.org_id)))));


--
-- Name: recurring_expenses org_update_recurring_expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_recurring_expenses ON public.recurring_expenses FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: tenants org_update_tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY org_update_tenants ON public.tenants FOR UPDATE USING (((deleted_at IS NULL) AND (org_id IN ( SELECT public.get_user_org_ids() AS get_user_org_ids)) AND public.is_org_owner(org_id))) WITH CHECK (public.is_org_owner(org_id));


--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: properties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

--
-- Name: property_inquiries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

--
-- Name: property_owners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

--
-- Name: property_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: recurring_expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: stripe_customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_billing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

--
-- Name: user_onboarding_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_onboarding_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

-- (psql-only \\unrestrict removed — not valid in SQL Editor / plain SQL)
