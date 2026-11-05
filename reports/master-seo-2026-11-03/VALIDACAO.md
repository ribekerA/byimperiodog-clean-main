# Evidências de validação

Executadas nesta rodada, sem publicar, clicar em anúncio ou enviar contato.

| Verificação | Resultado | Evidência |
|---|---|---|
| Typecheck | `npm run typecheck`: exit 0 | `typecheck.log` |
| Lint do projeto | Exit 0 após corrigir separação de imports no teste novo | `lint.log` |
| Lint de ferramentas e alteração final do card | Exit 0 | `lint-final.log`, `lint-card.log` |
| Vitest completo | 509 passaram, 4 excederam 5 s, 3 ignorados | `tests.log` |
| Reexecução dos quatro arquivos afetados por timeout | 34 testes passaram, sem falha de asserção | `tests-retry.log` |
| Testes finais de busca e formato de preço | 16 passaram | `tests-final.log` |
| Prebuild | Catálogo, vitrine, conteúdo, verdade pública e 30 MDX passaram nos gates existentes; quatro avisos de mídias reutilizadas | `build.log` |
| Build inicial | Exit 0; 143 páginas estáticas geradas | `build.log` |
| Build final após imagens/aria-label | Exit 0, incluindo TypeScript e prebuild | `build-final.log` |
| Browser Chromium 390/1280 px | Busca, orçamento, cor ausente, localização, pedido não suportado, link WhatsApp e link Google passaram | `browser-retry.log`, `browser-check.json` |
| Acessibilidade da seção de catálogo | Axe não encontrou violações no escopo executado em ambos os tamanhos | `browser-check.json` |
| Responsividade | Sem overflow horizontal nos dois tamanhos; imagens de evidência salvas | `catalog-390.png`, `catalog-1280.png`, `google-390.png`, `google-1280.png` |
| Links novos / metadados | 10 páginas HTML responderam 200, com um H1 e canonical; JSON-LD parseável; robots e sitemap responderam 200; sitemap local com 90 URLs | `local-routes.json` |
| Auditoria pública | 24 URLs coletadas; dois 404 são caminhos alternativos de sitemap, com os sitemaps declarados respondendo 200 | `public-audit.json` |

Somando os casos distintos da suíte e a reexecução dos timeouts, os 513 testes não ignorados passaram. Não se afirma que a primeira execução completa foi verde. Ela falhou por quatro timeouts; a repetição usou um worker e timeout de 20 s. Existem avisos legados de Vite/hoisting; não foram ocultados.

No primeiro teste de navegador, o cenário desktop excedeu o tempo ao preencher antes de estabilizar a interação. O teste passou após esperar uma interação com o banner (rejeitar cookies), sem alterar o código da busca. Testes bloquearam serviços externos e APIs de lead/IA/analytics. A verificação de WhatsApp leu apenas o href. O teste de navegador ocorreu no servidor de desenvolvimento: não certifica integrações remotas nem dispositivos físicos.

## Performance de laboratório

Primeira medição Lighthouse 12.8.2 no build local de `/filhotes`, mobile simulado: desempenho 78, acessibilidade 100, boas práticas 100, SEO 100; LCP 5,6 s, CLS 0, TBT 110 ms e FCP 1,1 s. `lighthouse-catalog.json` guarda o resultado. LCP acima da meta; a nota SEO não mede posicionamento.

O relatório identificou o H1 como LCP, predominando atraso de renderização. Também apontou imagens grandes e divergência entre texto visível e nome acessível de CTA. Foram corrigidos os dois últimos: mesmas fotos servidas por Next Image com sizes e link incluindo “Consultar opções atuais” no aria-label. Não atribuir o atraso do H1 exclusivamente às imagens sem perfil adicional. TBT não é INP; não houve medição de INP de campo. Um teste sintético não comprova melhoria de p75.

Medição final, após novo build: desempenho **94**, acessibilidade **100**, boas práticas **100**, SEO **100**; LCP **2,9 s**, CLS **0**, TBT **148 ms**. A checagem de correspondência entre rótulo e texto passou. A auditoria ainda sugere dimensionamento adicional de imagens. O LCP continua acima de 2,5 s. Duas execuções locais com caches/condições diferentes não isolam causalidade nem substituem uma série de medições comparáveis e CWV de campo. Evidências: `lighthouse-catalog-final.json` e `performance-summary.json`.

## Limitações reais

- Build teve falhas de leitura remota `site_settings` e usou fallback; compilação bem-sucedida não valida Supabase/contas em produção.
- Sem teste de envio real de formulário, reserva, anúncio ou conversão offline.
- Voz não foi exercitada com áudio real nem chamada paga. Auditoria de código e plano constam do relatório.
- Sem acesso autenticado a Google Ads, GA4, Search Console ou conjunto completo de avaliações Google.
- Sem baseline de campo, comparação anual, auditoria completa de backlinks, pentest ou validação clínica dos artigos.
- O build gerou referências locais em `next-env.d.ts`; não publicar pastas `.next-master-*`. Os arquivos gerados e as mudanças anteriores do checkout devem ser revisados antes de qualquer deploy.
