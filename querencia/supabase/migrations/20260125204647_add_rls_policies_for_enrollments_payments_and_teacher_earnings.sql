-- 1. Políticas para a tabela de Matrículas (Enrollments)
-- Permite que qualquer usuário autenticado crie sua própria matrícula
CREATE POLICY "Usuários autenticados podem se matricular" 
ON public.enrollments 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = student_id);

-- Permite que o usuário veja suas próprias matrículas
CREATE POLICY "Usuários podem ver suas próprias matrículas" 
ON public.enrollments 
FOR SELECT 
TO authenticated 
USING (auth.uid() = student_id);


-- 2. Políticas para a tabela de Pagamentos (Payments)
-- Permite inserir o registro de pagamento vinculado à matrícula
CREATE POLICY "Usuários autenticados podem registrar pagamentos" 
ON public.payments 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE id = enrollment_id AND student_id = auth.uid()
  )
);


-- 3. Políticas para a tabela de Ganhos (Teacher Earnings)
-- Esta tabela é sensível. O aluno precisa de permissão para inserir o registro de repasse 
-- no momento da compra (já que o seu código roda no client-side).
CREATE POLICY "Alunos podem gerar registros de repasse na compra" 
ON public.teacher_earnings 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE id = enrollment_id AND student_id = auth.uid()
  )
);

-- Permite que o professor veja seus próprios ganhos
CREATE POLICY "Professores podem ver seus ganhos" 
ON public.teacher_earnings 
FOR SELECT 
TO authenticated 
USING (auth.uid() = teacher_id);