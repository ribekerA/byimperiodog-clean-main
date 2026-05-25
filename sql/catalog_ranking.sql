-- CatalogRankingAI: ranking por filhote para maximizar conversão
create table if not exists public.catalog_ranking (
  puppy_id uuid primary key references public.puppies(id) on delete cascade,
  score integer not null default 0,
  flag text,
  reason text,
  rank_order integer,
  updated_at timestamptz default now()
);

create index if not exists catalog_ranking_score_idx on public.catalog_ranking(score desc);
create index if not exists catalog_ranking_rank_idx on public.catalog_ranking(rank_order);

create or replace function public.set_catalog_ranking_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_catalog_ranking_updated_at on public.catalog_ranking;
create trigger trg_catalog_ranking_updated_at
before update on public.catalog_ranking
for each row execute function public.set_catalog_ranking_updated_at();
