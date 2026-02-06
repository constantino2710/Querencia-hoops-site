-- Adiciona a coluna cpf se ela realmente for necessária
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cpf TEXT;