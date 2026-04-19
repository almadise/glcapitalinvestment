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
