-- Day 25: Strict Supabase Storage posture — JPEG/PNG only, max 5MB

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kirana-assets',
  'kirana-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Authenticated shops may read only their own folder: {user_id}/...
CREATE POLICY "kirana_assets_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kirana-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Uploads: JPEG/PNG only, <= 5MB, scoped to own folder
CREATE POLICY "kirana_assets_insert_images_only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kirana-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(coalesce(metadata->>'mimetype', '')) IN ('image/jpeg', 'image/png')
  AND coalesce((metadata->>'size')::bigint, 0) > 0
  AND coalesce((metadata->>'size')::bigint, 0) <= 5242880
);

CREATE POLICY "kirana_assets_update_own_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kirana-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'kirana-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND lower(coalesce(metadata->>'mimetype', '')) IN ('image/jpeg', 'image/png')
  AND coalesce((metadata->>'size')::bigint, 0) > 0
  AND coalesce((metadata->>'size')::bigint, 0) <= 5242880
);

CREATE POLICY "kirana_assets_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kirana-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
