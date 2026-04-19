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
