-- =====================================================
-- Migration: Adicionar colunas de concessão admin na tabela enrollments
-- Data: 2026-02-10
-- Descrição: Permite que admins concedam acesso gratuito a cursos
-- =====================================================

-- 1. Coluna para distinguir concessão admin de matrícula paga
ALTER TABLE public.enrollments
  ADD COLUMN is_admin_grant BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Notas do admin sobre o motivo da concessão
ALTER TABLE public.enrollments
  ADD COLUMN admin_notes TEXT;

-- 3. Qual admin concedeu o acesso
ALTER TABLE public.enrollments
  ADD COLUMN granted_by UUID REFERENCES public.users(id);

-- 4. Quando foi concedido
ALTER TABLE public.enrollments
  ADD COLUMN granted_at TIMESTAMPTZ;

-- 5. Índice para filtrar concessões admin de forma eficiente
CREATE INDEX idx_enrollments_admin_grant ON public.enrollments(is_admin_grant)
  WHERE is_admin_grant = true;
