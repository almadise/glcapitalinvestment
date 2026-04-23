-- ================================================================
-- MIGRATION: supabase/migrations/20260413161557_contact_submissions.sql
-- ================================================================
-- Contact form submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet TEXT NOT NULL,
  societe TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  pays TEXT NOT NULL,
  montant_projet TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public contact form)
DROP POLICY IF EXISTS "allow_public_insert_contact_submissions" ON public.contact_submissions;
CREATE POLICY "allow_public_insert_contact_submissions"
  ON public.contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users (admins) can read submissions
DROP POLICY IF EXISTS "allow_authenticated_select_contact_submissions" ON public.contact_submissions;
CREATE POLICY "allow_authenticated_select_contact_submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);


-- ================================================================
-- MIGRATION: supabase/migrations/20260413180000_case_files_and_documents.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260413200000_admin_case_management.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260414090000_realtime_audit_users.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260414100000_notification_prefs.sql
-- ================================================================
-- Add notification_prefs JSONB column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN notification_prefs JSONB DEFAULT '{"realtime_alerts": true, "email_notifications": true}'::jsonb;
  END IF;
END $$;


-- ================================================================
-- MIGRATION: supabase/migrations/20260414160000_backoffice_workflow.sql
-- ================================================================
-- Migration: Back-office workflow, governance, quality
-- Timestamp: 20260414160000

-- ============================================================
-- 1. EXTEND case_files WITH FULL 10-STATUS WORKFLOW + FIELDS
-- ============================================================

-- Add new columns to case_files
ALTER TABLE public.case_files
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS closure_reason TEXT,
  ADD COLUMN IF NOT EXISTS risk_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_analyst UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_compliance UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- 2. EXTEND case_internal_notes WITH AUTHOR INFO + VERSION
-- ============================================================
ALTER TABLE public.case_internal_notes
  ADD COLUMN IF NOT EXISTS author_email TEXT,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- 3. EXTEND case_status_history WITH CHANGED_BY_EMAIL
-- ============================================================
ALTER TABLE public.case_status_history
  ADD COLUMN IF NOT EXISTS changed_by_email TEXT,
  ADD COLUMN IF NOT EXISTS changed_by_name TEXT;

-- ============================================================
-- 4. RISK TAGS TABLE (categorized)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.risk_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('pays', 'secteur', 'sanctions', 'incoherences', 'autre')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default risk tags
INSERT INTO public.risk_tags (name, category, description) VALUES
  ('Pays à risque élevé', 'pays', 'Pays classifié à risque élevé GAFI'),
  ('Pays sous sanctions', 'pays', 'Pays soumis à des sanctions internationales'),
  ('Secteur sensible', 'secteur', 'Secteur d''activité à surveillance renforcée'),
  ('Secteur non éligible', 'secteur', 'Secteur exclu des critères de financement'),
  ('Sanctions OFAC', 'sanctions', 'Entité ou personne listée OFAC'),
  ('Sanctions UE', 'sanctions', 'Entité ou personne listée UE'),
  ('Incohérence documentaire', 'incoherences', 'Documents présentant des incohérences'),
  ('Incohérence financière', 'incoherences', 'Données financières incohérentes'),
  ('PEP détecté', 'autre', 'Personne politiquement exposée identifiée'),
  ('Structure opaque', 'autre', 'Structure juridique peu transparente')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 5. PARTNERS TABLE (confidentiel back-office)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banque', 'fonds', 'courtier_instrument', 'avocat', 'consultant', 'autre')),
  zones TEXT[] DEFAULT '{}',
  criteria TEXT,
  internal_contact TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. PARTNER SUBMISSION JOURNAL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'SOUMIS' CHECK (status IN ('SOUMIS', 'RETOUR', 'ACCEPTE', 'REFUSE')),
  notes TEXT,
  response_notes TEXT,
  responded_at TIMESTAMPTZ
);

