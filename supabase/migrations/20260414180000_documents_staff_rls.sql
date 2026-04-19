-- Migration: Staff RLS for documents + storage, and documents table enhancements
-- Timestamp: 20260414180000

-- ============================================================
-- 1. Enhance documents table with additional metadata
-- ============================================================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS file_type TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by_email TEXT;

-- ============================================================
-- 2. RLS Policies — allow staff (analyst, compliance, admin) to manage documents
-- ============================================================

-- Function to check staff role (analyst, compliance, admin)
CREATE OR REPLACE FUNCTION public.is_staff_role()
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

-- Staff can read all documents
DROP POLICY IF EXISTS "staff_read_all_documents" ON public.documents;
CREATE POLICY "staff_read_all_documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (public.is_staff_role() OR user_id = auth.uid());

-- Staff can insert documents for any case
DROP POLICY IF EXISTS "staff_insert_documents" ON public.documents;
CREATE POLICY "staff_insert_documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff_role() OR user_id = auth.uid());

-- Staff can delete documents
DROP POLICY IF EXISTS "staff_delete_documents" ON public.documents;
CREATE POLICY "staff_delete_documents"
  ON public.documents
  FOR DELETE
  TO authenticated
  USING (public.is_staff_role() OR user_id = auth.uid());

-- ============================================================
-- 3. Storage RLS — allow staff to upload to any case folder
-- ============================================================

-- Staff can upload to any path in documents bucket
DROP POLICY IF EXISTS "staff_upload_documents" ON storage.objects;
CREATE POLICY "staff_upload_documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND public.is_staff_role()
  );

-- Staff can read all documents in bucket
DROP POLICY IF EXISTS "staff_read_all_storage_documents" ON storage.objects;
CREATE POLICY "staff_read_all_storage_documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND public.is_staff_role()
  );

-- Staff can delete documents
DROP POLICY IF EXISTS "staff_delete_storage_documents" ON storage.objects;
CREATE POLICY "staff_delete_storage_documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND public.is_staff_role()
  );
