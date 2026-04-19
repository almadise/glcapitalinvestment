-- Migration: Fix profiles role constraint and harden user creation trigger
-- Timestamp: 20260415101200
-- Fixes: "Database error saving new user" caused by role check constraint violation

-- ============================================================
-- 1. DROP OLD ROLE CHECK CONSTRAINT AND ADD UPDATED ONE
-- ============================================================
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role = ANY (ARRAY[
  'admin'::text,
  'compliance'::text,
  'analyst'::text,
  'client'::text,
  'gestionnaire_contenu'::text
]));

-- ============================================================
-- 2. HARDEN THE TRIGGER FUNCTION
--    Safely defaults to 'client' for any unrecognized role value
--    so the trigger never fails and blocks auth.users INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_profile_on_user_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_valid_roles TEXT[] := ARRAY['admin', 'compliance', 'analyst', 'client', 'gestionnaire_contenu'];
BEGIN
  -- Extract role from metadata, default to 'client' if missing or invalid
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  IF NOT (v_role = ANY(v_valid_roles)) THEN
    v_role := 'client';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role,
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block user creation due to profile sync failure
    RAISE WARNING 'sync_profile_on_user_create failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_on_user_create();
