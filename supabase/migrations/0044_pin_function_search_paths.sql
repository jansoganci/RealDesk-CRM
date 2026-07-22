-- Security Advisor remediation, P1: pin search_path on remaining functions
-- (function_search_path_mutable) + move pg_net out of the public schema
-- (extension_in_public). See docs/security/SUPABASE_ADVISOR_REMEDIATION_PLAN.md.
--
-- Pure hardening, no behavior change: ALTER FUNCTION here only sets a session
-- config parameter on each function, it does not touch the function body.
--
-- 6 functions already got `SET search_path` as part of 0043 (they were rewritten
-- there for ownership-check fixes) and are intentionally skipped here:
--   rpc_property_photo_insert, rpc_property_photo_delete, rpc_property_photos_reorder,
--   get_user_id_by_email, user_has_active_access, has_active_subscription

ALTER FUNCTION public.calculate_next_due_date(date, character varying, integer) SET search_path TO 'public';
ALTER FUNCTION public.consume_quota(uuid, text, uuid) SET search_path TO 'public';
ALTER FUNCTION public.create_commission_transaction() SET search_path TO 'public';
ALTER FUNCTION public.create_rental_commission() SET search_path TO 'public';
ALTER FUNCTION public.create_sale_commission(uuid, numeric, text) SET search_path TO 'public';
ALTER FUNCTION public.create_user_billing_on_signup() SET search_path TO 'public';
ALTER FUNCTION public.generate_invitation_token() SET search_path TO 'public';
ALTER FUNCTION public.get_invitation_info(text) SET search_path TO 'public';
ALTER FUNCTION public.get_quota(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.prevent_org_id_change() SET search_path TO 'public';
ALTER FUNCTION public.prevent_update_if_deleted() SET search_path TO 'public';
ALTER FUNCTION public.seed_default_clause_templates(uuid) SET search_path TO 'public';
ALTER FUNCTION public.set_initial_next_due_date() SET search_path TO 'public';
ALTER FUNCTION public.update_financial_transactions_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_recurring_expenses_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.sync_pipeline_stage() SET search_path TO 'public';

-- Not present in any tracked migration (schema drift vs. production) — signature
-- guessed as zero-arg trigger functions based on this repo's naming convention
-- (matches update_updated_at_column, set_initial_next_due_date, etc). If the guess
-- is wrong, this statement fails cleanly and the whole migration rolls back.
ALTER FUNCTION public.set_updated_at_applicant_screenings() SET search_path TO 'public';
ALTER FUNCTION public.update_security_deposit_tracker_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_data_subject_requests_updated_at() SET search_path TO 'public';

-- extension_in_public (pg_net) intentionally NOT handled here.
-- `ALTER EXTENSION pg_net SET SCHEMA extensions` fails with SQLSTATE 0A000
-- ("extension does not support SET SCHEMA") on this project's pg_net version.
-- The only real fix is DROP EXTENSION + CREATE EXTENSION pg_net SCHEMA extensions,
-- which would also drop pg_net's internal queue tables — risky if the project
-- uses Supabase Dashboard "Database Webhooks" (implemented via pg_net triggers
-- that live in the DB, not in this repo, so not verifiable from source alone).
-- See docs/security/SUPABASE_ADVISOR_REMEDIATION_PLAN.md P1.2 for the follow-up.
