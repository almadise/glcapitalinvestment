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
