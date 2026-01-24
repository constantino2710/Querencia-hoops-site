-- 1. Cria a tabela de Categorias (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adiciona a coluna de referência na tabela de Cursos (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category_id') THEN
        ALTER TABLE public.courses
        ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Habilita segurança (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Cria políticas de segurança (dropa se existirem para evitar erro de duplicidade)
DROP POLICY IF EXISTS "Categorias são públicas para leitura" ON public.categories;
CREATE POLICY "Categorias são públicas para leitura"
ON public.categories FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Apenas admins gerenciam categorias" ON public.categories;
CREATE POLICY "Apenas admins gerenciam categorias"
ON public.categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'ADMIN'
  )
);

-- 4. INSERIR AS 4 CATEGORIAS BASE
-- O comando "ON CONFLICT DO NOTHING" evita erro se você rodar o script mais de uma vez
INSERT INTO public.categories (name, slug) VALUES
('Técnica', 'tecnica'),
('Condicionamento', 'condicionamento'),
('Psicologia', 'psicologia'),
('Físico', 'fisico')
ON CONFLICT (slug) DO NOTHING;