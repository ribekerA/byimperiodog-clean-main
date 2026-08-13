-- leads: estado, sexo_preferido e cor_preferida
--
-- O insert de app/api/leads/route.ts manda essas tres chaves em toda submissao
-- (estado e obrigatorio no zod; as outras duas saem como null quando vazias) e
-- o admin le as tres em leads/queries.ts. Nenhuma migration deste repositorio
-- as criava: existiam so no banco local, e em producao nunca existiram. Como o
-- PostgREST recusa o insert INTEIRO quando uma chave nao e coluna, o formulario
-- continuava sem gravar mesmo depois das 22 colunas de 20260813091500.
--
-- Sem CHECK de dominio de proposito. O banco local ja guarda 'Macho' e 'Fêmea'
-- com maiuscula e acento, vindos do admin; um check com o enum do zod
-- ('macho','femea','tanto_faz') aborta a migration nesses bancos e passaria a
-- recusar o que o admin escreve. Quem restringe o valor e o zod do endpoint
-- publico, onde a regra pertence.
--
-- Idempotente e nao destrutivo: colunas novas nascem NULL nas linhas antigas.

alter table public.leads add column if not exists estado         text;
alter table public.leads add column if not exists sexo_preferido text;
alter table public.leads add column if not exists cor_preferida  text;

comment on column public.leads.estado         is 'UF de quem preencheu. O formulario publico manda 2 letras maiusculas.';
comment on column public.leads.sexo_preferido is 'Preferencia declarada. Formulario publico: macho, femea ou tanto_faz.';
comment on column public.leads.cor_preferida  is 'Cor declarada no formulario. Texto livre — nao e a cor de nenhum filhote do catalogo.';
