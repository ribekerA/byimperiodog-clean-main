## Admin Auth (Atualizado)

Estratégia migrada de middleware para guard em layouts de route groups.

Estrutura:

```
app/(admin)/admin/
  (auth)/layout.tsx        -> chama redirectIfAuthed(); somente /admin/login
  (auth)/login/page.tsx    -> página de login (client)
  (protected)/layout.tsx   -> chama requireAdminLayout(); envolve ToastProvider
  (protected)/dashboard/... etc
```

`src/lib/adminAuth.ts` expõe:
- `requireAdminLayout()` para layout protegido
- `redirectIfAuthed()` para layout de login (evita mostrar login se já autenticado)
- `requireAdminApi(req)` para route handlers de API sob `/api/admin/*`

Removido middleware que causava erro runtime. Arquivo antigo `guard-layout.tsx` tornou-se placeholder.

Próximos passos sugeridos:
1. Aplicar `requireAdminApi` em handlers sensíveis que ainda não verificam cookie.
2. Converter página de login para server component + pequeno form client (reduzir JS enviado).
3. Excluir arquivo placeholder `guard-layout.tsx` após confirmar que nenhuma rota o referencia.
4. Adicionar testes e2e simples cobrindo fluxo de login e bloqueio de acesso direto a `/admin/dashboard` sem cookie.
# Gate de Admin por Senha (temporário)

Defina no `.env.local` (qualquer uma das variáveis abaixo é aceita):
```
# recomendada para também permitir chamadas de API com header x-admin-pass
NEXT_PUBLIC_ADMIN_PASS=coloque-uma-senha-forte

# alternativa equivalente suportada pelo backend
ADMIN_PASS=coloque-uma-senha-forte
```

Rotas:
- **/admin/login** — formulário de login.
- **POST /api/admin/login** — cria cookies `admin_auth=1` e `adm=true` (7 dias).
- **POST /api/admin/logout** — remove cookie.
- **middleware.ts** — protege todas as rotas `/admin/*` (redireciona para login) e aceita autenticação por cookie (`adm=true`) ou header `x-admin-pass` igual à senha definida (útil para scripts internos).

> Em produção, prefira autenticação real (Supabase Auth / NextAuth).
