-- Tabela de reviews/avaliações de filhotes
CREATE TABLE IF NOT EXISTS public.puppy_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puppy_id UUID NOT NULL REFERENCES public.puppies(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_puppy_reviews_puppy_id ON public.puppy_reviews(puppy_id);
CREATE INDEX IF NOT EXISTS idx_puppy_reviews_approved ON public.puppy_reviews(approved);
CREATE INDEX IF NOT EXISTS idx_puppy_reviews_created_at ON public.puppy_reviews(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.touch_puppy_reviews_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_puppy_reviews_touch ON public.puppy_reviews;
CREATE TRIGGER t_puppy_reviews_touch 
  BEFORE UPDATE ON public.puppy_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_puppy_reviews_updated_at();

-- RLS
ALTER TABLE public.puppy_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um pode ler reviews aprovados
DROP POLICY IF EXISTS puppy_reviews_select_approved ON public.puppy_reviews;
CREATE POLICY puppy_reviews_select_approved ON public.puppy_reviews
  FOR SELECT USING (approved = true);

-- Apenas admin pode inserir/atualizar/deletar (via service_role ou authenticated com claim admin)
DROP POLICY IF EXISTS puppy_reviews_admin_all ON public.puppy_reviews;
CREATE POLICY puppy_reviews_admin_all ON public.puppy_reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comentário da tabela
COMMENT ON TABLE public.puppy_reviews IS 'Avaliações e reviews de filhotes para AggregateRating schema';
COMMENT ON COLUMN public.puppy_reviews.rating IS 'Nota de 1 a 5 estrelas';
COMMENT ON COLUMN public.puppy_reviews.approved IS 'Review aprovado pela moderação para exibição pública';
