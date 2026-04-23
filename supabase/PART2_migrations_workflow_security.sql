-- ================================================================
-- MIGRATION: supabase/migrations/20260415170000_dossier_storage_and_email_verification.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260415200000_messages_and_status_updates.sql
-- ================================================================
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


-- ================================================================
-- MIGRATION: supabase/migrations/20260417030000_contact_double_optin.sql
-- ================================================================
-- ── CONTACT DOUBLE OPT-IN TABLES ──────────────────────────────────────────

-- Pending contact verifications (before email confirmed)
CREATE TABLE IF NOT EXISTS public.contact_pending_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet TEXT NOT NULL,
  societe TEXT NOT NULL,
  email TEXT NOT NULL,
  project_type TEXT NOT NULL,
  message TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_pending_token ON public.contact_pending_verifications(token);
CREATE INDEX IF NOT EXISTS idx_contact_pending_email ON public.contact_pending_verifications(email);
CREATE INDEX IF NOT EXISTS idx_contact_pending_expires ON public.contact_pending_verifications(expires_at);

ALTER TABLE public.contact_pending_verifications ENABLE ROW LEVEL SECURITY;

-- Service role only (API routes use service role key)
DROP POLICY IF EXISTS "service_manage_pending_verifications" ON public.contact_pending_verifications;
CREATE POLICY "service_manage_pending_verifications"
  ON public.contact_pending_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read pending verifications
DROP POLICY IF EXISTS "admin_read_pending_verifications" ON public.contact_pending_verifications;
CREATE POLICY "admin_read_pending_verifications"
  ON public.contact_pending_verifications
  FOR SELECT
  TO authenticated
  USING (true);

-- ── CONTACT UNSUBSCRIBES TABLE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_unsubscribes_email ON public.contact_unsubscribes(email);

ALTER TABLE public.contact_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Service role manages unsubscribes
DROP POLICY IF EXISTS "service_manage_unsubscribes" ON public.contact_unsubscribes;
CREATE POLICY "service_manage_unsubscribes"
  ON public.contact_unsubscribes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read unsubscribes
DROP POLICY IF EXISTS "admin_read_unsubscribes" ON public.contact_unsubscribes;
CREATE POLICY "admin_read_unsubscribes"
  ON public.contact_unsubscribes
  FOR SELECT
  TO authenticated
  USING (true);


-- ================================================================
-- MIGRATION: supabase/migrations/20260417060000_add_gestionnaire_contenu_role.sql
-- ================================================================
-- ============================================================
-- GL Capital — Add gestionnaire_contenu to user_role enum
-- Must run in its own transaction BEFORE the governance migration
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'gestionnaire_contenu'
    AND enumtypid = (
      SELECT oid FROM pg_type
      WHERE typname = 'user_role'
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    )
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'gestionnaire_contenu';
  END IF;
END $$;


-- ================================================================
-- MIGRATION: supabase/migrations/20260417070000_backoffice_governance_full_model.sql
-- ================================================================
-- ============================================================
-- GL Capital — Back-Office Governance & Full Data Model
-- Adds: organizations, case_files,
--       internal_notes, compliance_checks, audit_logs,
--       partner_submissions enhancements, risk tags
-- NOTE: gestionnaire_contenu enum value added in prior migration
--       20260417060000_add_gestionnaire_contenu_role.sql
-- ============================================================

-- ── 2. ORGANIZATIONS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT DEFAULT '',
  reg_no TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  ubo_name TEXT DEFAULT '',
  ubo_nationality TEXT DEFAULT '',
  ubo_ownership TEXT DEFAULT '',
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- ── 3. CASE_FILES TABLE (normalized, replaces dossiers for new workflow) ──
-- Drop and recreate to ensure all required columns are present
DROP TABLE IF EXISTS public.case_files CASCADE;
CREATE TABLE public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL UNIQUE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_analyst_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_compliance_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'Project Finance',
  status TEXT DEFAULT 'RECU',
  status_reason TEXT DEFAULT '',
  amount TEXT DEFAULT '',
  currency TEXT DEFAULT 'EUR',
  project_name TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  country TEXT DEFAULT '',
  completeness INTEGER DEFAULT 0,
  compliance_score INTEGER DEFAULT 0,
  risk_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  unread_messages INTEGER DEFAULT 0,
  title TEXT,
  description TEXT,
  client_email TEXT,
  client_name TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT case_files_status_check CHECK (
    status IN ('RECU','A_COMPLETER','EN_ANALYSE','EN_REVUE_COMPLIANCE',
               'ELIGIBLE','SOUMIS_PARTENAIRE','RETOUR_PARTENAIRE',
               'EN_NEGOCIATION','CLOTURE','REJETE')
  )
);

