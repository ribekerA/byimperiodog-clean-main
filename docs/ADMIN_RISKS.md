# Riscos e Prioridades – Admin (RISCO ZERO)

Este documento prioriza riscos (P0/P1/P2) e define critérios de sucesso para PRs pequenos e reversíveis.

## Critérios gerais
- Segurança primeiro: RBAC, validação (Zod + `safeAction`), rate limiting, idempotência.
- SEO off 100% do Admin (headers, metadata, sitemap); sem regressões.
- Acessibilidade AA: foco visível, tap targets ≥ 48px, roles/aria coerentes, focus-trap em diálogos.
- Performance: tabelas virtualizadas, imagens otimizadas, animações respeitam `prefers-reduced-motion`.
- Reversibilidade: mudanças atômicas, PRs pequenos com testes e logs de migração.

## P0 (bloqueadores – tratar primeiro)
1) Autenticação/Admin Guard
   - Verificar e reforçar RBAC em todas as páginas protegidas e handlers `/api/admin/**`.
   - Rate limit em endpoints sensíveis: login, autosave, AI, upload, revalidate.
   - Sessões/cookies: verificar secure/httponly/samesite e expiração.

2) Validações e Erros
   - Todas mutações com Zod + `safeAction` (ou pattern equivalente) e `AppError` consistente.
   - Idempotência para agendamentos e publish/unpublish (chave idempotente e controle de versão `updatedAt`).

3) Uploads/Arquivos
   - Sanitização nome e path; checagem MIME e tamanho; strip EXIF; extensão validada.
   - Bloquear uploads diretos sem validação central.

4) SEO Off e Exposição
   - Confirmar `X-Robots-Tag` em todas as respostas de `/admin` e `/api/admin`.
   - `metadata.robots` e `next-sitemap` alinhados (sem rotas internas indexáveis).

5) A11y AA em Fluxos Críticos
   - Tabelas com ações bulk, diálogos de confirmação, paginação/filtros.
   - Focus order lógico; elementos clicáveis são interativos; labels/aria para ícones.

## P1 (alto valor, baixo/medio esforço)
- Dashboard e Analytics
  - Garantir dados corretos, loading states acessíveis, alt/labels para gráficos.
  - KPIs com descrição e formato para leitores de tela.

- Editor/Wizard
  - Autosave com debounce e rate-limit; feedback aria-live; validações progressivas.
  - Gamificação: badges, progresso semanal, metas visíveis.

- Comentários/Moderação
  - Filas com virtualização; atalhos de teclado; confirmação com focus-trap.

## P2 (médio valor, médio esforço)
- Experimentos
  - Flagging segura; rollback rápido; logs de auditoria.

- SEO Tools internas
  - Sugestões com limites de requisição e caching; export acessível.

## Indicadores de sucesso
- Build: PASS; Lint/Typecheck: PASS; Testes unitários e 1-2 E2E chaves: PASS.
- PSI em páginas públicas sem regressão; Admin sem indexação; sem erro 5xx em `/api/admin` sob carga leve.

## Primeiros PRs (propostos)
P0-001: Reforçar rate limit em `login`, `autosave`, `ai/*`, `upload`, `revalidate`.
P0-002: Padronizar Zod + `safeAction` nas mutações restantes; mapear rotas fora do padrão.
P0-003: Upload seguro: MIME/size/EXIF/filename e erro consistente.
P0-004: A11y nas tabelas (bulk actions, paginação, focus states) e diálogos (focus-trap, rotulagem).
P1-005: Dashboard/Analytics com labels para gráficos, estados de loading e descrição textual resumida.

Nota: Cada PR deve listar rotas afetadas, contratos preservados, testes adicionados/atualizados e rollback simples.