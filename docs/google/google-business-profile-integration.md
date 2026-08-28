# Integração do site com o Perfil da Empresa no Google

Auditoria realizada em 27/08/2026 no perfil administrado pela By Império Dog.

## Identidade confirmada

- Link compartilhado pela responsável: `https://share.google/MSyTFYlToPGViYp32`
- Knowledge Graph ID resolvido pelo Google: `/g/11gpnjwc18`
- Perfil público estável usado pelo site: `https://www.google.com/search?kgmid=/g/11gpnjwc18`
- Formulário oficial de avaliação, obtido em **Solicitar avaliações**: `https://g.page/r/CT2ftXTDDxpAEAI/review`

O link compartilhado abre uma busca que resolve para o perfil correto, mas não é
um formulário de avaliação. Por isso há duas constantes: uma para consultar o
perfil e outra para escrever a avaliação.

## O que o site conecta

- `LocalBusiness.sameAs` identifica o Perfil da Empresa como presença oficial.
- `LocalBusiness.hasMap` aponta para a entidade real, não para uma busca genérica
  por Bragança Paulista.
- Rodapé e página de contato oferecem links permanentes para o perfil.
- O componente de avaliação abre diretamente o formulário oficial.
- O texto solicita apenas experiências reais e não pede nota específica.
- A nota e a quantidade de avaliações não são copiadas para o código. Esses
  números mudam e a fonte viva permanece no Google.

## Ecossistema Google já relacionado ao site

- Search Console: verificação de domínio suportada pelo layout e integração de
  leitura disponível no painel administrativo.
- Google Tag Manager, GA4 e Google Ads: configuração centralizada e condicionada
  ao consentimento; eventos comerciais continuam separados de pageviews.
- Perfil da Empresa: o perfil confirmado já informa o site, telefone, WhatsApp,
  horário, publicações e redes sociais.
- SEO local: um único nó `LocalBusiness` é publicado no site inteiro e agora
  referencia o perfil oficial.
- Vídeos: watch pages e sitemaps individuais permitem inspeção e indexação no
  Search Console depois da publicação.

## Por que a API do Business Profile não foi adicionada agora

A API é adequada quando existe uma necessidade operacional clara, como reunir
avaliações num painel interno, responder avaliações, sincronizar publicações ou
consultar métricas do perfil em escala. Ela exige projeto no Google Cloud,
aprovação de acesso, OAuth, consentimento da conta administradora, armazenamento
seguro e renovação de tokens.

Para um único perfil, adicionar essa infraestrutura apenas para mostrar um link
de avaliação aumentaria superfície de falha e acesso sem benefício proporcional.
O vínculo público por `sameAs`, `hasMap` e links oficiais é direto, rastreável e
não depende de segredo. A API pode ser uma segunda fase quando houver uma função
de administração que realmente a consuma.

## Próximas ações externas, somente após aprovação

1. Conferir no Perfil da Empresa se o campo **Site** aponta para a URL canônica.
2. Se for desejável medir visitas originadas do perfil, usar no campo Site uma
   URL com UTM dedicada, por exemplo:
   `https://byimperiodog.com.br/?utm_source=google&utm_medium=organic&utm_campaign=google_business_profile`.
3. Após publicar as watch pages, enviar ou reinspecionar
   `/sitemaps/videos.xml` no Search Console.
4. Acompanhar cliques de saída e tráfego `google / organic` no GA4 sem marcar
   visualização de perfil como venda ou lead.
5. Só iniciar a API se for aprovado um escopo concreto, mínimo e somente de
   leitura ou resposta, com tokens exclusivamente no servidor.

## Referências oficiais

- Solicitar avaliações: https://support.google.com/business/answer/16816815
- Visão geral das APIs: https://developers.google.com/my-business
- Requisitos de acesso às APIs: https://developers.google.com/my-business/content/faq
- Dados estruturados LocalBusiness: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Diretrizes gerais de dados estruturados: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- SEO de vídeos: https://developers.google.com/search/docs/appearance/video
- VideoObject: https://developers.google.com/search/docs/appearance/structured-data/video
