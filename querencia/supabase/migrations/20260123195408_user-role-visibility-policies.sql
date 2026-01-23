-- 1. Derruba policies antigas para não dar conflito
drop policy if exists "Ver proprias roles" on public.user_roles;
drop policy if exists "Ler roles publicas" on public.roles;

-- 2. Permite que o usuário veja QUAIS roles ele tem (na tabela user_roles)
create policy "Ver proprias roles"
on public.user_roles for select
using ( auth.uid() = user_id );

-- 3. Permite que o usuário veja os NOMES das roles (na tabela roles)
-- Sem isso, o join 'roles(name)' volta null
create policy "Ler roles publicas"
on public.roles for select
using ( true );