# Auditoria delta — 09/10/2026

## Baseline e limites

Missão recebida com título «11/10»; execução em 09/10/2026, sem antecipar datas.
Main confirmado no remoto: `b813be0654b924ba9acc6cec0ba953b09a590f7f`.
Produção consultada diretamente em https://byimperiodog.com.br.
Worktree isolada para preservar os cinco arquivos locais de proteção/compartilhamento de mídia, que não fazem parte desta publicação.
Google Ads, preços, estoque e cláusulas de desistência/devolução/transferência de reserva não serão alterados.

## Matriz registrada antes das correções

| Prioridade | URL/arquivo | Evidência | Impacto | Severidade / estado | Esforço / risco | Solução mínima |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | package.json / lock: Next 16.3.3 | npm audit em 09/10: versão afetada por GHSA-vcvr-r3jv-pc5j e GHSA-cjq9-62q9-8jv4, entre outros | Reduzir exposição do runtime | Advisory crítico/alto; exploração no site NÃO demonstrada | Médio / médio: exige build e smoke | Patch 16.3.8, mantendo a mesma linha; alinhar eslint-config-next |
| P1 | package.json / lock: sharp 0.35.4 | GHSA-wq5f-xc86-pv6w; patch 0.35.5 | Segurança do processamento de imagens | Advisory alto; exploração NÃO demonstrada | Baixo / médio: verificar mídia | Patch 0.35.5 |
| P2 | lock: brace-expansion / source-map-js | Auditoria aponta patches compatíveis | Reduzir risco de DoS nas ferramentas | Advisory alto; exposição pública não comprovada | Baixo / baixo | Atualizar apenas dentro das restrições já declaradas |
| P2 | scripts/psi-validation.mjs | Domínio Vercel antigo; três set(category) sobrescrevem categorias; FID ausente vira zero | Relatório de desempenho inválido | Comprovado, ferramenta de diagnóstico | Baixo / baixo | Domínio oficial, append das categorias, métricas ausentes nulas, separar campo/laboratório |
| P3 | src/lib/_generated-lastmod.ts | Teste de idempotência difere do gerador baseado em commits reais | Data de conteúdo desatualizada no artefato | Comprovado no artefato; não prova erro em produção, pois prebuild regenera | Baixo / baixo | Regenerar com ferramenta existente e revisar datas; sem relógio artificial |
| — | 97 URLs em produção | seo:audit:prod: 97 respostas, 0 erros, 32 avisos | Preservar rastreabilidade existente | JÁ CORRETO nos critérios automatizados | Nenhum | Não reescrever páginas por nota |
| — | 32 avisos SEO | 24 páginas sem imagem, 7 títulos longos, 1 canonical da rota redirecionada /preco-spitz-anao | Não são, isoladamente, defeitos comerciais | Não justificam alteração automática | Risco editorial maior que benefício não medido | Preservar; analisar contexto |
| — | Tailwind 3 / braces / selector parser | npm propõe migração de major para eliminar avisos transitivos | Migração visual poderia quebrar site | Pendente: avaliar alcance; sem exploração | Alto / alto | Não usar npm audit fix --force |
| — | 4 testes de varredura de arquivos | Timeout de 5s com execução paralela na OneDrive | Confiabilidade do diagnóstico | Causa ainda em confirmação | Baixo / baixo | Reexecutar com poucos workers, sem silenciar testes |

