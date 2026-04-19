-- Add notification_prefs JSONB column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'notification_prefs'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN notification_prefs JSONB DEFAULT '{"realtime_alerts": true, "email_notifications": true}'::jsonb;
  END IF;
END $$;
