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
