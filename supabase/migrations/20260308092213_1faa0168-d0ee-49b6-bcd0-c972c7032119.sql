
-- Create public storage bucket for card news images (Instagram needs public URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cardnews-exports', 'cardnews-exports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload cardnews exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cardnews-exports');

-- Allow public read access (needed for Instagram to fetch images)
CREATE POLICY "Public read access for cardnews exports"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cardnews-exports');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own cardnews exports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cardnews-exports');
