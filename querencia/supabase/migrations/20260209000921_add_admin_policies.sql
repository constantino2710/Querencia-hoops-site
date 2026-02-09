-- =====================================================
-- Migration: Adicionar políticas RLS para permitir que ADMINs vejam todos os dados
-- Data: 2026-02-09
-- Descrição: Permite que usuários com role ADMIN possam acessar dados de todos os usuários
-- Correção: Usa função SECURITY DEFINER para evitar recursão infinita
-- =====================================================

-- =====================================================
-- 1. CRIAR FUNÇÃO AUXILIAR (BYPASSA RLS - SEM RECURSÃO)
-- =====================================================

-- Função que verifica se o usuário atual é ADMIN
-- SECURITY DEFINER = executa com privilégios do dono (bypassa RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Busca diretamente no banco sem passar por RLS
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'ADMIN'
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- =====================================================
-- 2. REMOVER POLICIES PROBLEMÁTICAS (SE EXISTIREM)
-- =====================================================

-- Remover policies antigas/conflitantes de user_roles
DROP POLICY IF EXISTS "Admins podem ver todos os user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Ver proprias roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuário vê seus cargos" ON public.user_roles;
DROP POLICY IF EXISTS "Users see own roles, admins see all" ON public.user_roles;

-- Remover policies antigas de teacher_earnings
DROP POLICY IF EXISTS "Admins podem ver todos os teacher_earnings" ON public.teacher_earnings;
DROP POLICY IF EXISTS "Admins can see all teacher_earnings" ON public.teacher_earnings;

-- Remover policies antigas de enrollments
DROP POLICY IF EXISTS "Admins podem ver todos os enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can see all enrollments" ON public.enrollments;

-- Remover policies antigas de courses
DROP POLICY IF EXISTS "Admins podem ver todos os cursos" ON public.courses;
DROP POLICY IF EXISTS "Admins can see all courses" ON public.courses;

-- Remover policies antigas de payments
DROP POLICY IF EXISTS "Admins podem ver todos os payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can see all payments" ON public.payments;

-- =====================================================
-- 3. RECRIAR POLICY "Ver proprias roles" (CORRIGIDA)
-- =====================================================

-- IMPORTANTE: Esta migration substitui a policy antiga criada em
-- 20260123195408_user-role-visibility-policies.sql
-- A nova versão permite que usuários vejam suas próprias roles
-- OU que admins vejam roles de todos os usuários

CREATE POLICY "Ver proprias roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id  -- Usuário vê os próprios
  OR
  public.is_admin()      -- Admin vê todos (sem recursão)
);

-- =====================================================
-- 4. CRIAR POLICIES PARA TEACHER_EARNINGS
-- =====================================================

-- Policy para admins verem todos os ganhos
CREATE POLICY "Admins can see all teacher_earnings"
ON public.teacher_earnings
FOR SELECT
USING (public.is_admin());

-- =====================================================
-- 5. CRIAR POLICIES PARA ENROLLMENTS
-- =====================================================

-- Policy para admins verem todos os enrollments
CREATE POLICY "Admins can see all enrollments"
ON public.enrollments
FOR SELECT
USING (public.is_admin());

-- =====================================================
-- 6. CRIAR POLICIES PARA COURSES
-- =====================================================

-- Policy para admins verem todos os cursos
CREATE POLICY "Admins can see all courses"
ON public.courses
FOR SELECT
USING (public.is_admin());

-- =====================================================
-- 7. CRIAR POLICIES PARA PAYMENTS
-- =====================================================

-- Policy para admins verem todos os pagamentos
CREATE POLICY "Admins can see all payments"
ON public.payments
FOR SELECT
USING (public.is_admin());

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.is_admin() IS
'Verifica se o usuário atual tem role ADMIN. Usa SECURITY DEFINER para bypassar RLS e evitar recursão infinita.';

-- =====================================================
-- 9. NOTAS IMPORTANTES
-- =====================================================
-- Esta migration pode ser executada múltiplas vezes sem problemas (idempotente)
-- A função is_admin() usa SECURITY DEFINER para bypassar RLS dentro da função
-- Isso evita recursão infinita ao verificar roles
-- =====================================================
