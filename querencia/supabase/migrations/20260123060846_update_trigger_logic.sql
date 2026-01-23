-- Atualizando a função para ler o metadado enviado pelo Front-end
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  -- Variável para guardar qual role vamos atribuir
  role_to_assign text;
begin
  -- 1. Cria o perfil público (Copia nome e avatar)
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Define qual role atribuir baseada no metadado 'intended_role'
  -- Se o front mandar 'TEACHER', será professor. Caso contrário, sempre STUDENT.
  -- (Isso evita que alguém tente virar ADMIN enviando metadata falso)
  if (new.raw_user_meta_data->>'intended_role' = 'TEACHER') then
    role_to_assign := 'TEACHER';
  else
    role_to_assign := 'STUDENT';
  end if;

  -- 3. Insere na tabela user_roles buscando o ID correto na tabela roles
  insert into public.user_roles (user_id, role_id)
  select new.id, id from public.roles where name = role_to_assign::public.app_role;
  
  return new;
end;
$$ language plpgsql security definer;