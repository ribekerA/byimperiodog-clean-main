# Seção de confiança — referência visual adaptada

## Versão atual — aparência familiar do Google

Revisão final solicitada: fundo cinza claro, cards brancos com borda neutra, autor e avatar de inicial no topo, estrelas amarelas, links azuis e resumo 4,9/35 em destaque. Comentários longos têm “Ler mais” e “Mostrar menos”, mantendo o texto completo no HTML. Substitui a composição dourada descrita no histórico abaixo. Dados importados manualmente dos prints; sem sincronização automática ou publicação.

Validação desta versão: lint e build passaram. Chromium em 1440/390 px confirmou 47 cards (33 Google e 14 relatos anteriores), navegação, expansão/recolhimento dos comentários, ausência de overflow horizontal e zero violações axe na seção. Logs: google-style-lint.log, google-style-build.log e google-style-browser.log. Capturas atuais: google-reviews-1440.png e google-reviews-390.png. Build utilizou fallback de site_settings por indisponibilidade do acesso remoto.

Atualização visual solicitada: maior destaque, título centralizado “Quem conhece, recomenda.”, fundo claro em degradê, bordas douradas, nota em tamanho grande e cards com nome/identificação do Google no topo. Largura de 340 px no desktop permite visualizar mais avaliações simultaneamente. Dados, textos, nota e contagem preservados; sem selo de certificação ou autoplay.

## Atualização com avaliações Google fornecidas pela proprietária

Acrescentados 33 avaliadores únicos transcritos dos prints, junto dos 14 relatos anteriores preservados. Resumo do Google: 4,9/5 e 35 avaliações, com conferência em 03/11/2026. A lista é uma amostra; total dos cards não é total do Google. Um print repetido foi deduplicado. Textos incompletos estão explicitamente marcados como trechos e avaliações sem texto visível recebem somente a nota. Não usadas respostas da empresa como relatos de clientes. Origem identificada em cada card, sem novos schemas de avaliações. Detalhes em google-source.md; dados em content/google-reviews.ts. Importação manual, sem sincronização automática nem publicação.

## Histórico da composição anterior à importação

Validação da importação: lint e build (com TypeScript) passaram. Chromium em 1440/390 px confirmou 33 cards Google, 47 totais, resumo 4,9/35, setas funcionando e nenhuma violação axe na seção. Sem overflow horizontal com os estilos reais. Duas tentativas do teste modificavam a contenção de galerias para captura e produziram overflow artificial; essa alteração de teste foi retirada, sem modificar o layout da aplicação. Evidências em google-import-validation.json, google-import-browser-final.log e google-import-build.log. O build teve fallback de site_settings por acesso remoto indisponível. Capturas atuais: google-reviews-1440.png e google-reviews-390.png.

Composição original para By Império Dog: fundo marfim, título editorial, painel verde escuro de acesso ao Google e cards de relatos com navegação manual. Sem autoplay, bibliotecas novas ou widget externo. No mobile, os cards têm largura de 88% para sinalizar continuidade.

Os 14 registros de depoimentos foram preservados integralmente (comparação do bloco TESTIMONIALS antes/depois). Nomes, fotografias, textos e estrelas não foram copiados do concorrente. Os cards são identificados como relatos enviados pelas famílias. O painel Google aponta à fonte original; não há nota média, quantidade ou selo inventado. A integração de avaliações Google continua pendente de identificação/autorização da fonte.

TextTestimonials agora é renderizado diretamente na home como componente de servidor; ReviewCarousel contém somente interação, respeita movimento reduzido e permite teclado, gestos e botões anterior/próximo. O GoogleReviewsSection passou a ser o painel lateral, eliminando a duplicação anterior de duas seções.

Verificação Chromium em 1440 e 390 px: 14 cards, navegação anterior/próximo funcionando, sem overflow horizontal e nenhuma violação axe WCAG A/AA no escopo da seção. Dados em validation.json. Lint dos arquivos alterados passou. Os primeiros typecheck/build encontraram um arquivo gerado de desenvolvimento inválido em `.next-master-preview/dev/types/validator.ts`; foi preservado como evidência e removido do cache, sem alterar código para mascarar o erro. Logs finais separados.

Previews: reviews-1440.png e reviews-390.png. Capturas de desenvolvimento; não houve deploy. Backups locais de home e TextTestimonials nesta pasta. Não reverter o repositório inteiro para desfazer esta alteração: há mudanças anteriores de outras tarefas.

Resultado final: build e typecheck passaram, além do lint e dos testes de navegador. O build usou fallback para site_settings por falha de acesso remoto; não valida integrações em produção. Evidências em build-final.log e typecheck-final.log.