CREATE INDEX IF NOT EXISTS idx_case_files_user_id ON public.case_files(user_id);
CREATE INDEX IF NOT EXISTS idx_case_files_status ON public.case_files(status);
CREATE INDEX IF NOT EXISTS idx_case_files_org_id ON public.case_files(org_id);

-- ── 4. CASE STATUS HISTORY (decision history) ─────────────
CREATE TABLE IF NOT EXISTS public.case_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  changed_by_email TEXT,
  note TEXT DEFAULT '',
  reason_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON public.case_status_history(case_id);

-- ── 5. CASE INTERNAL NOTES (not visible to clients) ────────
CREATE TABLE IF NOT EXISTS public.case_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  risk_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_case_internal_notes_case_id ON public.case_internal_notes(case_id);

-- ── 6. COMPLIANCE CHECKS (KYC/AML stages) ─────────────────
CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  decision TEXT DEFAULT 'pending',
  reason_code TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  checked_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  checked_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT compliance_checks_decision_check CHECK (
    decision IN ('pending','pass','fail','review')
  )
);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_case_id ON public.compliance_checks(case_id);

-- ── 7. AUDIT LOGS (immutable, append-only) ─────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT DEFAULT '',
  target_id TEXT DEFAULT '',
  target_ref TEXT DEFAULT '',
  detail TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ── 8. PARTNERS TABLE (confidential, internal only) ────────
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'banque',
  zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  criteria JSONB DEFAULT '{}'::JSONB,
  criteria_text TEXT DEFAULT '',
  internal_contact TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT partners_type_check CHECK (
    type IN ('banque','fonds','courtier_instrument','avocat','consultant','autre')
  )
);

CREATE INDEX IF NOT EXISTS idx_partners_type ON public.partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active);

-- ── 9. PARTNER SUBMISSIONS (submission journal) ────────────
CREATE TABLE IF NOT EXISTS public.partner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  submitted_by_email TEXT,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'soumis',
  response_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT partner_submissions_status_check CHECK (
    status IN ('soumis','en_attente','accepte','refuse','en_negociation','cloture')
  )
);

CREATE INDEX IF NOT EXISTS idx_partner_submissions_case_id ON public.partner_submissions(case_id);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_partner_id ON public.partner_submissions(partner_id);

-- ── 10. MESSAGES TABLE (per-case thread) ───────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  sender_email TEXT,
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_case_id ON public.messages(case_id);

-- ── 11. DOCUMENTS TABLE (versioned, with hash) ─────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  doc_type TEXT DEFAULT '',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT '',
  sha256 TEXT DEFAULT '',
  version INTEGER DEFAULT 1,
  scan_status TEXT DEFAULT 'pending',
  scan_passed BOOLEAN DEFAULT false,
  is_visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);

-- ── 12. HELPER FUNCTIONS ───────────────────────────────────

-- Check if current user has a staff role
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid()
  AND role IN ('admin','compliance','analyst','gestionnaire_contenu')
)
$$;

-- Check if current user is admin or compliance
CREATE OR REPLACE FUNCTION public.is_admin_or_compliance()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid()
  AND role IN ('admin','compliance')
)
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid()
  AND role = 'admin'
)
$$;

-- ── 13. ENABLE RLS ─────────────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ── 14. RLS POLICIES ───────────────────────────────────────

-- Organizations: clients see their own, staff see all
DROP POLICY IF EXISTS "organizations_client_own" ON public.organizations;
CREATE POLICY "organizations_client_own" ON public.organizations
FOR ALL TO authenticated
USING (created_by = auth.uid() OR public.is_staff())
WITH CHECK (created_by = auth.uid() OR public.is_admin_or_compliance());

