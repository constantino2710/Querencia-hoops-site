-- 1. Habilitar segurança nas tabelas (se ainda não estiver)
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Seções são públicas para ver" ON public.course_sections;
DROP POLICY IF EXISTS "Professores gerenciam seções" ON public.course_sections;
DROP POLICY IF EXISTS "Aulas são públicas para ver" ON public.lessons;
DROP POLICY IF EXISTS "Professores gerenciam aulas" ON public.lessons;

-- ---------------------------------------------------------
-- POLÍTICAS PARA SEÇÕES (course_sections)
-- ---------------------------------------------------------

-- Quem pode ver? Todo mundo (para alunos verem o conteúdo)
CREATE POLICY "Seções são públicas para ver"
ON public.course_sections FOR SELECT
USING (true);

-- Quem pode Criar/Editar/Deletar? Apenas o Dono do Curso
CREATE POLICY "Professores gerenciam seções"
ON public.course_sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_sections.course_id
    AND teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = course_id -- Verifica o ID que está sendo inserido
    AND teacher_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- POLÍTICAS PARA AULAS (lessons)
-- ---------------------------------------------------------

-- Quem pode ver? Todo mundo
CREATE POLICY "Aulas são públicas para ver"
ON public.lessons FOR SELECT
USING (true);

-- Quem pode Criar/Editar/Deletar? Apenas o Dono do Curso (via Seção)
CREATE POLICY "Professores gerenciam aulas"
ON public.lessons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.course_sections s
    JOIN public.courses c ON c.id = s.course_id
    WHERE s.id = lessons.section_id
    AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.course_sections s
    JOIN public.courses c ON c.id = s.course_id
    WHERE s.id = section_id -- Verifica a seção que está recebendo a aula
    AND c.teacher_id = auth.uid()
  )
);