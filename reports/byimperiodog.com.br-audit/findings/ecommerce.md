# E-commerce / vitrine de filhotes - byimperiodog.com.br
Fonte: On-page analysis (static, leitura do codigo). Sem DataForSEO (fora de escopo). Sem Product/Offer, Merchant Center ou Amazon, por decisao do dono.
Score: 74/100 (schema N/A; estrutura 80, conteudo unico 62, imagens 78, tratamento vendido 85, links internos 72, CTA 80)

## Contexto confirmado no codigo
- 12 fichas em content/puppies-static.ts: 10 divulgadas + 2 Cinza-Lobo (divulgar:false). Paginas sao "referencias visuais permanentes" (cor+sexo): sem status, sem 404, sem noindex.
- /filhotes: client component VitrineFilhotes, filtros de cor/sexo por useState (sem querystring). CollectionPage + ItemList + Breadcrumb JSON-LD. Pagina de puppy: WebPage + Breadcrumb (sem Product, correto).
- Sitemap: /filhotes, 10 fichas, cor/* e sexo/* divulgadas, 3 estados.

## Achados

### 1. Filtros e indexacao - OK (Baixo)
Filtros sao estado de React, sem parametros de URL: zero risco de explosao de facetas ou duplicata. As facetas indexaveis sao paginas proprias (/filhotes/cor/[cor], /sexo/[sexo]) com canonical proprio e no sitemap. Risco residual: HTML inicial do /filhotes ja traz todos os cards (bom). Fix opcional: nenhum.

### 2. Cinza-Lobo: 2 fichas + /cor/wolf-sable indexaveis fora da comunicacao (Medio)
Evidencia: [slug]/page.tsx e cor/[cor]/page.tsx nao emitem robots; generateStaticParams inclui wolf-sable; descricao publica diz "Cor nao divulgada pela By Imperio Dog" e a ficha mostra preco 8.500/6.500 (priceCents). Estao fora do sitemap e fora das vitrines, mas seguem rastreaveis e com paginas de oferta que contradizem a comunicacao. Fix: decisao do dono (ja registrada no codigo como pendente): ou 301 para /filhotes/cor/... mais proxima/ /filhotes, ou manter com noindex,follow e remover preco da ficha. Nao usar 404 se ja ha backlinks/indexacao; 301 e o caminho mais seguro.

### 3. Unicidade de conteudo das 12 fichas (Alto)
Evidencia: 10 de 12 descricoes sao a mesma frase-modelo ("Consulte a equipe para confirmar disponibilidade, documentacao e condicoes da reserva"), variando so cor/sexo. A descricao completa vai ate para meta description via resumirParaBusca. Tres pares sao quase-duplicatas de intencao: branco femea x branco femea-2, laranja femea x laranja femea-laco-rosa, e cada cor tem a ficha macho/femea com a mesma secao searchCopy (sectionTitle/introduction/3 cards identicos alem de cor/sexo/preco). Os H1 foram desenhados para nao colidir nos pares (puppy-search-copy.ts), mas o corpo e boilerplate. Risco: canibalizacao com /filhotes/cor/[cor] e "conteudo fino".
Fix: por ficha, 2 a 3 frases reais e verificaveis (idade/ninhada se for fato, pelagem observada, tipo de foto/video, o que a familia pode pedir), sem inventar fatos (ver memoria fatos-confirmados). Diferenciar os pares branco/laranja (consolidar com canonical na ficha principal ou noindex na segunda se nao houver diferenca real). Prioridade: pares duplicados > demais.

### 4. Preto macho com tratamento especial (Baixo)
puppy-search-copy.ts e [slug]/page.tsx trocam o "a partir de" por "valor cadastrado e referencia" so nessa ficha. Inconsistencia de CTA/preco entre fichas; ok se intencional, mas confirmar que a UI (PuppyDetailPanel, sticky CTA, card) nao mostra "A partir de R$ X no PIX" para essa ficha ao mesmo tempo.

### 5. Vendido/indisponivel - Boa pratica (nenhum problema)
Modelo "pagina de referencia permanente" (sem status, sem 404/410, URL e canonical estaveis, copy "confirmar opcoes atuais no atendimento") e a escolha correta aqui: nao ha perda de URL ao vender, e evita 404/410 em paginas com historico. Manter. Cuidado: foto de um animal ja vendido com "a partir de" e coerente; evitar texto que sugira o animal especifico fotografado (o codigo ja evita). Nao recomendar 410.

### 6. Imagens/alt (Medio)
- next/image com avif/webp automatico e sizes; priority na primeira. Bom.
- 122 JPG originais em public/filhotes (219 MB), 6 acima de 400 KB. O otimizador mitiga, mas o repositorio e a primeira busca pesada. Fix: converter/redimensionar os 6 maiores (<=2000 px, ~300 KB) para reduzir custo de otimizacao e cache miss.
- alt: descricaoDoFilhote devolve o mesmo texto para todas as fotos da galeria (so o lightbox acrescenta " - foto N"). Fix: variar alt pela cena ("no gramado", "no abeto", "de laco rosa") usando o nome do arquivo ou um campo opcional por imagem. Impacto: Google Imagens e acessibilidade.
- og:image usa a primeira foto sem dimensoes; ok.

### 7. Links internos entre fichas (Medio)
Cada ficha linka: breadcrumb, /filhotes/cor/[cor], /filhotes, 2 paginas de compra/blog, e ate 3 "Outros {cor}" da mesma cor. Lacunas: (a) cores com ficha unica (creme tem 2, preto 2, mas wolf excluido) mostram poucos ou nenhum relacionado; nao ha link para o sexo oposto nem para /filhotes/sexo/[sexo]; (b) sem relacionados para cores sem ficha; (c) /filhotes nao linka para as paginas /filhotes/cor e /sexo, so para os 3 estados, entao cor/sexo so recebem link das fichas e do sitemap. Fix: adicionar na /filhotes uma faixa de links "Ver por cor / por sexo" (links reais <a>, nao botoes) e na ficha o link "Ver {sexo oposto}" e /filhotes/sexo/{sexo}. Impacto: distribui PageRank e da caminho crawlable para as facetas.

### 8. Listagem /filhotes - estrutura (Baixo/Medio)
- Titulo "Filhotes de Spitz e Lulu: Cores, Sexos e Preços" prometeria preco; ok porque o card mostra "a partir de". Description fala "preços" - coerente.
- Cards tem H2 oculto (sr-only) e a grade e <ul>; FAQ visivel sem schema (correto desde 05/2026). 
- Filtros sao <button> JS: sem link para a combinacao cor+sexo (sem pagina "branco femea" alem da ficha). Aceitavel.
- Cores no filtro sem foto (chocolate, merle, particolor) levam a mensagem vazia + WhatsApp: bom, mas as paginas /cor/ dessas cores devem ter conteudo proprio, nao so lista vazia. Conferir ColorPageContent (nao auditado a fundo).

### 9. CTA (Baixo)
Botao "Ver disponibilidade no WhatsApp" com UTMs e data-wa-placement por posicao; CTA sticky no mobile; mensagem pre-preenchida cita a ficha. Claro e consistente com fechamento via WhatsApp. Melhoria: repetir o CTA e o preco "A partir de R$ X no PIX" acima da dobra tambem em mobile ja ocorre via painel resumo (summaryOnly). Sem acao critica.

## Priorizacao
1. Alto: diferenciar descricoes e resolver pares duplicados (branco/laranja femea).
2. Medio: decidir destino do Cinza-Lobo (301 ou noindex).
3. Medio: links crawlable para /cor e /sexo na /filhotes e relacionados cruzados; alt variado; comprimir os 6 JPG maiores.
4. Baixo: consistencia do preto macho.
