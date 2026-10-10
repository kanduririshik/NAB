-- Fix Staff Portal Authentication and Credential Sync
-- 1. Helper to resolve staff auth email securely for login without exposing sensitive agent data or violating RLS
CREATE OR REPLACE FUNCTION public.get_staff_login_email(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_input text;
  v_clean text;
  v_email text;
BEGIN
  IF p_identifier IS NULL OR LENGTH(TRIM(p_identifier)) = 0 THEN
    RETURN NULL;
  END IF;

  v_input := TRIM(LOWER(p_identifier));
  v_clean := v_input;
  IF POSITION('@' IN v_clean) > 0 THEN
    v_clean := SPLIT_PART(v_clean, '@', 1);
  END IF;

  -- 1. Check delivery_agents matching username, email, employee_id, or username prefix
  SELECT u.email INTO v_email
  FROM public.delivery_agents da
  JOIN auth.users u ON u.id = da.id
  WHERE LOWER(da.username) = v_input
     OR LOWER(da.username) = v_clean
     OR LOWER(SPLIT_PART(da.username, '@', 1)) = v_clean
     OR LOWER(da.email) = v_input
     OR LOWER(da.employee_id) = v_input
     OR LOWER(u.email) = v_input
     OR LOWER(u.email) = (v_clean || '@nab.in')
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 2. Fallback check directly in auth.users for delivery_boy or staff role
  SELECT u.email INTO v_email
  FROM auth.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE (ur.role = 'delivery_boy' OR ur.role = 'staff')
    AND (
      LOWER(u.email) = v_input
      OR LOWER(u.email) = (v_clean || '@nab.in')
      OR LOWER(SPLIT_PART(u.email, '@', 1)) = v_clean
    )
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_login_email(text) TO anon, authenticated, service_role;

-- 2. Function to update delivery agent password & auth email without double-domain bugs
CREATE OR REPLACE FUNCTION public.admin_update_auth_user(
  p_user_id uuid,
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_clean_email text;
BEGIN
  IF p_password IS NOT NULL AND LENGTH(TRIM(p_password)) > 0 THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  IF p_email IS NOT NULL AND LENGTH(TRIM(p_email)) > 0 THEN
    v_clean_email := LOWER(TRIM(p_email));
    -- Normalize accidental double domain (e.g. user@domain.com@nab.in -> user@nab.in)
    IF v_clean_email LIKE '%@%@nab.in' THEN
      v_clean_email := SPLIT_PART(v_clean_email, '@', 1) || '@nab.in';
    END IF;

    UPDATE auth.users
    SET email = v_clean_email,
        updated_at = now()
    WHERE id = p_user_id;

    UPDATE auth.identities
    SET identity_data = jsonb_build_object('sub', p_user_id::text, 'email', v_clean_email),
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_auth_user(uuid, text, text) TO anon, authenticated, service_role;