-- ============================================================
-- 7. CONTENT MANAGEMENT TABLE (Gestionnaire contenu)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_fr TEXT NOT NULL,
  title_en TEXT,
  content_fr TEXT,
  content_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('page', 'faq', 'article', 'glossaire')),
  status TEXT DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'archive')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_case_id ON public.partner_submissions(case_id);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_partner_id ON public.partner_submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_type ON public.content_pages(type);
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON public.content_pages(status);
CREATE INDEX IF NOT EXISTS idx_risk_tags_category ON public.risk_tags(category);

-- ============================================================
-- 9. ENABLE RLS
-- ============================================================
ALTER TABLE public.risk_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. HELPER FUNCTIONS FOR ROLE CHECKS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_backoffice_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() IN ('admin', 'compliance', 'analyst', 'gestionnaire_contenu');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_compliance()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() IN ('admin', 'compliance');
$$;

-- ============================================================
-- 11. RLS POLICIES — risk_tags (back-office read, admin write)
-- ============================================================
DROP POLICY IF EXISTS "backoffice_read_risk_tags" ON public.risk_tags;
CREATE POLICY "backoffice_read_risk_tags"
  ON public.risk_tags FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS "admin_manage_risk_tags" ON public.risk_tags;
CREATE POLICY "admin_manage_risk_tags"
  ON public.risk_tags FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ============================================================
-- 12. RLS POLICIES — partners (admin/compliance only)
-- ============================================================
DROP POLICY IF EXISTS "admin_compliance_read_partners" ON public.partners;
CREATE POLICY "admin_compliance_read_partners"
  ON public.partners FOR SELECT TO authenticated
  USING (public.is_admin_or_compliance());

DROP POLICY IF EXISTS "admin_manage_partners" ON public.partners;
CREATE POLICY "admin_manage_partners"
  ON public.partners FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ============================================================
-- 13. RLS POLICIES — partner_submissions (admin/compliance)
-- ============================================================
DROP POLICY IF EXISTS "admin_compliance_manage_partner_submissions" ON public.partner_submissions;
CREATE POLICY "admin_compliance_manage_partner_submissions"
  ON public.partner_submissions FOR ALL TO authenticated
  USING (public.is_admin_or_compliance())
  WITH CHECK (public.is_admin_or_compliance());

-- ============================================================
-- 14. RLS POLICIES — content_pages
-- ============================================================
DROP POLICY IF EXISTS "gestionnaire_manage_content" ON public.content_pages;
CREATE POLICY "gestionnaire_manage_content"
  ON public.content_pages FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin', 'gestionnaire_contenu'))
  WITH CHECK (public.current_user_role() IN ('admin', 'gestionnaire_contenu'));

DROP POLICY IF EXISTS "backoffice_read_content" ON public.content_pages;
CREATE POLICY "backoffice_read_content"
  ON public.content_pages FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

-- ============================================================
-- 15. EXTEND RLS on case_files for compliance + analyst
-- ============================================================
DROP POLICY IF EXISTS "compliance_read_all_cases" ON public.case_files;
CREATE POLICY "compliance_read_all_cases"
  ON public.case_files FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('compliance', 'analyst'));

DROP POLICY IF EXISTS "compliance_update_cases" ON public.case_files;
CREATE POLICY "compliance_update_cases"
  ON public.case_files FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('compliance', 'analyst'))
  WITH CHECK (public.current_user_role() IN ('compliance', 'analyst'));

-- ============================================================
-- 16. EXTEND RLS on case_status_history for compliance + analyst
-- ============================================================
DROP POLICY IF EXISTS "compliance_analyst_manage_history" ON public.case_status_history;
CREATE POLICY "compliance_analyst_manage_history"
  ON public.case_status_history FOR ALL TO authenticated
  USING (public.current_user_role() IN ('compliance', 'analyst'))
  WITH CHECK (public.current_user_role() IN ('compliance', 'analyst'));

-- ============================================================
-- 17. EXTEND RLS on case_internal_notes for compliance + analyst
-- ============================================================
DROP POLICY IF EXISTS "compliance_analyst_manage_notes" ON public.case_internal_notes;
CREATE POLICY "compliance_analyst_manage_notes"
  ON public.case_internal_notes FOR ALL TO authenticated
  USING (public.current_user_role() IN ('compliance', 'analyst'))
  WITH CHECK (public.current_user_role() IN ('compliance', 'analyst'));

-- ============================================================
-- 18. SAMPLE PARTNERS DATA
-- ============================================================
INSERT INTO public.partners (name, type, zones, criteria, internal_contact, notes) VALUES
  ('Banque Partenaire Alpha', 'banque', ARRAY['Europe', 'Afrique'], 'Projets infrastructure > 5M EUR', 'Jean Dupont', 'Partenaire privilégié pour projets infrastructure'),
  ('Fonds Investissement Beta', 'fonds', ARRAY['Afrique subsaharienne'], 'PME et startups tech', 'Marie Martin', 'Focus impact investing'),
  ('Courtier Instruments Gamma', 'courtier_instrument', ARRAY['Global'], 'SBLC, LC, BG', 'Pierre Leblanc', 'Spécialiste instruments bancaires')
ON CONFLICT DO NOTHING;


-- ================================================================
-- MIGRATION: supabase/migrations/20260414170000_content_versions_and_note_edits.sql
-- ================================================================
-- Migration: Add content_versions table and content_en column
-- Timestamp: 20260414170000

-- Add content_en column to content_pages if not exists
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS content_en TEXT;

ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS author_email TEXT;

-- Create content_versions table for version history
CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content_pages(id) ON DELETE CASCADE,
  title_fr TEXT NOT NULL,
  content_fr TEXT,
  status TEXT NOT NULL DEFAULT 'brouillon',
  edited_by_email TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON public.content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_at ON public.content_versions(created_at);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backoffice_manage_content_versions" ON public.content_versions;
CREATE POLICY "backoffice_manage_content_versions"
ON public.content_versions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add updated_at column to case_internal_notes if not exists (for note editing)
ALTER TABLE public.case_internal_notes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;


-- ================================================================
-- MIGRATION: supabase/migrations/20260414180000_documents_staff_rls.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260414190000_audit_log_realtime.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260414200000_notifications_filter_presets.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260415101200_fix_profiles_role_constraint.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260415130000_onboarding_notif_prefs.sql
-- ================================================================
-- Migration: Add onboarding fields to profiles and notification preferences
-- Timestamp: 20260415130000

-- Add onboarding fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS role_detail TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notif_dossier_updates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_pipeline_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notif_documents_pending BOOLEAN DEFAULT TRUE;

-- Update the sync_profile_on_user_create trigger to handle new fields
CREATE OR REPLACE FUNCTION public.sync_profile_on_user_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Safely extract role from metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Validate role value
  IF v_role NOT IN ('admin', 'analyst', 'compliance', 'client', 'gestionnaire_contenu') THEN
    v_role := 'client';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    notif_dossier_updates,
    notif_pipeline_alerts,
    notif_documents_pending,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role,
    COALESCE((NEW.raw_user_meta_data->>'notif_dossier_updates')::BOOLEAN, TRUE),
    COALESCE((NEW.raw_user_meta_data->>'notif_pipeline_alerts')::BOOLEAN, TRUE),
    COALESCE((NEW.raw_user_meta_data->>'notif_documents_pending')::BOOLEAN, TRUE),
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    notif_dossier_updates = EXCLUDED.notif_dossier_updates,
    notif_pipeline_alerts = EXCLUDED.notif_pipeline_alerts,
    notif_documents_pending = EXCLUDED.notif_documents_pending;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block user creation
    RETURN NEW;
END;
$$;


