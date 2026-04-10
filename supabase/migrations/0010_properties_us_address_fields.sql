-- Sprint 1 US foundation: add US address columns; rename TR district column for backward compatibility.
-- city already exists on properties — skip renaming il → city_legacy (keep il as legacy province).

-- US address fields
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS mls_id text,
  ADD COLUMN IF NOT EXISTS year_built integer;

-- ilce → district_legacy (district column remains for US use)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'ilce'
  ) THEN
    ALTER TABLE public.properties RENAME COLUMN ilce TO district_legacy;
  END IF;
END $$;

-- Legacy TR columns — TO BE DROPPED in Sprint 8 cleanup after all data migrated
COMMENT ON COLUMN public.properties.mahalle IS 'TO BE DROPPED in Sprint 8 cleanup after all data migrated';
COMMENT ON COLUMN public.properties.cadde_sokak IS 'TO BE DROPPED in Sprint 8 cleanup after all data migrated';
COMMENT ON COLUMN public.properties.bina_no IS 'TO BE DROPPED in Sprint 8 cleanup after all data migrated';
COMMENT ON COLUMN public.properties.daire_no IS 'TO BE DROPPED in Sprint 8 cleanup after all data migrated';

CREATE INDEX IF NOT EXISTS properties_state_idx ON public.properties USING btree (state);
CREATE INDEX IF NOT EXISTS properties_zip_code_idx ON public.properties USING btree (zip_code);
