-- =====================================================
-- SETUP: ADICIONAR PRIMEIRO ADMINISTRADOR
-- =====================================================
-- Este arquivo deve ser executado MANUALMENTE no SQL Editor
-- após criar seu primeiro usuário na aplicação.
--
-- INSTRUÇÕES:
-- 1. Crie uma conta na aplicação (via /register)
-- 2. Obtenha seu user_id executando a query abaixo
-- 3. Execute o INSERT para adicionar a role ADMIN
-- 4. Faça logout e login novamente
-- =====================================================

-- =====================================================
-- PASSO 1: ENCONTRAR SEU USER_ID
-- =====================================================
-- Execute esta query e copie o 'id' que aparecer
-- Substitua 'seu@email.com' pelo email que você usou no registro

SELECT
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'seu@email.com'  -- ← SUBSTITUA AQUI
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- PASSO 2: ADICIONAR ROLE ADMIN
-- =====================================================
-- Cole o ID que você copiou no PASSO 1 abaixo
-- Exemplo: '70caa7eb-4178-4cf2-9cdc-d715f47a6080'

INSERT INTO public.user_roles (user_id, role_id)
SELECT
  'COLE_SEU_USER_ID_AQUI'::uuid,  -- ← SUBSTITUA AQUI
  r.id
FROM public.roles r
WHERE r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =====================================================
-- PASSO 3: VERIFICAR SE FOI ADICIONADO
-- =====================================================
-- Execute para confirmar que você agora tem role ADMIN

SELECT
  u.id,
  u.email,
  r.name as role_name
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'seu@email.com'  -- ← SUBSTITUA AQUI
ORDER BY r.name;

-- =====================================================
-- PASSO 4: TESTAR A FUNÇÃO is_admin()
-- =====================================================
-- Execute esta query para testar se você é reconhecido como admin
-- IMPORTANTE: Execute esta query APÓS fazer logout e login novamente

SELECT public.is_admin() as sou_admin;
-- Resultado esperado: true

-- =====================================================
-- ALTERNATIVA: ADICIONAR ADMIN POR EMAIL DIRETAMENTE
-- =====================================================
-- Se preferir, pode usar esta query que busca por email:

INSERT INTO public.user_roles (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM public.users u
CROSS JOIN public.roles r
WHERE u.email = 'seu@email.com'  -- ← SUBSTITUA AQUI
AND r.name = 'ADMIN'
AND NOT EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = u.id
  AND ur.role_id = r.id
)
ON CONFLICT (user_id, role_id) DO NOTHING;
