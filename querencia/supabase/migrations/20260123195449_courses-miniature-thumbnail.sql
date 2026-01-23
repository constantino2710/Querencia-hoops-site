-- 1. Cria um balde chamado 'course-thumbnails'
insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true);

-- 2. POLÍTICA DE LEITURA (Pública)
-- Qualquer pessoa (mesmo sem logar) pode ver as imagens dos cursos
create policy "Imagens são públicas"
on storage.objects for select
using ( bucket_id = 'course-thumbnails' );

-- 3. POLÍTICA DE UPLOAD (Professores)
-- Apenas usuários logados podem fazer upload
create policy "Usuários logados podem fazer upload"
on storage.objects for insert
with check (
  bucket_id = 'course-thumbnails' 
  and auth.role() = 'authenticated'
);