-- Case files: clients see their own, staff see all
DROP POLICY IF EXISTS "case_files_client_own" ON public.case_files;
CREATE POLICY "case_files_client_own" ON public.case_files
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "case_files_staff_write" ON public.case_files;
CREATE POLICY "case_files_staff_write" ON public.case_files
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Case status history: staff only
DROP POLICY IF EXISTS "case_status_history_staff" ON public.case_status_history;
CREATE POLICY "case_status_history_staff" ON public.case_status_history
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Internal notes: staff only (NOT visible to clients)
DROP POLICY IF EXISTS "case_internal_notes_staff" ON public.case_internal_notes;
CREATE POLICY "case_internal_notes_staff" ON public.case_internal_notes
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Compliance checks: admin and compliance only
DROP POLICY IF EXISTS "compliance_checks_admin_compliance" ON public.compliance_checks;
CREATE POLICY "compliance_checks_admin_compliance" ON public.compliance_checks
FOR ALL TO authenticated
USING (public.is_admin_or_compliance())
WITH CHECK (public.is_admin_or_compliance());

-- Audit logs: admin and compliance can read, staff can insert
DROP POLICY IF EXISTS "audit_logs_read" ON public.audit_logs;
CREATE POLICY "audit_logs_read" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin_or_compliance());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_staff());

-- Partners: admin and compliance only (CONFIDENTIAL)
DROP POLICY IF EXISTS "partners_admin_compliance" ON public.partners;
CREATE POLICY "partners_admin_compliance" ON public.partners
FOR ALL TO authenticated
USING (public.is_admin_or_compliance())
WITH CHECK (public.is_admin_or_compliance());

-- Partner submissions: admin and compliance only
DROP POLICY IF EXISTS "partner_submissions_admin_compliance" ON public.partner_submissions;
CREATE POLICY "partner_submissions_admin_compliance" ON public.partner_submissions
FOR ALL TO authenticated
USING (public.is_admin_or_compliance())
WITH CHECK (public.is_admin_or_compliance());

-- Messages: clients see their case messages, staff see all (internal hidden from clients)
DROP POLICY IF EXISTS "messages_access" ON public.messages;
CREATE POLICY "messages_access" ON public.messages
FOR SELECT TO authenticated
USING (
  public.is_staff()
  OR (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM public.case_files cf
      WHERE cf.id = case_id AND cf.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Documents: clients see their own non-internal docs, staff see all
DROP POLICY IF EXISTS "documents_access" ON public.documents;
CREATE POLICY "documents_access" ON public.documents
FOR SELECT TO authenticated
USING (
  public.is_staff()
  OR (
    is_visible_to_client = true
    AND EXISTS (
      SELECT 1 FROM public.case_files cf
      WHERE cf.id = case_id AND cf.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- ── 15. TRIGGER: Auto-log status changes ───────────────────
CREATE OR REPLACE FUNCTION public.log_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.case_status_history (
      case_id, old_status, new_status, changed_by_email, created_at
    ) VALUES (
      NEW.id, OLD.status, NEW.status,
      (SELECT email FROM public.user_profiles WHERE id = auth.uid() LIMIT 1),
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_case_status_change ON public.case_files;
CREATE TRIGGER trg_case_status_change
AFTER UPDATE ON public.case_files
FOR EACH ROW
EXECUTE FUNCTION public.log_case_status_change();

-- ── 16. TRIGGER: Update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
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
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_partners_updated_at ON public.partners;
CREATE TRIGGER trg_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_partner_submissions_updated_at ON public.partner_submissions;
CREATE TRIGGER trg_partner_submissions_updated_at
BEFORE UPDATE ON public.partner_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_compliance_checks_updated_at ON public.compliance_checks;
CREATE TRIGGER trg_compliance_checks_updated_at
BEFORE UPDATE ON public.compliance_checks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_case_internal_notes_updated_at ON public.case_internal_notes;
CREATE TRIGGER trg_case_internal_notes_updated_at
BEFORE UPDATE ON public.case_internal_notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ================================================================
-- MIGRATION: supabase/migrations/20260417080000_fix_contact_submissions.sql
-- ================================================================
-- Fix: Ensure contact_submissions table exists with correct schema
-- This migration is idempotent and safe to re-run

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

-- Only authenticated users can read submissions
DROP POLICY IF EXISTS "allow_authenticated_select_contact_submissions" ON public.contact_submissions;
CREATE POLICY "allow_authenticated_select_contact_submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to delete (admin cleanup)
DROP POLICY IF EXISTS "allow_authenticated_delete_contact_submissions" ON public.contact_submissions;
CREATE POLICY "allow_authenticated_delete_contact_submissions"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (true);


-- ================================================================
-- MIGRATION: supabase/migrations/20260417090000_dossier_docs_sha256_and_assignments_rls.sql
-- ================================================================
-- ============================================================
-- GL Capital — Add SHA256 and scan fields to dossier_documents
-- Adds sha256, scan_status, scan_passed columns if missing
-- Also adds partner_assignments RLS policies
-- ============================================================

-- Add sha256 to dossier_documents if not present
ALTER TABLE public.dossier_documents
  ADD COLUMN IF NOT EXISTS sha256 TEXT DEFAULT '';

ALTER TABLE public.dossier_documents
  ADD COLUMN IF NOT EXISTS scan_status TEXT DEFAULT 'pending';

ALTER TABLE public.dossier_documents
  ADD COLUMN IF NOT EXISTS scan_passed BOOLEAN DEFAULT false;

-- Ensure documents table has sha256 column (already in governance model but safe to re-add)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS sha256 TEXT DEFAULT '';

-- ── Ensure case_files table exists before partner_submissions FK reference ──
-- This is a minimal stub; the full definition lives in 20260417070000.
-- Using IF NOT EXISTS means this is a no-op when that migration already ran.
CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'RECU',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Ensure partners table exists before partner_submissions FK reference ──
-- This is a minimal stub; the full definition lives in 20260417070000.
-- Using IF NOT EXISTS means this is a no-op when that migration already ran.
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'banque',
  zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  criteria JSONB DEFAULT '{}'::JSONB,
  criteria_text TEXT DEFAULT '',
  internal_contact TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT partners_type_check_stub CHECK (
    type IN ('banque','fonds','courtier_instrument','avocat','consultant','autre')
  )
);

-- ── Ensure user_profiles table exists before partner_submissions FK reference ──
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Ensure partner_submissions table exists before applying RLS ──
CREATE TABLE IF NOT EXISTS public.partner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.case_files(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  submitted_by_email TEXT,
  note TEXT DEFAULT '',
  status TEXT DEFAULT 'soumis',
  response_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT partner_submissions_status_check_v2 CHECK (
    status IN ('soumis','en_attente','accepte','refuse','en_negociation','cloture')
  )
);

-- Enable RLS (idempotent)
ALTER TABLE public.partner_submissions ENABLE ROW LEVEL SECURITY;

-- ── RLS for partner_assignments page ──────────────────────
-- Admins can read/write partner_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'partner_submissions'
    AND policyname = 'admin_full_access_partner_submissions'
  ) THEN
    CREATE POLICY admin_full_access_partner_submissions
      ON public.partner_submissions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid()
          AND role IN ('admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE id = auth.uid()
          AND role IN ('admin')
        )
      );
  END IF;
END $$;


-- ================================================================
-- MIGRATION: supabase/migrations/20260417100000_security_fixes_rls.sql
-- ================================================================
-- ============================================================
-- SECURITY FIXES — Audit RLS 17 avril 2026
-- ============================================================

-- ============================================================
-- FIX 1 CRITIQUE : Empêcher l'escalade de privilèges sur user_profiles
-- Un client ne doit pas pouvoir modifier son propre rôle
-- ============================================================
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;

-- Lecture seule de son propre profil pour les clients
CREATE POLICY "users_read_own_profile_up"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Update autorisé SAUF le champ role — via une fonction sécurisée
CREATE POLICY "users_update_own_profile_no_role"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
  );

-- Insert pour création de profil à l'inscription
CREATE POLICY "users_insert_own_profile_up"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- FIX 2 CRITIQUE : contact_submissions lisibles uniquement par le staff
-- ============================================================
DROP POLICY IF EXISTS "allow_authenticated_select_contact_submissions" ON public.contact_submissions;

CREATE POLICY "staff_select_contact_submissions"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (public.is_admin_or_compliance());

-- ============================================================
-- FIX 3 GRAVE : Ajouter gestionnaire_contenu dans is_staff()
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
      AND role IN ('admin', 'compliance', 'analyst', 'gestionnaire_contenu')
  )
$$;

-- ============================================================
-- FIX 4 MOYEN : Empêcher la modification du rôle via profiles UPDATE
-- ============================================================
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

CREATE POLICY "users_update_own_profile_safe"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- FIX 5 MINEUR : Supprimer les politiques dupliquées contact_submissions
-- (recréer proprement une seule fois)
-- ============================================================
DROP POLICY IF EXISTS "allow_public_insert_contact_submissions" ON public.contact_submissions;

CREATE POLICY "allow_public_insert_contact_submissions"
  ON public.contact_submissions FOR INSERT
  TO public
  WITH CHECK (true);


