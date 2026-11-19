-- Notícias com imagem, texto curto e página "Saiba mais" própria. Pode rodar de novo sem problema.
alter table noticias_concursos add column if not exists texto text;          -- explicação mais longa (nosso texto) da página "Saiba mais"
alter table noticias_concursos add column if not exists imagem_path text;    -- imagem própria desta notícia (opcional; senão vale a do assunto)

-- Biblioteca de imagens por assunto: se alguma das palavras aparecer no título, usa a imagem (vale a palavra mais longa).
-- Sem palavras e com carreira = imagem padrão daquele quadrado.
create table if not exists noticias_imagens (
  id           uuid primary key default gen_random_uuid(),
  rotulo       text not null,
  palavras     text[] not null default '{}',
  carreira     text check (carreira in ('federais','civis','militares','guardas')),
  imagem_path  text not null,                 -- bucket público 'vitrine'
  criada_em    timestamptz not null default now()
);
alter table noticias_imagens enable row level security;
drop policy if exists "noticias_imagens: todos leem" on noticias_imagens;
create policy "noticias_imagens: todos leem" on noticias_imagens for select using (true);
drop policy if exists "noticias_imagens: professor" on noticias_imagens;
create policy "noticias_imagens: professor" on noticias_imagens for all using (eh_professor()) with check (eh_professor());
grant select on noticias_imagens to anon, authenticated;
