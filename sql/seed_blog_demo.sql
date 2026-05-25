-- Seed demo content for blog (posts + comments)
-- Safe to run multiple times due to ON CONFLICT

-- Authors (optional)
insert into public.blog_authors (id, name)
values
  (gen_random_uuid(), 'Equipe By Império Dog')
on conflict do nothing;

-- Posts
insert into public.blog_posts (
  slug, title, subtitle, excerpt, cover_url, content_mdx, status, published_at, seo_title, seo_description, og_image_url
) values
(
  'como-cuidar-do-seu-spitz-alemao-anao',
  'Como cuidar do seu Spitz Alemão Anão',
  'Dicas práticas para os primeiros meses',
  'Guia rápido para alimentação, higiene, vacinas e rotina do seu Spitz Alemão Anão (Lulu da Pomerânia).',
  '/spitz-hero-desktop.webp',
  '# Alimentação\n\n- Ração de qualidade para filhotes\n- 3 a 4 pequenas refeições\n- Água fresca sempre disponível\n\n## Higiene e escovação\n\nEscove 2–3x por semana e use produtos próprios para pets.\n\n## Rotina e enriquecimento\n\nPasseios curtos, brinquedos interativos e reforço positivo.\n',
  'published',
  now() - interval '30 days',
  'Como cuidar do seu Spitz Alemão Anão | Dicas essenciais',
  'Alimentação, higiene, vacinas e rotina para os primeiros meses do seu Spitz Alemão Anão.',
  '/spitz-hero-desktop.webp'
),
(
  'spitz-alemao-anao-personalidade-e-convivio',
  'Spitz Alemão Anão: personalidade e convívio',
  null,
  'Temperamento, socialização e dicas para conviver bem com crianças, idosos e outros pets.',
  '/spitz-hero-mobile.png',
  '# Personalidade\n\nSão dóceis, curiosos e comunicativos.\n\n## Convívio\n\nParticipam da rotina e se adaptam bem com socialização adequada.\n',
  'published',
  now() - interval '15 days',
  'Spitz Anão: personalidade e convívio',
  'Veja como é a personalidade do Spitz Alemão Anão e como conviver bem em família.',
  '/spitz-hero-mobile.png'
)
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  excerpt = excluded.excerpt,
  cover_url = excluded.cover_url,
  content_mdx = excluded.content_mdx,
  status = excluded.status,
  published_at = excluded.published_at,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_image_url = excluded.og_image_url,
  updated_at = now();

-- Approved comments for first post
insert into public.blog_comments (post_id, author_name, body, approved)
select id, 'Ana', 'Ajudou muito nos primeiros dias com meu filhote!', true
from public.blog_posts where slug = 'como-cuidar-do-seu-spitz-alemao-anao'
on conflict do nothing;

insert into public.blog_comments (post_id, author_name, body, approved)
select id, 'Carlos', 'Conteúdo claro e direto, parabéns!', true
from public.blog_posts where slug = 'como-cuidar-do-seu-spitz-alemao-anao'
on conflict do nothing;