-- ================================================================
-- MIGRATION: supabase/migrations/20260415160000_glcapital_full_schema.sql
-- ================================================================
-- ============================================================
-- GL Capital Investment SA — Full Schema Migration
-- ============================================================

-- ── 1. ENUM TYPES ──────────────────────────────────────────
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('client', 'analyst', 'compliance', 'admin');

DROP TYPE IF EXISTS public.dossier_status CASCADE;
CREATE TYPE public.dossier_status AS ENUM (
  'RECU', 'A_COMPLETER', 'EN_ANALYSE', 'EN_REVUE_COMPLIANCE',
  'ELIGIBLE', 'SOUMIS_PARTENAIRE', 'RETOUR_PARTENAIRE',
  'EN_NEGOCIATION', 'CLOTURE', 'REJETE'
);

DROP TYPE IF EXISTS public.compliance_action CASCADE;
CREATE TYPE public.compliance_action AS ENUM (
  'STATUS_CHANGE', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD',
  'NOTE_ADDED', 'PARTNER_SUBMISSION', 'COMPLIANCE_DECISION',
  'LOGIN_SUCCESS', 'LOGIN_ATTEMPT', 'USER_CREATED', 'CONTACT_SUBMITTED'
);

-- ── 2. CORE TABLES ─────────────────────────────────────────