Fontes consultadas: [Next ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [Next otimizador de imagens](https://github.com/advisories/GHSA-cjq9-62q9-8jv4), [Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).

## Resultados finais

### Delta adicional confirmado antes da edição

| Prioridade | URL/arquivo | Evidência | Impacto | Severidade / estado | Esforço / risco | Solução mínima |
| --- | --- | --- | --- | --- | --- | --- |
| P2 | /filhotes; StaticCatalog.tsx / StaticPuppyCard.tsx | Lighthouse 12.8.2, 09/10 14:41 UTC: LCP 3589 ms; primeira foto sem fetchpriority=high, quatro imagens com preload | Foto principal disputa o carregamento no celular | Gargalo de prioridade comprovado; ganho ainda não medido | Baixo / baixo | Prioridade explícita só na primeira foto; preservar qualidade, fotos, ordem e layout |
| P2 | /api/media-likes?ids=... | Lighthouse registrou HTTP503 na ficha branca | Curtidas indisponíveis; foto/preço/WhatsApp independentes | Falha de serviço comprovada; causa de infraestrutura não confirmada | Depende de acesso ao banco / não migrar automaticamente | Inspecionar configuração sem segredos; manter ausência de contagem, nunca zero fictício |
| P2 | /blog/preco-spitz-alemao-anao; src/components/blog/Prose.tsx | Lighthouse em mobile e desktop: contraste 1,77:1 dos links (#34d399 sobre #faf5ef); preferência dark ativa verde claro mas fundo permanece claro | Leitura e acesso à vitrine prejudicados | Falha de acessibilidade comprovada | Baixo / baixo | Preservar o verde escuro já usado no modo claro também nos links sob preferência dark; testar ambos |

### 1. Notas medidas, sem nota geral inventada

Lighthouse 12.8.2, Chrome local contra produção, 09/10/2026, 14:40–14:46 UTC. Baseline **anterior** às correções desta auditoria. Mobile com simulação padrão; desktop com preset desktop. Não é experiência real p75. Houve outras tarefas locais durante parte da coleta; oscilações não provam ganho ou regressão. Alguns processos informaram EPERM ao limpar o perfil temporário após gerar o JSON; os 12 relatórios têm runtimeError nulo.

| URL | Perfil | Desempenho | Acessibilidade | Boas práticas | SEO | LCP ms | CLS | TBT ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| / | Mobile | 86 | 100 | 100 | 100 | 3009 | 0 | 233 |
| / | Desktop | 100 | 100 | 100 | 100 | 728 | 0 | 2,5 |
| /filhotes | Mobile | 84 | 100 | 100 | 100 | 3589 | 0 | 291,5 |
| /filhotes | Desktop | 100 | 100 | 100 | 100 | 614 | 0,0004 | 0 |
| /filhotes/spitz-alemao-anao-branco-femea | Mobile | 75 | 100 | 96 | 100 | 3729 | 0 | 367,5 |
| /filhotes/spitz-alemao-anao-branco-femea | Desktop | 100 | 100 | 96 | 100 | 667 | 0 | 0 |
| /reserve-seu-filhote | Mobile | 81 | 100 | 100 | 100 | 2407 | 0,0568 | 602,5 |
| /reserve-seu-filhote | Desktop | 100 | 100 | 100 | 100 | 615 | 0 | 0 |
| /blog/preco-spitz-alemao-anao | Mobile | 81 | 97 | 100 | 100 | 3326 | 0 | 361,5 |
| /blog/preco-spitz-alemao-anao | Desktop | 100 | 97 | 100 | 100 | 678 | 0 | 12,5 |
| /filhotes/sao-paulo | Mobile | 87 | 100 | 100 | 100 | 2801 | 0 | 354 |
| /filhotes/sao-paulo | Desktop | 100 | 100 | 100 | 100 | 576 | 0 | 0 |

INP: **NÃO MEDIDO** em todas as linhas; TBT não é INP. PageSpeed API: 12 consultas HTTP429. CrUX URL/origem: **NÃO MEDIDO — consulta indisponível por cota**, não prova ausência de amostra. Sem dados suficientes nesta auditoria para concluir aprovação dos CWV em campo. Segurança, conversão, conteúdo e indexação real não receberam pontuação artificial. SEO 100 não comprova ranking ou indexação.

Repetição pós-deploy nas duas páginas alteradas, 09/10/2026 16:51–16:52 UTC, mesmo Lighthouse, sem build/testes paralelos:

| URL | Perfil | Desempenho | Acessibilidade | Boas práticas | SEO | LCP ms | CLS | TBT ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| /filhotes | Mobile | 89 | 100 | 100 | 100 | 3198 | 0 | 232 |
| /filhotes | Desktop | 100 | 100 | 100 | 100 | 633 | 0 | 0 |
| /blog/preco-spitz-alemao-anao | Mobile | 84 | 100 | 100 | 100 | 3595 | 0 | 137 |
| /blog/preco-spitz-alemao-anao | Desktop | 99 | 100 | 100 | 100 | 756 | 0 | 0 |

Acessibilidade do artigo passou de 97 para 100, com falha específica de contraste eliminada. Catálogo mobile passou de 84 para 89 nesta amostra; **não é experimento controlado nem garantia de ganho permanente**. LCP mobile continua acima de 2,5s; ainda há espaço para investigação com amostras repetidas/campo. O artigo oscilou em LCP apesar de melhorar TBT: não atribuir variação de rede/CPU à mudança de cor. INP continua não medido. JSONs em .audit-evidence/lighthouse-after, todos sem runtimeError; dois avisos de limpeza de perfil temporário após medição.

### 2–3. Problemas e correções realmente realizadas

Patches Next 16.3.8 / eslint-config-next 16.3.8, sharp 0.35.5 e transitivas compatíveis. Sem migração de major. A ferramenta PSI agora consulta o domínio oficial, conserva todas as categorias, separa laboratório/campo e não transforma métrica ausente em zero. Três testes unitários cobrem esses casos.

No catálogo, somente a primeira foto recebe preload e fetchpriority alto; as demais continuam disponíveis com lazy loading. Fotos, capa, qualidade, ordem e preços preservados. Ganho de tempo ainda não comprovado por comparação controlada.

Links editoriais preservam o verde escuro legível sob preferência clara ou escura. O teste de navegador verificou rgb(4,120,87) e zero violações de contraste em ambas. Não houve rebranding. Lastmod regenerado pelo gerador existente com datas de commits reais; não houve atualização editorial fictícia.

### 4. JÁ CORRETO — NÃO MEXI

HTTPS e canonical non-www; redirecionamentos HTTP/www; robots e sitemaps; proteção de páginas privadas; contatos e jornada WhatsApp; consentimento; ordem dos destaques; capa branca; preço individual branca R$7.500 e preta R$9.500; reserva de 50%; textos de desistência, devolução de 70% e transferência; marca, paleta, domínio e slugs. Nenhuma campanha, lance, orçamento ou configuração Google Ads foi alterada.

Sem tabela universal por cor/sexo, sem novos animais, estoque, avaliações ou garantias inventadas. A fonte de catálogo ainda apresenta avisos de status explícito ausente em registros antigos; isso não autoriza inferir vendido/reservado/disponível. Os testes existentes confirmaram consistência dos valores e ausência de Offer/FAQPage indevidos nas superfícies verificadas.

### 5–6. Desempenho, indexabilidade e limites

97 URLs responderam à auditoria SEO: zero erros automatizados e 32 avisos (24 páginas sem imagem, sete títulos longos, canonical de rota redirecionada). Nenhum desses avisos, isoladamente, justificou reescrever conteúdo. Rastreamento adicional não encontrou links HTML internos quebrados. O artigo wolf-sable fora das listagens é exclusão deliberada em src/lib/content.ts, não remoção acidental: preservado.

18 rotas principais verificadas em produção: 18 aprovadas. Três URLs inexistentes retornaram 404 real; /preco-spitz-anao mantém 307 para /filhotes. Sitemap-index lista quatro arquivos, todos HTTP200: sitemap.xml (92 loc), posts (31), imagens (23), vídeos (13); sem lastmod futuro ou paths privados detectados. Quantidade de loc é a quantidade de páginas no XML, não a quantidade de todas as imagens.

Sem acesso verificado ao Search Console: cobertura, descoberta efetiva, canonical escolhido pelo Google e posição são **NÃO MEDIDOS**. Não foi solicitada indexação em massa. Conteúdo renderizado, headings, links, JSON-LD, imagens e navegação foram inspecionados pelos testes, sem garantia de resultado enriquecido. Não se alegou auditoria humana de cada frase, leitor de tela físico ou teste de todas as combinações de dispositivos.

### 7. Segurança: demonstrado versus não demonstrado

npm audit --omit=dev inicial: 12 pacotes afetados (1 crítico, 8 altos, 3 moderados). Após os patches: **8 (0 críticos, 5 altos, 3 moderados)**. São classificações dos advisories, não prova de exploração no site. Permanecem dependências transitivas da cadeia Tailwind/glob/seletores: migração maior não aplicada para evitar regressão visual. Requer avaliação separada; não declarar sistema livre de vulnerabilidades.

ImageResponse público inspecionado usa conteúdo estático, sem entrada maliciosa demonstrada; exploração RCE não foi realizada. Headers públicos observados: HSTS, nosniff, DENY e política de referrer. CSP não observado: melhoria pendente que exige inventário de scripts e rollout compatível com consentimento/GTM, não bloqueio cego.

119 verificações HTTP no build local passaram, incluindo acesso anônimo às APIs administrativas, páginas/documentos privados e busca de padrões de segredo no bundle público. Em produção, /api/admin/puppies retornou 401, /admin redirecionou ao login e contrato inexistente retornou 404 com noindex/no-store/no-referrer. Inspeção de código encontrou proteções de sessão, autorização, origem/CSRF, validação de uploads e assinatura/segredo dos webhooks. Isso não equivale a pentest ou prova de ausência de IDOR/XSS/SSRF em todas as rotas.

RLS e storage efetivos em produção **NÃO VERIFICADOS**; migrações no repositório não provam configuração aplicada. Limites em memória têm limitações entre instâncias. Não foram acessados dados de clientes, enviados webhooks reais nem expostos segredos.

O endpoint de curtidas retornou 503 em produção, causando boas práticas 96 na ficha branca. O frontend oculta a função indisponível sem inventar contagem zero. Consulta autorizada à configuração de ambiente retornou 404: não foi possível distinguir credencial ausente de RPC/banco indisponível. Nenhuma migração ou troca de credencial foi feita. Fotos, vídeos, preço e WhatsApp continuam independentes.

### 8. WhatsApp, consentimento e conversão

Na produção, seis simulações (home, ficha branca, reserva × consentimento sim/não): exatamente um whatsapp_click no dataLayer quando autorizado; zero quando recusado. Parâmetros de origem/item presentes, sem PII observada nesses eventos. Requisições externas, POST e abertura real de WhatsApp bloqueados no teste. Não foram geradas conversões ou leads reais.

Isso comprova comportamento do código no navegador, **não** ingestão no GA4/Google Ads nem configuração interna de tags no GTM. Diferença histórica entre 28 cliques e oito sessões não tem causa comprovada nesta auditoria. Não foi refeita a instrumentação que passou nos testes.

Teste dedicado adicional: antes da escolha, zero tentativas de tags opcionais; recusa persistiu após reload; alteração de preferências e aceite por categoria persistiram. GTM só foi solicitado após autorização (requisições interceptadas, sem envio real). As 42 verificações públicas foram repetidas após o deploy e novamente passaram.

### 9. Testes executados

- Unitários: 76 arquivos aprovados, um ignorado; 550 testes aprovados, três ignorados. Reexecução com um worker eliminou timeouts de varredura na OneDrive, sem mudar limites ou silenciar testes.
- TypeScript, lint (excluindo somente evidências temporárias), encoding, palavras banidas e git diff --check aprovados.
- Build Next 16.3.8: 148 páginas geradas; guards de catálogo, mídia, palavras-chave, conteúdo, fatos e preços aprovados. Banco administrativo não conectado no build local; não confundir stub local com configuração de produção.
- Playwright smoke + regressões novas: 23 aprovados, dois testes legados já ignorados; prioridade da imagem e contraste claro/escuro confirmados.
- Forense HTTP: 119/119; navegador desktop/mobile emulado: 21/21. Formulário com API interceptada, nenhum lead real.
- Produção: 42 verificações aprovadas, incluindo seis rotas nas larguras 320/360/390/430/768/1440, menu e seis simulações WhatsApp. Axe automático sem violações nos perfis claros amostrados; o defeito dark identificado pelo Lighthouse foi corrigido e retestado localmente.

Evidências brutas locais em .audit-evidence/lighthouse, live, crawl, psi, forensic-browser, forensic-http e npm-audit-final.json; reports/seo-audit.json no worktree original e reports/route-validation.json no isolado. Não versionadas para não publicar dados operacionais nem gerar ruído.

### 10. Git e publicação

Baseline remoto/produção b813be0654b924ba9acc6cec0ba953b09a590f7f; deploy anterior 6ac71d06c573370007deb27b. Alterações isoladas da edição local de proteção de mídia; os cinco arquivos locais permanecem fora do commit, sem serem descartados.

**Correções publicadas e comprovadas:** commit b5c717e1db93c67abbefaeb2e1f0f29af21276ed enviado à main, confirmado por git ls-remote e pela API Netlify; deploy 6ac91a59c91e4800081d2e25, production/ready, publicado em 09/10/2026 às 16:48:35 UTC (13:48:35 Brasília). Seis páginas HTTP200 após publicação, prioridades/capa/preço/contraste confirmados no navegador; 42 verificações pós-deploy sem falhas.

[CI completo aprovado](https://github.com/ribekerA/byimperiodog-clean-main/actions/runs/37961506921), incluindo tipos, testes, lint, build e smoke; [CodeQL aprovado](https://github.com/ribekerA/byimperiodog-clean-main/actions/runs/37961506982). Segunda execução local dos unitários também confirmou 550 aprovados/3 ignorados. Esta atualização final do relatório é documental e não altera a aplicação; seu SHA e eventual novo deploy serão informados no encerramento, sem fingir que um commit conhece seu próprio hash.

### 11–12. Pendências e impacto esperado

Prioridades seguintes: diagnosticar curtidas com acesso efetivo à configuração/banco; coletar CWV de campo e dados reais de conversão; avaliar dependências transitivas sem migração precipitada; revisão profissional de conteúdo veterinário e termos jurídicos quando necessária, sem mudar cláusulas nesta missão. Documentação, vacinação, exames, pedigree e depoimentos não foram verificados externamente animal por animal; não inventar comprovação.

Impacto esperado: menor exposição a advisories corrigidos, links mais legíveis, prioridade de rede mais coerente para a foto principal e diagnósticos futuros confiáveis. Não há aumento de vendas, posição, indexação, nota perfeita ou redução de custo já demonstrado por esses ajustes.
