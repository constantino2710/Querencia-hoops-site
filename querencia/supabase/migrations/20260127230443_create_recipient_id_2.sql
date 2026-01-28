-- Adiciona o ID do recebedor à tabela de usuários existente
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pagarme_recipient_id TEXT;

-- Garante que a política de segurança permita que o professor veja seus próprios dados
CREATE POLICY "Teachers can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);