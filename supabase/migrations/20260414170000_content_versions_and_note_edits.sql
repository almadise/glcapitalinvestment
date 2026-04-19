-- Migration: Add content_versions table and content_en column
-- Timestamp: 20260414170000

-- Add content_en column to content_pages if not exists
ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS content_en TEXT;

ALTER TABLE public.content_pages
ADD COLUMN IF NOT EXISTS author_email TEXT;

-- Create content_versions table for version history
CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content_pages(id) ON DELETE CASCADE,
  title_fr TEXT NOT NULL,
  content_fr TEXT,
  status TEXT NOT NULL DEFAULT 'brouillon',
  edited_by_email TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON public.content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_at ON public.content_versions(created_at);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backoffice_manage_content_versions" ON public.content_versions;
CREATE POLICY "backoffice_manage_content_versions"
ON public.content_versions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add updated_at column to case_internal_notes if not exists (for note editing)
ALTER TABLE public.case_internal_notes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
