# Cobertura de busca da By Império Dog

Implementação revisada em 12/09/2026. A fonte editorial é `content/search-topics.ts`; a vitrine usa `content/puppy-search-copy.ts` e os preços de `domain/pricing`. A central de navegação é `/guias`.

## Objetivo e alcance

Cobrir as intenções relevantes para quem pesquisa Spitz Alemão Anão, Lulu da Pomerânia e Pomeranian, desde a primeira dúvida até compra e cuidados. Cada consulta cadastrada tem uma página principal; artigos de apoio respondem perguntas complementares e levam a páginas relacionadas. Isso não impede sobreposição semântica nos resultados e precisa ser acompanhado no Search Console.

“100%” só pode significar cobertura do mapa cadastrado e validação técnica. Não significa capturar todas as buscas, dominar todas as posições, obter nota 10 no Ads ou sincronizar automaticamente plataformas externas.

| Frente | Conteúdo e destino | Uso em mídia paga |
| --- | --- | --- |
| Compra | Canil, vitrine, preços, documentação e reserva | Prioridade para intenção comercial |
| Raça | Spitz, Lulu, Pomeranian, diferenças, fotos e vídeos | Testes separados conforme intenção |
| Escolha | Cores, sexos e fichas de referência | Anúncio específico para destino específico |
| Rotina | Apartamento, crianças, latidos, nomes e convivência | Aquisição orgânica; avaliar separadamente antes de financiar |
| Cuidados | Alimentação, higiene, saúde e chegada | Conteúdo de apoio; encaminhamento veterinário quando necessário |
| Região | Base em Bragança Paulista; SP, MG, RJ e transporte | Segmentação compatível com atendimento real |

## Evidência de demanda

Foi consultado `search_term_view` da conta Google Ads nos últimos 30 dias, com uma amostra de até 100 linhas ordenadas por cliques. Termos observados incluem `canil lulu da pomerania`, `spitz alemão branco`, `lulu da pomerânia branco valor`, `filhote de spitz alemão fêmea`, consultas de Campinas e Piracicaba, nomes e apartamento. Isso confirma a existência dessas intenções na conta; não é uma estimativa de volume total nem um relatório de todo o mercado.

O artigo `/blog/nomes-lulu-da-pomerania` atende uma lacuna observada. Não foram criadas cópias desse artigo por cor, sexo ou município. Nenhum endereço comercial foi inventado para cidades atendidas.

## Próxima revisão no Google Ads

- Separar intenção comercial genérica de cor/sexo: busca de fêmea preta deve levar à referência preta fêmea; busca genérica pode levar à vitrine ou categoria apropriada.
- Para anúncios de canil, comparar a página atual `/filhotes` com a apresentação real do canil na home; para preço sem cor definida, usar `/preco-spitz-anao` como candidato. Validar mensagem, URL e rastreamento juntos antes de alterar.
- Avaliar os grupos brancos sobrepostos com dados de termos, contatos qualificados e custo. Evitar concluir rentabilidade pelo histórico anterior à correção das conversões.
- Revisar termos de nomes e consultas educativas nas campanhas comerciais. Caso sejam negativados, aplicar por campanha/grupo e intenção, preservando a cobertura orgânica; não negativar automaticamente palavras genéricas como `preço`, `valor` ou nomes de cores.
- A expansão inicial pode usar correspondência de frase e exata. Correspondência ampla, novas campanhas e orçamento exigem desenho e avaliação de resultados próprios; este deploy não aplica essas mudanças.

## Medição

- Search Console: consulta, página, impressões, cliques, CTR, posição, dispositivo e país; comparar quais páginas recebem a mesma intenção antes de decidir consolidações.
- GA4: página de entrada, origem/mídia, campanha, engajamento, clique no WhatsApp e `generate_lead` confirmado. Um clique no WhatsApp não equivale a uma venda.
- Google Ads: termos de busca, componentes do Índice de Qualidade por palavra-chave, custo e conversões. O índice é diagnóstico, não promessa de redução de CPC.
- CRM/atendimento: lead qualificado, proposta, reserva e venda. Importação de resultados offline é uma etapa posterior dependente de dados confiáveis e integração testada.
- O mapa não adiciona cookies, coleta de dados pessoais nem eventos duplicados; segue a medição e o consentimento já implementados.

## Manutenção

`npm run seo:keywords` valida destinos e duplicação de consultas cadastradas. `npm run seo:keywords -- --csv` imprime o mapa de consultas e URLs para análise ou preparação de campanhas; não grava alterações nas contas Google.

O build executa essa auditoria. Toda nova página precisa de intenção distinta, conteúdo útil e links de entrada. Para um artigo novo, registrar `target_query`, `search_demand_source`, `search_demand_date` e `conversion_goal`, e executar `npm run gate:strict`.

Referências: [Guia de SEO do Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=pt-br), [políticas sobre excesso de palavras-chave e páginas de entrada](https://developers.google.com/search/docs/essentials/spam-policies?hl=pt-br), [Índice de Qualidade](https://support.google.com/google-ads/answer/6167118?hl=pt-BR).
