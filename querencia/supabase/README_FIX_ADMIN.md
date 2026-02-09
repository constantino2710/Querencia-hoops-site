# 🛠️ CORREÇÃO: Erro 500 no Admin Dashboard

## 🔴 Problema Identificado

Quando você tenta fazer login como ADMIN, aparece erro 500 no console:

```
Failed to load resource: the server responded with a status of 500 ()
AuthContext.tsx:69 Erro ao buscar roles: Object
```

**Causa raiz:** A migration `20260209000921_add_admin_policies.sql` não foi aplicada no banco de dados, ou foi aplicada parcialmente. Isso faz com que a policy antiga (`"Ver proprias roles"`) ainda esteja ativa, impedindo o admin de ver dados de outros usuários.

## ✅ Solução Completa

### Opção 1: Aplicar o script de correção (Recomendado)

1. Abra o **Supabase Dashboard** > **SQL Editor**
2. Abra o arquivo `supabase/fix_admin_access.sql`
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor
5. Clique em **Run**
6. Verifique os resultados (devem aparecer mensagens de sucesso)

### Opção 2: Reset completo do banco (se você estiver em desenvolvimento)

```bash
cd querencia
npx supabase db reset
```

**⚠️ ATENÇÃO:** Isso apaga TODOS os dados e reaplica todas as migrations do zero.

## 📋 Passos Após a Correção

### 1. Limpar o Cache do Navegador

Abra o **Console** (F12) e execute:

```javascript
localStorage.clear();
location.href = '/login';
```

### 2. Fazer Login Novamente

- Faça login com suas credenciais de admin
- O AuthContext vai buscar suas roles novamente
- Agora deve funcionar sem erro 500

### 3. Verificar se Funcionou

Acesse: `/admin/dashboard`

Se tudo estiver correto, você verá:
- ✅ Receita total da plataforma
- ✅ Total de vendas
- ✅ Total de professores
- ✅ Total de estudantes
- ✅ Cursos publicados

## 🔍 Como Verificar se a Correção Foi Aplicada

Execute este SQL no **SQL Editor**:

```sql
-- 1. Verificar se a função is_admin() existe
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'is_admin';
-- Deve retornar 1 linha com: is_admin | true

-- 2. Verificar a policy correta em user_roles
SELECT policyname, qual::text
FROM pg_policies
WHERE tablename = 'user_roles';
-- Deve mostrar a policy "Ver proprias roles" com a condição incluindo is_admin()

-- 3. Testar a função is_admin() (faça login primeiro)
SELECT public.is_admin() as sou_admin;
-- Deve retornar: true (se você tiver role ADMIN)
```

## 🐛 Troubleshooting

### Erro: "function is_admin() does not exist"

Significa que a migration não foi aplicada. Execute o script `fix_admin_access.sql`.

### Erro: "infinite recursion detected"

Significa que a policy antiga ainda está ativa. Execute:

```sql
DROP POLICY IF EXISTS "Ver proprias roles" ON public.user_roles;
```

E depois reaplique a migration.

### Ainda dá erro 500 após correção

1. Verifique se você fez logout e login novamente
2. Limpe o localStorage do navegador
3. Verifique se você tem a role ADMIN:

```sql
SELECT r.name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = auth.uid();
```

4. Se não aparecer ADMIN, adicione:

```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
CROSS JOIN public.roles r
WHERE u.email = 'seu@email.com'  -- ← SUBSTITUA AQUI
AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;
```

## 📂 Arquivos Relacionados

- `supabase/migrations/20260209000921_add_admin_policies.sql` - Migration corrigida (idempotente)
- `supabase/fix_admin_access.sql` - Script de correção rápida
- `supabase/setup_first_admin.sql` - Script para adicionar primeiro admin
- `supabase/README_ADMIN_SETUP.md` - Documentação completa do setup de admin

## 💡 Por Que Isso Aconteceu?

1. A migration antiga criou a policy `"Ver proprias roles"` que só permite usuários verem suas próprias roles
2. A nova migration deveria substituir essa policy, mas:
   - Se você não rodou `db reset`, a migration não foi aplicada
   - Ou a migration foi aplicada mas a policy antiga não foi removida corretamente
3. Quando o AuthContext tenta buscar as roles, ele encontra a policy antiga que bloqueia o acesso
4. Isso causa erro 500 porque a query falha no RLS

## 🔒 Como a Correção Funciona?

1. **Cria a função `is_admin()`** com `SECURITY DEFINER`:
   - Essa função bypassa o RLS dentro dela
   - Ela consulta `user_roles` diretamente sem passar pelas policies
   - Retorna `true` se o usuário tem role ADMIN

2. **Remove todas as policies antigas** para evitar conflitos

3. **Cria a policy correta** `"Ver proprias roles"`:
   ```sql
   USING (
     auth.uid() = user_id  -- Usuário vê suas próprias roles
     OR
     public.is_admin()      -- Admin vê roles de todos (sem recursão!)
   )
   ```

4. **Cria policies de admin** para outras tabelas:
   - teacher_earnings
   - enrollments
   - courses
   - payments

## ✨ Resultado Esperado

Após a correção:

- ✅ Admin consegue fazer login sem erro 500
- ✅ Admin consegue ver dados de todos os usuários
- ✅ Dashboard admin mostra estatísticas reais
- ✅ Listagem de professores mostra todos os professores com stats
- ✅ Listagem de estudantes mostra todos os estudantes com stats
- ✅ Professores e estudantes continuam vendo apenas seus próprios dados

## 🆘 Precisa de Ajuda?

Se ainda estiver com problemas:

1. Verifique os logs do console (F12)
2. Execute as queries de diagnóstico acima
3. Verifique se todas as migrations foram aplicadas:

```bash
cd querencia
npx supabase db diff --use-migra
```

4. Se necessário, exporte seus dados, faça `db reset` e importe novamente
