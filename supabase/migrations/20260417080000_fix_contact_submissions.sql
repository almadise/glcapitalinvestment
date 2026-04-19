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
