-- 1. Garante que teacher_id seja uma chave estrangeira para a tabela users
-- (Caso dê erro dizendo que já existe, ignore essa parte)
ALTER TABLE public.courses
ADD CONSTRAINT fk_courses_teacher
FOREIGN KEY (teacher_id) REFERENCES public.users(id);

-- 2. LIBERAR LEITURA PÚBLICA DA TABELA USERS
-- Sem isso, o aluno não consegue ler os dados do professor (nome/foto)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dados de usuários são públicos"
ON public.users FOR SELECT
USING (true);