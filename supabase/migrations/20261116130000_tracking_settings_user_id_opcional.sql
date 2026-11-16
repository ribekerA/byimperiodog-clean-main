-- tracking_settings.user_id deixa de ser obrigatorio.
--
-- A tabela nasceu com uma linha por usuario (user_id NOT NULL, usado por
-- /api/tracking/select). O painel Tracking & Pixels grava uma linha por
-- ambiente (upsert com onConflict "environment") e nao envia user_id. Como o
-- Postgres confere NOT NULL antes de detectar o conflito, o salvamento falhava
-- em 16/11/2026 com "null value in column user_id ... violates not-null
-- constraint", mesmo com a linha de producao ja existindo.
--
-- Rodado em producao pelo SQL Editor em 16/11/2026. Rodar de novo nao muda nada.

alter table public.tracking_settings alter column user_id drop not null;

notify pgrst, 'reload schema';
