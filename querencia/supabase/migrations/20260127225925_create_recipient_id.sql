-- Adiciona o ID do recebedor Pagar.me à tabela de usuários
ALTER TABLE public.users ADD COLUMN pagarme_recipient_id TEXT;