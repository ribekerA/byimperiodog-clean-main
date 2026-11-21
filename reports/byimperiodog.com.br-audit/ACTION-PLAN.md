# Plano de ação — byimperiodog.com.br (17/11/2026)

Não há nenhum item Critical. Os itens marcados **[dono]** precisam de uma decisão ou de um fato que só você pode dar. Os demais são mudanças de código que posso fazer com sua aprovação.

## Fase 1 — Correções rápidas (esta semana)
1. **Contradição de preço por cor.** Trocar "Cada cor tem o seu valor de partida" em `src/components/sections/ColorGallery.tsx:66` e o título SEO "...: Cor e Sexo" do post de preço. O formato "A partir de R$ X no PIX" não muda.
2. **`/temperamento` com canonical errado.** Fazer 301 para `/blog/spitz-alemao-anao-temperamento`. Passar `/cuidados` e `/alimentacao` de página 200 com canonical para 301.
3. **CTR do cluster de preço.** Reescrever título e descrição de:
   - `/blog/preco-spitz-alemao-anao` (posição 5,5, CTR 0,26%);
   - `/blog/spitz-alemao-anao-preto` ("lulu da pomerania preto", posição 1,4, 0 cliques);
   - `/pomeranian`.
4. **Quantidades de ração.** Unificar uma só faixa nas 3 páginas e refazer o custo mensal a partir dela. **[dono: confirmar a faixa]**
5. **Erros pequenos.**
   - H1 "Pomerânia)em" nas páginas por estado.
   - Frase errada em `content/guides/index.ts:192`.
   - Comentários antigos sobre o FAQPage.
6. **Dados estruturados.**
   - Remover o Organization duplicado de `/contato` (ou apontá-lo para `#business`).
   - Tirar `makesOffer` e reescrever o `priceRange`.
   - Usar URL absoluta e autor nos BlogPosting de `/blog`.

## Fase 2 — Alto impacto (semanas 2–3)
7. **Canibalização.** Escolher uma página por tema nos 9 a 11 grupos de `/guias` × `/blog` e fazer 301 nas outras. A proposta de qual fica está em `findings/cluster.md`. **[dono: aprovar grupo a grupo]**
8. **Links internos no blog.** Aplicar a matriz de links de `findings/cluster.md` (hoje há 1 link entre posts).
9. **Desempenho.**
   - Adiar os widgets de cliente que não são essenciais, para reduzir a hidratação.
   - Usar `s-maxage` + `stale-while-revalidate` nas rotas estáticas.
   - Tirar o preload das imagens decorativas da home.
   - Comprimir a imagem do LCP do filhote e a capa do blog.
10. **WhatsApp na primeira tela do celular.** Colocar a bolha em `/filhotes` e um botão compacto no cabeçalho do celular. Isso não mexe no hero da home.
11. **Banner de cookies.** Depois do deploy, conferir se o commit 5ef2848 já reduziu a altura. O alvo é 110 px ou menos.
12. **Intenção de busca.** Fazer de `/filhote-de-spitz-alemao` a página para "filhote de lulu da pomerânia", com tabela de crescimento, e apontar o termo "spitz alemão anão" para `/spitz-alemao`.

## Fase 3 — Conteúdo e autoridade (mês 2)
13. **Autores.** Criar uma página ou seção dos autores e um parágrafo em `/sobre` dizendo quem toca o canil, só com fatos confirmados. **[dono: informações reais de Karen Cristina e Arthur Ribeker]**
14. **Páginas por estado.** Colocar um detalhe real de cada estado ou juntar as páginas em `/filhotes`. **[dono]**
15. **Descrições dos filhotes.** Escrever 2 a 3 frases verificáveis por filhote e diferenciar ou consolidar os pares quase iguais. **[dono: fatos de cada filhote]**
16. **Wolf Sable.** Decidir o que fazer com as páginas Wolf Sable indexáveis com preço: 301 para `/filhotes` ou noindex sem preço. **[dono]**
17. **Afirmações a confirmar.** "família Imperio", "primeira ninhada com registro oficial", "única raça", e o autor do post de apartamento. **[dono]**
18. **Newsletter.** Entregar o "guia do 1.º ano" prometido ou tirar a promessa. **[dono]**
19. **Vídeos.** Embutir vídeos do YouTube no post de preço, `/spitz-alemao`, `/lulu-da-pomerania` e `/sobre`.
20. **Datas.** Corrigir as datas de reserva dos posts (2025-06-01) e dos guias (2025-05-01) quando forem revisados de verdade.
21. **Posts novos (lacunas).** Tosa do Lulu, fase do patinho feio, "Lulu mini/micro/teacup existe?", colapso de traqueia (com revisão veterinária).
22. **"Lulu da Pomerânia" em toda frase.** Revisar as 115 frases que dizem só "Spitz", começando por outros-animais, apartamento e exercícios.

## Fase 4 — Monitoramento (contínuo)
23. **Perfil da Empresa no Google.** Conferir à mão a categoria principal, o horário 8h–22h, o atributo de visita agendada, o site e o telefone. **[dono]**
24. **`canilspitzalemao.com.br`.** Se ainda for seu, apontar o DNS e fazer 301 para o site. **[dono]**
25. **Search Console.** Cadastrar os sitemaps `posts`, `images` e `videos`. Tirar `sitemap.xml` da linha direta do robots ou os posts dele.
26. **Drift.** Já existe linha de base de `/`, `/filhotes`, `/blog`, `/sobre` e `/contato` (17/11). Rodar `seo-drift` depois de cada leva de mudanças.
27. **Core Web Vitals.** Comparar o campo por volta de 04/12/2026. Uma chave gratuita de PageSpeed/CrUX libera dados de campo e a fração do Lighthouse Agentic.
28. **Backlinks.** Uma chave gratuita da Moz permite comparar com os concorrentes.
29. **Menores.** HSTS com `includeSubDomains`, sitemaps vazios, `priority`/`changefreq`, alvos de toque de 44 px, robots duplicado na 404.
