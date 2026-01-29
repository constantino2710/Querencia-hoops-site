-- Adicionando colunas necessárias para integração com Pagar.me
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS charge_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Criando um índice único para o order_id para permitir o 'upsert' do código
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);