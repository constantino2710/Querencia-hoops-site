-- =====================================================
-- Migration: Políticas RLS para admin gerenciar enrollments
-- Data: 2026-02-10
-- Descrição: Permite INSERT, UPDATE e DELETE de enrollments por admins
-- =====================================================

-- Admins podem inserir enrollments (para concessões)
CREATE POLICY "Admins can insert enrollments"
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins podem atualizar enrollments
CREATE POLICY "Admins can update enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admins podem deletar apenas concessões admin
CREATE POLICY "Admins can delete admin grant enrollments"
ON public.enrollments
FOR DELETE
TO authenticated
USING (public.is_admin() AND is_admin_grant = true);
