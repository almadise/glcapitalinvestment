-- Migration: Admin case management - status history, internal notes, admin RLS
-- Timestamp: 20260413200000

-- ============================================================
-- 1. ADD updated_at COLUMN TO case_files (if not exists)
-- ============================================================
ALTER TABLE public.case_files
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 2. CASE STATUS HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INTERNAL NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.case_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON public.case_status_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_status_history_created_at ON public.case_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_internal_notes_case_id ON public.case_internal_notes(case_id);

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================
ALTER TABLE public.case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_internal_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. ADMIN HELPER FUNCTION (using auth metadata)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (
    au.raw_user_meta_data->>'role' = 'admin'
    OR au.raw_app_meta_data->>'role' = 'admin'
  )
)
$$;

-- ============================================================
-- 7. RLS POLICIES — case_files: admin can read/update ALL rows
-- ============================================================
DROP POLICY IF EXISTS "admin_full_access_case_files" ON public.case_files;
CREATE POLICY "admin_full_access_case_files"
  ON public.case_files
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ============================================================
-- 8. RLS POLICIES — case_status_history
-- ============================================================
DROP POLICY IF EXISTS "admin_manage_case_status_history" ON public.case_status_history;
CREATE POLICY "admin_manage_case_status_history"
  ON public.case_status_history
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Clients can read their own case status history
DROP POLICY IF EXISTS "users_read_own_case_status_history" ON public.case_status_history;
CREATE POLICY "users_read_own_case_status_history"
  ON public.case_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_files cf
      WHERE cf.id = case_id AND cf.user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. RLS POLICIES — case_internal_notes (admin only)
-- ============================================================
DROP POLICY IF EXISTS "admin_manage_case_internal_notes" ON public.case_internal_notes;
CREATE POLICY "admin_manage_case_internal_notes"
  ON public.case_internal_notes
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ============================================================
-- 10. TRIGGER: auto-update updated_at on case_files
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_case_files_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_case_files_updated_at ON public.case_files;
CREATE TRIGGER trg_case_files_updated_at
  BEFORE UPDATE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_case_files_updated_at();
