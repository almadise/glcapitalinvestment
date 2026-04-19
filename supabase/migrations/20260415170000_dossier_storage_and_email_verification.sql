-- ============================================================
-- GL Capital — Dossier Storage + Email Verification Migration
-- ============================================================

-- ── 1. DOSSIER DOCUMENTS TABLE ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.dossier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID REFERENCES public.dossiers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT '',
  doc_type TEXT DEFAULT '',
  scan_status TEXT DEFAULT 'pending',
  scan_passed BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dossier_documents_dossier_id ON public.dossier_documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_documents_user_id ON public.dossier_documents(user_id);

-- ── 2. EMAIL VERIFICATION TOKENS TABLE ─────────────────────
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);

-- ── 3. ADD email_verified TO user_profiles ─────────────────
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- ── 4. ENABLE RLS ──────────────────────────────────────────
ALTER TABLE public.dossier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS POLICIES — dossier_documents ────────────────────

-- Clients can manage their own documents
DROP POLICY IF EXISTS "clients_manage_own_documents" ON public.dossier_documents;
CREATE POLICY "clients_manage_own_documents"
ON public.dossier_documents FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Staff can read all documents
DROP POLICY IF EXISTS "staff_read_all_documents" ON public.dossier_documents;
CREATE POLICY "staff_read_all_documents"
ON public.dossier_documents FOR SELECT TO authenticated
USING (public.is_admin_from_auth());

-- ── 6. RLS POLICIES — email_verification_tokens ────────────

-- Users can read their own tokens
DROP POLICY IF EXISTS "users_read_own_verification_tokens" ON public.email_verification_tokens;
CREATE POLICY "users_read_own_verification_tokens"
ON public.email_verification_tokens FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Service role can insert tokens (used by edge function)
DROP POLICY IF EXISTS "service_insert_verification_tokens" ON public.email_verification_tokens;
CREATE POLICY "service_insert_verification_tokens"
ON public.email_verification_tokens FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own tokens (mark as used)
DROP POLICY IF EXISTS "users_update_own_verification_tokens" ON public.email_verification_tokens;
CREATE POLICY "users_update_own_verification_tokens"
ON public.email_verification_tokens FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ── 7. STORAGE BUCKET POLICIES (via SQL) ───────────────────
-- Note: Bucket creation is done via Supabase Dashboard or API.
-- The bucket name is: dossier-documents
-- These policies assume the bucket exists.

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "authenticated_upload_own_docs" ON storage.objects;
CREATE POLICY "authenticated_upload_own_docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dossier-documents'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow authenticated users to read their own files
DROP POLICY IF EXISTS "authenticated_read_own_docs" ON storage.objects;
CREATE POLICY "authenticated_read_own_docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dossier-documents'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- Allow staff (admin/analyst/compliance) to read all files
DROP POLICY IF EXISTS "staff_read_all_docs" ON storage.objects;
CREATE POLICY "staff_read_all_docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dossier-documents'
  AND public.is_admin_from_auth()
);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "authenticated_delete_own_docs" ON storage.objects;
CREATE POLICY "authenticated_delete_own_docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'dossier-documents'
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);
