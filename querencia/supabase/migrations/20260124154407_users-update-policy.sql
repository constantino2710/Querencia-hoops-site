-- Permitir que o usuário atualize o próprio perfil na tabela users
DROP POLICY IF EXISTS "Usuário atualiza próprio perfil" ON public.users;

CREATE POLICY "Usuário atualiza próprio perfil"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);