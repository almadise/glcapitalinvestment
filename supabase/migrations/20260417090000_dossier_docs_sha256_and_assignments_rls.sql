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
