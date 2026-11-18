-- =====================================================================
-- 0012 · Notícias de concurso (aba "Notícias") e carreira em produtos e editais
-- • noticias_concursos: título, fonte e link de cada notícia, por carreira. Uma busca automática (a cada 2 dias)
--   preenche; o professor pode ocultar, apagar ou cadastrar à mão.
-- • produtos.carreira e editais.carreira: ligam os cursos e editais aos 4 quadrados da aba Notícias
--   (federais · civis · militares · guardas). Escolha no painel (Produtos e loja / Editais).
-- Rodar depois da 0011. Pode rodar de novo sem problema.
-- =====================================================================

create table if not exists noticias_concursos (
  id           uuid primary key default gen_random_uuid(),
  carreira     text not null check (carreira in ('federais', 'civis', 'militares', 'guardas')),
  titulo       text not null check (length(titulo) between 3 and 300),
  fonte        text check (length(fonte) <= 120),
  url          text not null check (url ~ '^https?://'),
  resumo       text check (length(resumo) <= 400),
  publicada_em timestamptz not null default now(),
  oculta       boolean not null default false,
  origem       text not null default 'busca' check (origem in ('busca', 'manual')),
  criada_em    timestamptz not null default now(),
  unique (url)
);
create index if not exists noticias_concursos_lista on noticias_concursos (carreira, publicada_em desc) where not oculta;

alter table noticias_concursos enable row level security;
drop policy if exists "notícias de concurso: todos leem as visíveis" on noticias_concursos;
create policy "notícias de concurso: todos leem as visíveis" on noticias_concursos for select using (not oculta or eh_professor());
drop policy if exists "notícias de concurso: professor edita" on noticias_concursos;
create policy "notícias de concurso: professor edita" on noticias_concursos for all using (eh_professor()) with check (eh_professor());
grant select on noticias_concursos to anon, authenticated;
grant insert, update, delete on noticias_concursos to authenticated;

alter table produtos add column if not exists carreira text check (carreira is null or carreira in ('federais', 'civis', 'militares', 'guardas'));
alter table editais  add column if not exists carreira text check (carreira is null or carreira in ('federais', 'civis', 'militares', 'guardas'));

-- o que já existe: PM PE é militar; Extensivo PRF é federal
update editais set carreira = 'militares' where carreira is null and (slug like 'pmpe%' or orgao ilike 'PM %');
update editais set carreira = 'federais' where carreira is null and (orgao ilike '%PRF%' or orgao ilike '%PF%' or orgao ilike '%federal%');
update produtos set carreira = (select e.carreira from editais e where e.id = produtos.edital_id) where carreira is null and edital_id is not null;
update produtos set carreira = 'federais' where carreira is null and (slug ilike '%prf%' or nome ilike '%PRF%');

notify pgrst, 'reload schema';

select carreira, count(*) as editais from editais group by carreira;
