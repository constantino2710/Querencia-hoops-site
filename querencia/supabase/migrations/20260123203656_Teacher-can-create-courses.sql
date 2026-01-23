-- 1. Garante que o RLS está ativo na tabela
alter table public.courses enable row level security;

-- 2. Limpa políticas antigas para evitar duplicidade ou erros
drop policy if exists "Cursos publicados são públicos" on public.courses;
drop policy if exists "Professor vê seus próprios cursos" on public.courses;
drop policy if exists "Professor pode criar cursos" on public.courses;
drop policy if exists "Professor pode atualizar seus cursos" on public.courses;

-- 3. RECRIAR AS POLÍTICAS (Usando 'teacher_id')

-- Regra de LEITURA (Pública para publicados, Dono para rascunhos)
create policy "Leitura de cursos"
on public.courses for select
using ( 
  status = 'PUBLISHED' 
  or 
  auth.uid() = teacher_id 
);

-- Regra de CRIAÇÃO (INSERT)
-- Permite criar se o usuário logado for o 'teacher_id' do curso
create policy "Professor pode criar cursos"
on public.courses for insert
with check ( auth.uid() = teacher_id );

-- Regra de ATUALIZAÇÃO (UPDATE)
-- Permite editar apenas seus próprios cursos
create policy "Professor pode atualizar seus cursos"
on public.courses for update
using ( auth.uid() = teacher_id );

-- Regra de EXCLUSÃO (DELETE) - Opcional, caso queira permitir deletar
create policy "Professor pode deletar seus cursos"
on public.courses for delete
using ( auth.uid() = teacher_id );