-- Migration: Add notification_prefs column to user_profiles table
-- Timestamp: 20260419200000

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN notification_prefs JSONB DEFAULT '{"realtime_alerts": true, "email_notifications": true}'::jsonb;
  END IF;
END $$;
