-- Migration: Add audio fields to posts and replies & setup voice_notes storage bucket
-- Date: 2026-08-25

-- 1. Add audio columns to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INT;

-- 2. Add audio columns to replies
ALTER TABLE public.replies
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INT;

-- 3. Create voice_notes bucket if storage extension is present
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice_notes',
  'voice_notes',
  true,
  5242880, -- 5MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a'];

-- 4. Storage RLS Policies
CREATE POLICY "Public read for voice_notes" ON storage.objects
FOR SELECT USING (bucket_id = 'voice_notes');

CREATE POLICY "Authenticated users can upload voice_notes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'voice_notes' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own voice_notes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'voice_notes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
