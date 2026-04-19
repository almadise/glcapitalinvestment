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
