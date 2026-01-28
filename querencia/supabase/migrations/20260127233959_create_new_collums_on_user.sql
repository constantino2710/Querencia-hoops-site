-- 1. Adiciona os campos necessários para o cadastro financeiro na tabela de usuários
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name_bank TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS document_number TEXT; -- CPF ou CNPJ
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS branch_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_digit TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pagarme_recipient_id TEXT; -- ID gerado pela Pagar.me