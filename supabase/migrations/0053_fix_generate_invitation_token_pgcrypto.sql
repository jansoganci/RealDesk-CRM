-- Fix generate_invitation_token after 0044 pinned search_path to 'public'.
-- pgcrypto's gen_random_bytes lives in the extensions schema, so the unqualified
-- call failed at runtime with "function gen_random_bytes(integer) does not exist".
-- Qualify the call so the function keeps a tight search_path.

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- pgcrypto is installed in the extensions schema
    token := encode(extensions.gen_random_bytes(24), 'base64');
    token := replace(replace(token, '+', '-'), '/', '_');
    token := rtrim(token, '=');

    SELECT EXISTS(
      SELECT 1 FROM public.org_invitations
      WHERE invitation_token = token
    ) INTO token_exists;

    EXIT WHEN NOT token_exists;
  END LOOP;

  RETURN token;
END;
$$;

COMMENT ON FUNCTION public.generate_invitation_token() IS
  'Generates a unique, URL-safe random token for invitations (uses extensions.gen_random_bytes)';
