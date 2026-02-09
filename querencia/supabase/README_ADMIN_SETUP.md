# Setup de Administrador - Querência Platform

Este guia explica como configurar as permissões de administrador na plataforma Querência.

## 📁 Arquivos

### Migrations (Aplicadas Automaticamente)

- **`20260209000921_add_admin_policies.sql`** - Cria policies RLS para permitir que ADMINs vejam todos os dados
  - Cria função `is_admin()` que bypassa RLS
  - Cria policies para user_roles, teacher_earnings, enrollments, courses, payments

### Setup Manual

- **`setup_first_admin.sql`** - Script para adicionar o primeiro administrador (executar manualmente)

## 🚀 Como Configurar

### 1️⃣ Aplicar a Migration

A migration será aplicada automaticamente quando você executar:

```bash
npx supabase db reset
```

Ou se estiver em produção, execute o SQL da migration diretamente no Supabase Dashboard.

### 2️⃣ Adicionar Primeiro Admin

**Opção A: Usando o arquivo setup_first_admin.sql**

1. Abra o arquivo `supabase/setup_first_admin.sql`
2. Siga as instruções dentro do arquivo
3. Execute no SQL Editor do Supabase Dashboard

**Opção B: Query Rápida (Recomendado)**

Execute no SQL Editor substituindo seu email:

```sql
-- Adicionar ADMIN ao usuário por email
INSERT INTO public.user_roles (user_id, role_id)
SELECT
  u.id as user_id,
  r.id as role_id
FROM public.users u
CROSS JOIN public.roles r
WHERE u.email = 'seu@email.com'  -- ← SUBSTITUA AQUI
AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verificar
SELECT
  u.email,
  r.name as role_name
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE u.email = 'seu@email.com';
```

### 3️⃣ Fazer Logout e Login

**IMPORTANTE:** Você DEVE fazer logout e login novamente para que as roles sejam atualizadas.

No console do navegador (F12):
```javascript
localStorage.clear();
location.href = '/login';
```

### 4️⃣ Acessar Dashboard Admin

Após login, acesse: `/admin/dashboard`

## ✅ Verificação

Execute no SQL Editor para verificar se está tudo certo:

```sql
-- Ver todas as policies criadas
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_roles', 'teacher_earnings', 'enrollments', 'courses', 'payments')
  AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- Testar função is_admin (execute após fazer login)
SELECT public.is_admin() as sou_admin;
-- Resultado esperado: true
```

## 🔧 Troubleshooting

### Erro: "infinite recursion detected"

Se você ver este erro, significa que a migration antiga ainda está ativa. Execute:

```sql
-- Remover policies problemáticas
DROP POLICY IF EXISTS "Admins podem ver todos os user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Ver proprias roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuário vê seus cargos" ON public.user_roles;

-- Recriar a policy correta
CREATE POLICY "Users see own roles, admins see all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id OR public.is_admin()
);
```

### Erro: "Access Denied" mesmo sendo ADMIN

1. Verifique se você tem a role ADMIN:
```sql
SELECT r.name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
```

2. Faça logout e login novamente
3. Limpe o cache do navegador

### Função is_admin() não existe

Execute a criação da função manualmente:

```sql
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
```

## 📊 O que o Admin pode ver

Após configurar corretamente, o admin poderá:

✅ Ver todos os user_roles (de todos os usuários)
✅ Ver todos os teacher_earnings (receitas de todos os professores)
✅ Ver todos os enrollments (matrículas de todos os alunos)
✅ Ver todos os courses (cursos de todos os professores)
✅ Ver todos os payments (pagamentos de todos os usuários)

## 🔒 Segurança

A função `is_admin()` usa `SECURITY DEFINER` para:
- Executar com privilégios do dono da função
- Bypassar RLS apenas dentro da função
- Evitar recursão infinita nas policies

Isso é seguro porque:
- A função apenas VERIFICA se o usuário é admin
- Não modifica dados
- É marcada como STABLE (resultado não muda durante a transação)
- Usa `search_path = public` para prevenir ataques de search_path

## 📝 Notas

- Apenas usuários com role ADMIN podem ver dados de outros usuários
- Professores continuam vendo apenas seus próprios dados
- Estudantes continuam vendo apenas seus próprios dados
- A verificação é feita em tempo real a cada query
