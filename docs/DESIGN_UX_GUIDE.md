# Guia de Design & UX — By Império Dog

## 1. Identidade visual
- Mood: premium, confiável, afetuoso e profissional; evitar estética de petshop genérico.
- Cores: fundo off-white/ivory; texto primário cinza-900/800, secundário cinza-600; brand em verde-emerald para ação; acentos em âmbar/dourado para status; alertas em emerald/rose/amber (50/600); bordas/divisores cinza-200/300.
- Tipografia: H1 32–40/44, H2 24–28/34, H3 18–20/28; body 15–16/24; legendas 13–14/20; pesos 600 (headings), 500 (botões/labels), 400 (corpo).
- Botões: primary (bg brand, texto branco, shadow leve, raio 999px), secondary/outline (borda brand, texto brand, bg branco), ghost (sem borda, hover leve). Altura mínima 44–48px, foco visível.

## 2. Estrutura UX por página
- Home: hero com valor claro + CTA WhatsApp e ver filhotes; prova social; vitrine inicial; “como funciona”; FAQ curta; links para blog/conteúdo de confiança.
- Catálogo: título/sub com orientação de filtros; filtros visíveis; grid de cards; CTA global; FAQ curta; sticky CTA mobile opcional.
- Detalhe de filhote: galeria 4:3; nome/cor/sexo/idade/preço ou “sob consulta”; status; garantias/exames; CTA principal (WhatsApp/lead); depoimento/avaliação; FAQ; relacionados.
- Cor: H1 “Spitz cor X”, breve intenção, vitrine filtrada pela cor, CTA WhatsApp, links para cidades com disponibilidade e posts sobre a cor.
- Cidade: H1 “Spitz em [Cidade]”, explicação de entrega/atendimento, vitrine por região, depoimentos/logística, CTA forte, links para cores buscadas e FAQ de entrega.
- Blog: listagem com cards (imagem, título, resumo, tags cor/cidade/intenção); post com H1 único, corpo estruturado, CTA catálogo/WhatsApp, bloco de links internos e FAQ opcional.
- Admin: layout simples e legível em tablet; navegação lateral clara; formulários com labels acima e feedback imediato.

## 3. Padrões de componente
- Card de filhote: imagem 4:3 com placeholder, badge de status, preço; nome, cor, sexo, cidade/UF; CTA principal “Quero esse filhote”; CTAs secundários (vídeo, visita, detalhes) empilháveis no mobile; texto curto de confiança.
- Card de post: imagem 16:9/4:3, tags, título, resumo, “Ler mais”; data opcional.
- Depoimentos: nome + cidade, nota/selo, texto breve, avatar opcional; carrossel simples ou grid.
- Formulários: labels acima; ordem lógica (nome, WhatsApp, cidade/UF, preferências, mensagem, consentimento); placeholders apenas como apoio; mensagens de erro específicas; botão 48px com loading; aria-invalid/aria-describedby.

## 4. Princípios mobile
- Priorizar: headline + CTA principal; filtros em uma coluna; cards ocupando largura total (ou 2 colunas só em ≥sm).
- CTAs: botão principal destacado, secundários empilhados; sticky CTA apenas se não conflitar com footer.
- Tamanhos: tap target ≥44x44px; fonte mínima 15–16px para corpo; espaços verticais 12–20px entre blocos; imagens responsivas com aspect ratio e `sizes`.
- Evitar overflow: paddings horizontais consistentes (px-4/5/6), grids que colapsam para 1 coluna no xs; line-clamp onde textos longos possam quebrar layout.
