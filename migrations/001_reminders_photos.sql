-- =============================================
-- Migration: Phase 1 - Reminders + Photos
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Add reminder tracking to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- 2. Add before/after photo URLs to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS photo_before_url TEXT;
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS photo_after_url TEXT;

-- 3. Create storage bucket for appointment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('appointment-photos', 'appointment-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS: authenticated users can upload photos
CREATE POLICY "Users can upload appointment photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'appointment-photos'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

-- 5. RLS: anyone can read photos (public bucket)
CREATE POLICY "Anyone can read appointment photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'appointment-photos');

-- 6. RLS: owners can delete their photos
CREATE POLICY "Owners can delete appointment photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'appointment-photos'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);