-- User Profiles (intermediary for auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  organization TEXT DEFAULT '',
  country TEXT DEFAULT '',
  role public.user_role DEFAULT 'client'::public.user_role,
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Dossiers (financing files)
CREATE TABLE IF NOT EXISTS public.dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_analyst_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_compliance_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  -- Step 1: Identity
  org_name TEXT NOT NULL DEFAULT '',
  org_country TEXT DEFAULT '',
  registry_number TEXT DEFAULT '',
  org_type TEXT DEFAULT '',
  ubo_name TEXT DEFAULT '',
  ubo_nationality TEXT DEFAULT '',
  ubo_ownership TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',

  -- Step 2: Project
  project_name TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  project_country TEXT DEFAULT '',
  project_region TEXT DEFAULT '',
  total_budget TEXT DEFAULT '',
  currency TEXT DEFAULT 'EUR',
  start_date DATE,
  expected_revenue TEXT DEFAULT '',
  sponsors TEXT DEFAULT '',
  project_description TEXT DEFAULT '',
  request_type TEXT DEFAULT '',

  -- Step 3: Financing
  debt_amount TEXT DEFAULT '',
  equity_amount TEXT DEFAULT '',
  maturity TEXT DEFAULT '',
  guarantee_type TEXT DEFAULT '',
  guarantee_details TEXT DEFAULT '',
  fund_source TEXT DEFAULT '',
  existing_financing TEXT DEFAULT '',
  target_institution TEXT DEFAULT '',
  additional_notes TEXT DEFAULT '',

  -- Meta
  status public.dossier_status DEFAULT 'RECU'::public.dossier_status,
  completeness INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  risk_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  unread_messages INTEGER DEFAULT 0,
  type TEXT DEFAULT 'Project Finance',
  amount TEXT DEFAULT '',

  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_update TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Contacts (from contact page form)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  country TEXT DEFAULT '',
  amount TEXT DEFAULT '',
  message TEXT DEFAULT '',
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Logs (audit trail)
CREATE TABLE IF NOT EXISTS public.compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  actor_email TEXT DEFAULT '',
  action public.compliance_action NOT NULL,
  target_ref TEXT DEFAULT '',
  detail TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. INDEXES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_dossiers_user_id ON public.dossiers(user_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON public.dossiers(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_ref ON public.dossiers(ref);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_actor ON public.compliance_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created ON public.compliance_logs(created_at DESC);

-- ── 4. FUNCTIONS ───────────────────────────────────────────

-- Auto-create user_profiles on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, organization, country, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'organization', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto-update updated_at on user_profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Auto-update last_update on dossiers
CREATE OR REPLACE FUNCTION public.update_dossier_last_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_update = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Generate dossier reference number
CREATE OR REPLACE FUNCTION public.generate_dossier_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num FROM public.dossiers;
  NEW.ref := 'GLC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Role check helper (for non-user_profiles tables)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT COALESCE(
  (SELECT role::TEXT FROM public.user_profiles WHERE id = auth.uid() LIMIT 1),
  'client'
)
$$;

-- Admin check via auth metadata (safe for user_profiles table)
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM auth.users au
  WHERE au.id = auth.uid()
  AND (
    au.raw_user_meta_data->>'role' IN ('admin', 'analyst', 'compliance')
    OR au.raw_app_meta_data->>'role' IN ('admin', 'analyst', 'compliance')
  )
)
$$;

-- ── 5. ENABLE RLS ──────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS POLICIES ────────────────────────────────────────

-- user_profiles: own profile access
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.user_profiles;
CREATE POLICY "admin_read_all_profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (public.is_admin_from_auth());

-- dossiers: clients see own, staff see all
DROP POLICY IF EXISTS "clients_manage_own_dossiers" ON public.dossiers;
CREATE POLICY "clients_manage_own_dossiers"
ON public.dossiers FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "staff_read_all_dossiers" ON public.dossiers;
CREATE POLICY "staff_read_all_dossiers"
ON public.dossiers FOR SELECT TO authenticated
USING (public.is_admin_from_auth());

DROP POLICY IF EXISTS "staff_update_dossiers" ON public.dossiers;
CREATE POLICY "staff_update_dossiers"
ON public.dossiers FOR UPDATE TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- contacts: insert for all (public form), read for staff
DROP POLICY IF EXISTS "public_insert_contacts" ON public.contacts;
CREATE POLICY "public_insert_contacts"
ON public.contacts FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "staff_read_contacts" ON public.contacts;
CREATE POLICY "staff_read_contacts"
ON public.contacts FOR SELECT TO authenticated
USING (public.is_admin_from_auth());

-- compliance_logs: insert for authenticated, read for staff
DROP POLICY IF EXISTS "auth_insert_compliance_logs" ON public.compliance_logs;
CREATE POLICY "auth_insert_compliance_logs"
ON public.compliance_logs FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "staff_read_compliance_logs" ON public.compliance_logs;
CREATE POLICY "staff_read_compliance_logs"
ON public.compliance_logs FOR SELECT TO authenticated
USING (public.is_admin_from_auth());

-- ── 7. TRIGGERS ────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS on_dossier_updated ON public.dossiers;
CREATE TRIGGER on_dossier_updated
  BEFORE UPDATE ON public.dossiers
  FOR EACH ROW EXECUTE FUNCTION public.update_dossier_last_update();

DROP TRIGGER IF EXISTS on_dossier_insert_ref ON public.dossiers;
CREATE TRIGGER on_dossier_insert_ref
  BEFORE INSERT ON public.dossiers
  FOR EACH ROW
  WHEN (NEW.ref IS NULL OR NEW.ref = '')
  EXECUTE FUNCTION public.generate_dossier_ref();

-- ── 8. MOCK DATA ───────────────────────────────────────────
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  analyst_uuid UUID := gen_random_uuid();
  compliance_uuid UUID := gen_random_uuid();
  client_uuid UUID := gen_random_uuid();
  client2_uuid UUID := gen_random_uuid();
BEGIN
  -- Create auth users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES
    (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sophie.mercier@glcapital.com', crypt('Admin@GLC2026!', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'Sophie Mercier', 'role', 'admin', 'organization', 'GL Capital Investment SA'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
    (analyst_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'marco.rossi@glcapital.com', crypt('Analyst@GLC2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'Marco Rossi', 'role', 'analyst', 'organization', 'GL Capital Investment SA'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'analyst'),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
    (compliance_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'fatima.benali@glcapital.com', crypt('Comply@GLC2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'Fatima Benali', 'role', 'compliance', 'organization', 'GL Capital Investment SA'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'compliance'),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
    (client_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'amadou.diallo@weaenergyholdings.com', crypt('Client@GLC2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'Amadou Diallo', 'role', 'client', 'organization', 'West Africa Energy Holdings Ltd', 'country', 'SN'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
    (client2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'ci.port@cidevelopment.com', crypt('Client@GLC2026', gen_salt('bf', 10)), now(), now(), now(),
     jsonb_build_object('full_name', 'CI Port Dev', 'role', 'client', 'organization', 'CI Port Development SA', 'country', 'CI'),
     jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
     false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
  ON CONFLICT (id) DO NOTHING;

  -- Create sample dossiers for client
  INSERT INTO public.dossiers (
    id, ref, user_id, assigned_analyst_id, assigned_compliance_id,
    org_name, org_country, registry_number, org_type,
    contact_name, contact_email, contact_phone,
    project_name, sector, project_country, total_budget, currency,
    project_description, request_type,
    debt_amount, equity_amount, maturity, fund_source,
    status, completeness, compliance_score, risk_tags, type, amount,
    submitted_at, last_update
  ) VALUES
    (gen_random_uuid(), 'GLC-2026-0047', client_uuid, analyst_uuid, compliance_uuid,
     'West Africa Energy Holdings Ltd', 'SN', 'SN-2019-00847', 'holding',
     'Amadou Diallo', 'amadou.diallo@weaenergyholdings.com', '+221770000000',
     'Solar Infrastructure SPV — Senegal', 'energy', 'Senegal', '42000000', 'EUR',
     'Large-scale solar infrastructure project in Senegal targeting 50MW capacity with grid connection.',
     'project-finance',
     '30000000', '12000000', '10-15', 'operating',
     'ELIGIBLE'::public.dossier_status, 94, 88, ARRAY['Energy', 'West Africa'], 'Project Finance', '€42,000,000',
     now() - INTERVAL '14 days', now() - INTERVAL '1 day'),
    (gen_random_uuid(), 'GLC-2026-0051', client2_uuid, analyst_uuid, compliance_uuid,
     'CI Port Development SA', 'CI', 'CI-2020-00512', 'plc',
     'CI Port Dev', 'ci.port@cidevelopment.com', '+2250700000000',
     'Commercial Port Expansion — Cote d''Ivoire', 'infrastructure', 'Cote d''Ivoire', '8500000', 'EUR',
     'Expansion of commercial port facilities in Abidjan to increase container throughput capacity.',
     'sblc-bg',
     '6000000', '2500000', '5-10', 'operating',
     'EN_REVUE_COMPLIANCE'::public.dossier_status, 78, 72, ARRAY['Maritime', 'West Africa'], 'SBLC Advisory', '€8,500,000',
     now() - INTERVAL '7 days', now() - INTERVAL '2 days')
  ON CONFLICT (ref) DO NOTHING;

  -- Sample compliance logs
  INSERT INTO public.compliance_logs (actor_id, actor_email, action, target_ref, detail, ip_address, severity)
  VALUES
    (compliance_uuid, 'fatima.benali@glcapital.com', 'STATUS_CHANGE'::public.compliance_action, 'GLC-2026-0047', 'EN_REVUE_COMPLIANCE → ELIGIBLE', '10.0.1.45', 'info'),
    (analyst_uuid, 'marco.rossi@glcapital.com', 'DOCUMENT_DOWNLOAD'::public.compliance_action, 'GLC-2026-0047', 'KYC_Package_WAEH_Complete.pdf', '10.0.1.22', 'info'),
    (admin_uuid, 'sophie.mercier@glcapital.com', 'PARTNER_SUBMISSION'::public.compliance_action, 'GLC-2026-0035', 'Submitted to licensed institution (partner ID redacted)', '10.0.1.10', 'sensitive')
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;


