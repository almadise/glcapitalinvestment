-- ============================================================
-- Audit Log + Realtime Subscriptions Migration
-- ============================================================

-- 1. Create audit_logs table for full compliance auditability
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

-- 2. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff roles can read audit logs
CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'analyst', 'compliance')
  )
$$;

DROP POLICY IF EXISTS "staff_can_read_audit_logs" ON public.audit_logs;
CREATE POLICY "staff_can_read_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_staff_user());

DROP POLICY IF EXISTS "authenticated_can_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "authenticated_can_insert_audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid());

-- 3. Enable Supabase Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_internal_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
