-- 1. Cria o bucket 'avatars' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que QUALQUER UM veja os avatares (Público)
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Permite que usuários autenticados façam upload de seus próprios avatares
CREATE POLICY "Usuários podem fazer upload de avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 4. Permite atualização/deleção pelo dono
CREATE POLICY "Usuários alteram seus próprios avatares"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );