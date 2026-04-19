-- ============================================================
-- Migration: audit_logs, notifications, error_logs tables
-- Timestamp: 20260419210000
-- ============================================================

-- ============================================================
-- 1. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  case_id UUID,
  actor_id UUID,
  actor_email TEXT,
  actor_name TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON public.audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function using user_profiles (not profiles)
CREATE OR REPLACE FUNCTION public.is_staff_user_v2()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'analyst', 'compliance')
  )
$$;

DROP POLICY IF EXISTS "staff_can_read_audit_logs" ON public.audit_logs;
CREATE POLICY "staff_can_read_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_staff_user_v2());

DROP POLICY IF EXISTS "authenticated_can_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "authenticated_can_insert_audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- ============================================================
-- 2. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  type TEXT NOT NULL CHECK (type IN ('STATUS_UPDATE', 'ACTION_REQUIRED', 'COMPLIANCE_DECISION', 'DOCUMENT_REQUEST', 'GENERAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON public.notifications(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_archived ON public.notifications(archived);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
CREATE POLICY "users_read_own_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
CREATE POLICY "users_update_own_notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "staff_insert_notifications" ON public.notifications;
CREATE POLICY "staff_insert_notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "users_delete_own_notifications" ON public.notifications;
CREATE POLICY "users_delete_own_notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 3. ERROR LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info')) DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_logs_level ON public.error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_can_read_error_logs" ON public.error_logs;
CREATE POLICY "staff_can_read_error_logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (public.is_staff_user_v2());

DROP POLICY IF EXISTS "authenticated_can_insert_error_logs" ON public.error_logs;
CREATE POLICY "authenticated_can_insert_error_logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_can_insert_error_logs" ON public.error_logs;
CREATE POLICY "anon_can_insert_error_logs"
ON public.error_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================
-- 4. REALTIME
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'error_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.error_logs;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  END IF;
END $$;
