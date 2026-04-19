-- Migration: Real-time, audit logging, user management support
-- Timestamp: 20260414090000

-- ============================================================
-- 1. SUBMISSION AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.submission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.contact_submissions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submission_audit_logs_submission_id ON public.submission_audit_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_audit_logs_created_at ON public.submission_audit_logs(created_at DESC);

ALTER TABLE public.submission_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_submission_audit_logs" ON public.submission_audit_logs;
CREATE POLICY "admin_manage_submission_audit_logs"
  ON public.submission_audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ============================================================
-- 2. ERROR LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON public.error_logs(level);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_error_logs" ON public.error_logs;
CREATE POLICY "admin_read_error_logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

DROP POLICY IF EXISTS "authenticated_insert_error_logs" ON public.error_logs;
CREATE POLICY "authenticated_insert_error_logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_error_logs" ON public.error_logs;
CREATE POLICY "anon_insert_error_logs"
  ON public.error_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================
-- 3. ENABLE REALTIME ON KEY TABLES
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_status_history;

-- ============================================================
-- 4. PROFILES: ensure email column exists for user management
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 5. FUNCTION: sync profile email from auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_profile_on_user_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_on_user_create();

-- ============================================================
-- 6. RLS POLICIES — profiles: admin full access
-- ============================================================
DROP POLICY IF EXISTS "admin_full_access_profiles" ON public.profiles;
CREATE POLICY "admin_full_access_profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
