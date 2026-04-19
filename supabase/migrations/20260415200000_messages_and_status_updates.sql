-- Migration: messages table + A_COMPLETER status + realtime
-- Timestamp: 20260415200000

-- ============================================================
-- 1. EXTEND case_file_status ENUM WITH A_COMPLETER
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'A_COMPLETER'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'case_file_status')
  ) THEN
    ALTER TYPE public.case_file_status ADD VALUE 'A_COMPLETER';
  END IF;
END $$;

-- ============================================================
-- 2. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON public.messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. HELPER FUNCTION: is_staff
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'compliance', 'analyst')
  )
$$;

-- ============================================================
-- 6. RLS POLICIES — messages
-- ============================================================

-- Clients can read messages for their own cases
DROP POLICY IF EXISTS "clients_read_own_case_messages" ON public.messages;
CREATE POLICY "clients_read_own_case_messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_files cf
      WHERE cf.id = messages.case_id
        AND cf.user_id = auth.uid()
    )
    OR public.is_staff()
  );

-- Clients can insert messages for their own cases; staff can insert for any case
DROP POLICY IF EXISTS "clients_insert_own_case_messages" ON public.messages;
CREATE POLICY "clients_insert_own_case_messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.case_files cf
        WHERE cf.id = messages.case_id
          AND cf.user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 7. ENABLE REALTIME FOR MESSAGES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add messages to realtime publication: %', SQLERRM;
END $$;

-- Also enable realtime for case_files (status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'case_files'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.case_files;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add case_files to realtime publication: %', SQLERRM;
END $$;
