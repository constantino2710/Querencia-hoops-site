-- Permite que o professor veja matrículas nos cursos dele
CREATE POLICY "Professores podem ver matriculas de seus cursos" 
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = enrollments.course_id 
    AND teacher_id = auth.uid()
  )
);