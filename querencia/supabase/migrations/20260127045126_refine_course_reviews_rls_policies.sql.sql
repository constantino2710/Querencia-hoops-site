-- --------------------------------------------------------
-- POLÍTICAS REFINADAS PARA COURSE_REVIEWS
-- --------------------------------------------------------

-- 1. Permitir leitura pública das avaliações
create policy "Avaliações são visíveis para todos"
on public.course_reviews for select
to public
using (true);

-- 2. Permitir que alunos criem avaliações APENAS se estiverem matriculados
-- Esta política verifica:
-- a) Se o ID do estudante é o mesmo do usuário autenticado
-- b) Se existe uma matrícula 'ACTIVE' para este usuário neste curso
create policy "Alunos matriculados podem criar avaliações"
on public.course_reviews for insert
to authenticated
with check (
  auth.uid() = student_id AND 
  exists (
    select 1 from public.enrollments 
    where student_id = auth.uid() 
    and course_id = course_reviews.course_id
    and status = 'ACTIVE'
  )
);

-- 3. Permitir que alunos atualizem suas próprias avaliações
create policy "Alunos podem atualizar suas próprias avaliações"
on public.course_reviews for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

-- 4. Permitir que alunos eliminem suas próprias avaliações
create policy "Alunos podem eliminar suas próprias avaliações"
on public.course_reviews for delete
to authenticated
using (auth.uid() = student_id);