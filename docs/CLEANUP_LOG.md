# CLEANUP LOG (Fase A - Quick Wins)

Remoções aprovadas (backup / temporários / redundâncias de config):

| Item | Tipo | Motivo | Ação |
|------|------|--------|------|
| backup-07-09-25.zip | arquivo | Backup binário não versionado necessário | remover |
| backup-07-09.zip | arquivo | Backup antigo | remover |
| backup-30-08.zip | arquivo | Backup antigo | remover |
| bk.zip | arquivo | Redundante (conteúdo já em repo) | remover |
| bkp 12-09-2025.zip | arquivo | Backup recente local | remover |
| README-blog.md.bak | arquivo | Arquivo de backup de texto | remover |
| TEMP_blog_page_raw.txt | arquivo | Dump temporário | remover |
| TEMP_editor_full_before.txt | arquivo | Dump temporário | remover |
| TEMP_editor_snippet.txt | arquivo | Dump temporário | remover |
| TEMP_editor_status_block.txt | arquivo | Dump temporário | remover |
| TEMP_posts_raw.txt | arquivo | Dump temporário | remover |
| .eslintrc.json | config | Substituído por .eslintrc.cjs mais completo | remover |

Observação: pasta `bk/` ainda não removida nesta etapa (agendar decisão posterior) — pode conter referência que o usuário queira consultar antes.

---
Remoções executadas em: 2025-09-15T00:00:00Z (UTC aprox.)
Status: Todos os itens listados removidos com sucesso. `.eslintrc.json` substituído definitivamente por `.eslintrc.cjs`.

Próximos candidatos (avaliar antes de agir):
- pasta `bk/` (dup completo do root)
- diretório `coverage/` (pode ser gerado em CI, considerar ignorar no VCS se não for necessário)
- arquivos `.run_dev_*` (logs transitórios)

## Atualização 2025-10-03: Correção de Mojibake

Ocorrência isolada de mojibake (UTF-8 interpretado como ISO-8859-1) encontrada em `archive_routes/app_site_backup/page.tsx` e corrigida.

Substituições aplicadas:
| Antes | Depois |
|-------|--------|
| Spitz Alemão Anão | Spitz Alemão Anão |
| excelência | excelência |
| responsável | responsável |
| pós-venda | pós-venda |
| disponíveis | disponíveis |

Ferramentas adicionadas:
- `scripts/fix-encoding.mjs` (varre e corrige mojibake comum)
- Scripts npm: `fix:encoding:dry` (dry-run) e `fix:encoding` (write)

Recomendação: executar `npm run fix:encoding:dry` em PRs com grande volume de texto para prevenir regressões.
