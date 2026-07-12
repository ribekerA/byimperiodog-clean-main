-- Permite criar contratos sem filhote vinculado (fluxo já suportado pelo formulário de criação em /admin/contracts).
ALTER TABLE contracts ALTER COLUMN puppy_id DROP NOT NULL;
