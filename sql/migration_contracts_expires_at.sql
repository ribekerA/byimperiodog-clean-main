-- Adiciona expiração aos links públicos de contrato (/contract/[code], /contract/[code]/documento).
-- Contratos existentes recebem 90 dias de validade a partir de agora; novos contratos usam o default abaixo.
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at timestamptz;
UPDATE contracts SET expires_at = now() + interval '90 days' WHERE expires_at IS NULL;
ALTER TABLE contracts ALTER COLUMN expires_at SET DEFAULT (now() + interval '90 days');
