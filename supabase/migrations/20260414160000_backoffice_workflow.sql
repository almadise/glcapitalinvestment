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
