-- Sprint 5 T2: commissions table extension
-- Adds US commission-tracking fields, supporting indexes, and guards against permissive RLS.

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS deal_id uuid,
  ADD COLUMN IF NOT EXISTS commission_side text,
  ADD COLUMN IF NOT EXISTS commission_type text,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,3),
  ADD COLUMN IF NOT EXISTS sale_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS gross_commission numeric(10,2),
  ADD COLUMN IF NOT EXISTS referral_fee_pct numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_fee_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_to text,
  ADD COLUMN IF NOT EXISTS post_referral_gci numeric(10,2),
  ADD COLUMN IF NOT EXISTS broker_split_pct numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS broker_dollar numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capped_at_close boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS franchise_fee_amount numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_fee numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eo_fee numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tc_fee numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_fees numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_commission numeric(10,2),
  ADD COLUMN IF NOT EXISTS closing_date date;

-- Optional details for custom per-deal costs can continue to use existing `notes`.

-- Idempotent: safe if a previous partial run or another migration already created these.
ALTER TABLE public.commissions
  DROP CONSTRAINT IF EXISTS commissions_deal_id_fkey;

ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES public.deals(id)
  ON DELETE SET NULL;

ALTER TABLE public.commissions
  DROP CONSTRAINT IF EXISTS commissions_commission_side_check;

ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_commission_side_check
  CHECK (commission_side IN ('listing', 'buyer', 'dual', 'rental_listing', 'rental_tenant'));

-- V1 scope explicitly excludes tiered commission type.
ALTER TABLE public.commissions
  DROP CONSTRAINT IF EXISTS commissions_commission_type_check;

ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_commission_type_check
  CHECK (commission_type IN ('percentage', 'flat_fee'));

CREATE INDEX IF NOT EXISTS commissions_deal_id_idx
  ON public.commissions(deal_id);

CREATE INDEX IF NOT EXISTS commissions_closing_date_idx
  ON public.commissions(closing_date);

CREATE INDEX IF NOT EXISTS commissions_user_ytd_idx
  ON public.commissions(user_id, closing_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS commissions_type_idx
  ON public.commissions(commission_side);

DO $$
DECLARE
  has_permissive_policy boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'commissions'
      AND (
        qual = 'true'
        OR qual = '(true)'
        OR with_check = 'true'
        OR with_check = '(true)'
      )
  )
  INTO has_permissive_policy;

  IF has_permissive_policy THEN
    DROP POLICY IF EXISTS org_select_commissions ON public.commissions;
    DROP POLICY IF EXISTS org_insert_commissions ON public.commissions;
    DROP POLICY IF EXISTS org_update_commissions ON public.commissions;
    DROP POLICY IF EXISTS org_delete_commissions ON public.commissions;

    CREATE POLICY org_select_commissions
      ON public.commissions
      FOR SELECT
      USING ((deleted_at IS NULL) AND (org_id IN (SELECT public.get_user_org_ids())));

    CREATE POLICY org_insert_commissions
      ON public.commissions
      FOR INSERT
      WITH CHECK (public.is_org_owner(org_id));

    CREATE POLICY org_update_commissions
      ON public.commissions
      FOR UPDATE
      USING ((deleted_at IS NULL) AND (org_id IN (SELECT public.get_user_org_ids())) AND public.is_org_owner(org_id))
      WITH CHECK (public.is_org_owner(org_id));

    CREATE POLICY org_delete_commissions
      ON public.commissions
      FOR DELETE
      USING (false);
  END IF;
END $$;
