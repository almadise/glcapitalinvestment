-- Migration: Client Notifications + Saved Filter Presets
-- Timestamp: 20260414200000

-- ============================================================
-- 1. CLIENT NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('STATUS_UPDATE', 'ACTION_REQUIRED', 'COMPLIANCE_DECISION', 'DOCUMENT_REQUEST', 'GENERAL')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_case_id ON public.notifications(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- ============================================================
-- 2. SAVED FILTER PRESETS TABLE (for staff dashboards)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dashboard TEXT NOT NULL CHECK (dashboard IN ('analyst', 'compliance', 'admin')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON public.filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_dashboard ON public.filter_presets(dashboard);

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_presets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES - NOTIFICATIONS
-- ============================================================
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
-- 5. RLS POLICIES - FILTER PRESETS
-- ============================================================
DROP POLICY IF EXISTS "users_manage_own_filter_presets" ON public.filter_presets;
CREATE POLICY "users_manage_own_filter_presets"
ON public.filter_presets FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 6. REALTIME
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
