-- =====================================================
-- FIX: Corrigir acesso do Admin e erro 500
-- =====================================================
-- Este script diagnostica e corrige o problema de acesso do admin
--
-- INSTRUÇÕES:
-- 1. Execute este script completo no SQL Editor do Supabase
-- 2. Verifique os resultados de cada seção
-- 3. Faça logout e login novamente no app
-- =====================================================

-- =====================================================
-- DIAGNÓSTICO 1: Verificar se a função is_admin() existe
-- =====================================================
SELECT
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'is_admin';

-- =====================================================
-- DIAGNÓSTICO 2: Ver todas as policies ativas em user_roles
-- =====================================================
SELECT
  policyname,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'user_roles';

-- =====================================================
-- DIAGNÓSTICO 3: Ver policies em outras tabelas críticas
-- =====================================================
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('teacher_earnings', 'enrollments', 'courses', 'payments')
ORDER BY tablename, policyname;

-- =====================================================
-- CORREÇÃO 1: Criar a função is_admin() (se não existir)
-- =====================================================
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
-- CORREÇÃO 2: Remover TODAS as policies antigas problemáticas
-- =====================================================
DROP POLICY IF EXISTS "Admins podem ver todos os user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Ver proprias roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuário vê seus cargos" ON public.user_roles;
DROP POLICY IF EXISTS "Users see own roles, admins see all" ON public.user_roles;

-- =====================================================
-- CORREÇÃO 3: Criar a policy correta para user_roles
-- =====================================================
CREATE POLICY "Users see own roles, admins see all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id  -- Usuário vê os próprios
  OR
  public.is_admin()      -- Admin vê todos (sem recursão)
);

-- =====================================================
-- CORREÇÃO 4: Criar/Atualizar policies para outras tabelas
-- =====================================================

-- TEACHER_EARNINGS
DROP POLICY IF EXISTS "Admins can see all teacher_earnings" ON public.teacher_earnings;
CREATE POLICY "Admins can see all teacher_earnings"
ON public.teacher_earnings
FOR SELECT
USING (public.is_admin());

-- ENROLLMENTS
DROP POLICY IF EXISTS "Admins can see all enrollments" ON public.enrollments;
CREATE POLICY "Admins can see all enrollments"
ON public.enrollments
FOR SELECT
USING (public.is_admin());

-- COURSES
DROP POLICY IF EXISTS "Admins can see all courses" ON public.courses;
CREATE POLICY "Admins can see all courses"
ON public.courses
FOR SELECT
USING (public.is_admin());

-- PAYMENTS
DROP POLICY IF EXISTS "Admins can see all payments" ON public.payments;
CREATE POLICY "Admins can see all payments"
ON public.payments
FOR SELECT
USING (public.is_admin());

-- =====================================================
-- VERIFICAÇÃO FINAL: Testar se está funcionando
-- =====================================================

-- 1. Verificar se a função foi criada
SELECT 'Função is_admin() criada:' as status,
       COUNT(*) > 0 as ok
FROM pg_proc
WHERE proname = 'is_admin';

-- 2. Verificar se as policies foram criadas
SELECT 'Policies criadas:' as status,
       COUNT(*) as total_policies
FROM pg_policies
WHERE policyname LIKE '%admin%' OR policyname LIKE '%Users see own%';

-- 3. Contar quantas policies existem em user_roles
SELECT 'Policies em user_roles:' as status,
       COUNT(*) as total
FROM pg_policies
WHERE tablename = 'user_roles';

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION public.is_admin() IS
'Verifica se o usuário atual tem role ADMIN. Usa SECURITY DEFINER para bypassar RLS e evitar recursão infinita.';

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================
-- Se tudo rodou sem erros:
-- 1. Faça logout no app
-- 2. Limpe o localStorage (F12 > Console):
--    localStorage.clear(); location.href = '/login';
-- 3. Faça login novamente
-- 4. Acesse /admin/dashboard
-- =====================================================
