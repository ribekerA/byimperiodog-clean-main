-- Fase 1: adicionar colunas canônicas (se não existirem) e backfill a partir da estrutura atual.
-- Tabela existente (amostra): id, created_at, updated_at, codigo, nome, sexo, cor, nascimento, pedigree, microchip,
-- preco, status, reserved_at, sold_at, customer_id, midia (JSON texto), notes, name, color, gender, price_cents, descricao

ALTER TABLE puppies ADD COLUMN IF NOT EXISTS name text;          -- já pode existir
ALTER TABLE puppies ADD COLUMN IF NOT EXISTS description text;   -- nova coluna canônica (espelha descricao)
ALTER TABLE puppies ADD COLUMN IF NOT EXISTS color text;         -- pode já existir
ALTER TABLE puppies ADD COLUMN IF NOT EXISTS media text[];       -- array simples de URLs derivado de midia JSON
ALTER TABLE puppies ADD COLUMN IF NOT EXISTS cover_url text;     -- primeira mídia (capa)
ALTER TABLE puppies ADD COLUMN IF NOT EXISTS price_cents integer;-- pode já existir
ALTER TABLE puppies ADD COLUMN IF NOT EXISTS updated_at timestamptz; -- auditoria homogênea

-- Backfill textual básico (não sobrescrever onde já há dado)
UPDATE puppies SET
  name        = COALESCE(name, nome),
  description = COALESCE(description, descricao),
  color       = COALESCE(color, cor)
WHERE TRUE;

-- Preencher price_cents a partir de preco decimal quando vazio/zero
UPDATE puppies SET price_cents = (preco * 100)::int
WHERE (price_cents IS NULL OR price_cents = 0) AND preco IS NOT NULL;

-- Extrair URLs de midia JSON (array de objetos {url,type}) -> media (text[]), ignorando textos inválidos
DO $$
DECLARE rec RECORD; urls text[]; first_url text; parsed jsonb;
BEGIN
  FOR rec IN SELECT id, midia FROM puppies WHERE media IS NULL AND midia IS NOT NULL AND midia <> '' LOOP
    BEGIN
      -- Tentativa de parse
      parsed := rec.midia::jsonb;
      -- Garantir que é array
      IF jsonb_typeof(parsed) <> 'array' THEN
        CONTINUE; -- não é array, ignora
      END IF;
      SELECT ARRAY_AGG(e->>'url') FILTER (WHERE (e->>'url') IS NOT NULL) INTO urls
      FROM jsonb_array_elements(parsed) e;
      IF urls IS NULL OR array_length(urls,1)=0 THEN
        CONTINUE; -- sem urls válidas
      END IF;
      first_url := urls[1];
      UPDATE puppies
        SET media = urls,
            cover_url = COALESCE(cover_url, first_url)
        WHERE id = rec.id;
    EXCEPTION WHEN others THEN
      -- JSON inválido: ignora linha e segue
      CONTINUE;
    END;
  END LOOP;
END $$;
-- Versão robusta a JSON inválido / strings truncadas
-- 1. Cria função de parse seguro que retorna NULL em caso de erro.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'safe_jsonb_puppies'
  ) THEN
    EXECUTE $$CREATE OR REPLACE FUNCTION safe_jsonb_puppies(txt text) RETURNS jsonb AS $$
    DECLARE j jsonb; BEGIN j := txt::jsonb; RETURN j; EXCEPTION WHEN others THEN RETURN NULL; END;
    $$ LANGUAGE plpgsql IMMUTABLE;$$;
  END IF;
END $$;

-- 2. Loop linha a linha: tenta JSON; se falhar, extrai URLs por regex.
DO $$
DECLARE rec RECORD; raw_text text; parsed jsonb; urls text[]; first_url text; tmp_urls text[]; elem jsonb;
BEGIN
  FOR rec IN SELECT id, midia::text AS midia_txt FROM puppies WHERE media IS NULL AND midia IS NOT NULL AND midia::text <> '' LOOP
    raw_text := rec.midia_txt;
    parsed := safe_jsonb_puppies(raw_text);
    urls := NULL;
    IF parsed IS NOT NULL AND jsonb_typeof(parsed) = 'array' THEN
      urls := ARRAY(SELECT DISTINCT e->>'url' FROM jsonb_array_elements(parsed) e WHERE (e->>'url') IS NOT NULL);
    END IF;
    IF urls IS NULL OR array_length(urls,1)=0 THEN
      -- fallback: extrair via regex simples
      SELECT ARRAY(SELECT DISTINCT m[1] FROM regexp_matches(raw_text, '(https?://[^"''\s,]+)', 'g') m) INTO tmp_urls;
      IF tmp_urls IS NOT NULL AND array_length(tmp_urls,1)>0 THEN
        urls := tmp_urls;
      END IF;
    END IF;
    IF urls IS NULL OR array_length(urls,1)=0 THEN
      CONTINUE; -- nada extraído
    END IF;
    first_url := urls[1];
    UPDATE puppies
      SET media = urls,
          cover_url = COALESCE(cover_url, first_url)
      WHERE id = rec.id;
  END LOOP;
END $$;

-- Definir capa como primeiro elemento de media
UPDATE puppies SET cover_url = media[1]
WHERE cover_url IS NULL AND media IS NOT NULL AND array_length(media,1) > 0;

-- Sincronizar updated_at onde nulo
UPDATE puppies SET updated_at = COALESCE(updated_at, created_at, NOW()) WHERE updated_at IS NULL;

-- View de transição com colunas canônicas
CREATE OR REPLACE VIEW puppies_canonical AS
SELECT id,
       name,
       description,
       color,
       status,
       price_cents,
       media,
       cover_url,
       gender,
       created_at,
       updated_at
FROM puppies;

-- Fase 2 (após verificação manual): remover colunas legacy duplicadas (nome, cor, descricao, midia JSON original se for substituída por media + cover_url).
