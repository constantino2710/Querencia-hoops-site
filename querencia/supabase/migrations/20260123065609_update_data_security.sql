-- 1. Permitir que o usuário leia APENAS o próprio perfil na tabela 'users'
create policy "Usuário vê próprio perfil"
on public.users for select
using ( auth.uid() = id );

-- 2. Permitir que o usuário leia APENAS seus vínculos de cargo
create policy "Usuário vê seus cargos"
on public.user_roles for select
using ( auth.uid() = user_id );

-- 3. Permitir que TODOS leiam os nomes dos cargos (Tabela roles é pública para leitura)
-- Isso é necessário para o React saber o que é o ID do cargo
create policy "Leitura de roles permitida"
on public.roles for select
using ( true );