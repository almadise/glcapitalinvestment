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
