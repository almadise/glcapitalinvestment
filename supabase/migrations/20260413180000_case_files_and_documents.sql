-- Migration: case_files and documents tables with RLS
-- Timestamp: 20260413180000

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================
DROP TYPE IF EXISTS public.case_file_status CASCADE;
CREATE TYPE public.case_file_status AS ENUM ('RECU', 'EN_ANALYSE', 'ELIGIBLE', 'REJETE');

DROP TYPE IF EXISTS public.case_file_type CASCADE;
CREATE TYPE public.case_file_type AS ENUM ('Project', 'SBLC-BG', 'Other');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- case_files: REMOVED — full definition with all columns is in
-- migration 20260417070000_backoffice_governance_full_model.sql
-- (DROP TABLE IF EXISTS + CREATE TABLE with all required columns)
/*
CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.case_file_type NOT NULL DEFAULT 'Other'::public.case_file_type,
  status public.case_file_status NOT NULL DEFAULT 'RECU'::public.case_file_status,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
*/

-- documents: uploaded files metadata
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
-- case_files indexes moved to 20260417070000 migration
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================
-- case_files RLS enabled in 20260417070000 migration
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES — case_files
-- ============================================================
-- Moved to 20260417070000 migration

-- ============================================================
-- 6. RLS POLICIES — documents
-- ============================================================
DROP POLICY IF EXISTS "users_manage_own_documents" ON public.documents;
CREATE POLICY "users_manage_own_documents"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. STORAGE BUCKET: documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "users_upload_own_documents" ON storage.objects;
CREATE POLICY "users_upload_own_documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "users_read_own_documents" ON storage.objects;
CREATE POLICY "users_read_own_documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "users_delete_own_documents" ON storage.objects;
CREATE POLICY "users_delete_own_documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
