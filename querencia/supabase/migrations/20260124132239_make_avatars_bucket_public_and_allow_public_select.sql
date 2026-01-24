-- 1. Forçar o bucket 'avatars' a ser PÚBLICO
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- 2. Garantir que qualquer um possa VER os arquivos (Policy)
DROP POLICY IF EXISTS "Qualquer um pode ver avatares" ON storage.objects;

CREATE POLICY "Qualquer um pode ver avatares"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );