-- Plano da Reta Final no cronograma: a sequência de blocos de 15 min do curso, os PDFs de cada bloco
-- e o ritmo de cada aluno (começa no dia em que ele começa; 2 h por dia é o padrão, e ele pode aumentar).
-- Pode rodar de novo sem problema.

-- 1) Sequência do curso (um item por bloco de aula, revisão, proposta de redação, simulado ou minissimulado)
create table if not exists plano_curso_itens (
  produto_slug text not null default 'reta-final-pmpe',
  codigo       text not null,
  seq          int  not null,
  tipo         text not null check (tipo in ('aula', 'revisao', 'proposta', 'simulado', 'mini')),
  sigla        text not null,
  disciplina   text not null,
  titulo       text not null,
  subtitulo    text,
  minutos      int  not null check (minutos between 5 and 600),
  pdf          text,          -- código do PDF do bloco (pdfs_curso)
  caderno      text,          -- código do caderno de questões (cadernos_modelo), o mesmo do QR do PDF
  aula         text,          -- código da aula inteira (para o PDF completo)
  ciclo        int,
  extra        jsonb not null default '{}',
  primary key (produto_slug, codigo)
);
create index if not exists plano_curso_seq on plano_curso_itens (produto_slug, seq);

-- 2) PDFs do curso guardados no site (bucket privado produtos-pdf, pasta curso/<produto>/)
create table if not exists pdfs_curso (
  produto_slug text not null default 'reta-final-pmpe',
  codigo       text not null,
  caminho      text not null,
  bytes        int,
  nome_arquivo text,
  enviado_em   timestamptz not null default now(),
  primary key (produto_slug, codigo)
);

-- 3) Ritmo do aluno
create table if not exists planos_aluno (
  aluno_id     uuid not null references perfis(id) on delete cascade,
  produto_slug text not null default 'reta-final-pmpe',
  inicio       date not null default _hoje(),
  minutos_dia  int  not null default 120 check (minutos_dia between 120 and 600),
  dias_semana  int[] not null default '{0,1,2,3,4,5,6}',
  atualizado_em timestamptz not null default now(),
  primary key (aluno_id, produto_slug)
);

-- 4) O que o aluno já concluiu (e em que dia)
create table if not exists plano_feitos (
  aluno_id     uuid not null references perfis(id) on delete cascade,
  produto_slug text not null default 'reta-final-pmpe',
  codigo       text not null,
  dia          date not null default _hoje(),
  feito_em     timestamptz not null default now(),
  primary key (aluno_id, produto_slug, codigo)
);

alter table plano_curso_itens enable row level security;
alter table pdfs_curso enable row level security;
alter table planos_aluno enable row level security;
alter table plano_feitos enable row level security;

drop policy if exists "plano itens: logado lê" on plano_curso_itens;
create policy "plano itens: logado lê" on plano_curso_itens for select using (auth.uid() is not null);
drop policy if exists "plano itens: professor" on plano_curso_itens;
create policy "plano itens: professor" on plano_curso_itens for all using (eh_professor()) with check (eh_professor());

drop policy if exists "pdfs curso: logado lê" on pdfs_curso;
create policy "pdfs curso: logado lê" on pdfs_curso for select using (auth.uid() is not null);
drop policy if exists "pdfs curso: professor" on pdfs_curso;
create policy "pdfs curso: professor" on pdfs_curso for all using (eh_professor()) with check (eh_professor());

do $$
declare t text;
begin
  foreach t in array array['planos_aluno', 'plano_feitos'] loop
    execute format('drop policy if exists "%s: dono" on %I', t, t);
    execute format('create policy "%s: dono" on %I for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s: professor lê" on %I', t, t);
    execute format('create policy "%s: professor lê" on %I for select using (eh_professor())', t, t);
  end loop;
end $$;

-- o professor pode substituir um PDF já enviado (enviar de novo o mesmo arquivo)
do $$ begin
  drop policy if exists "produtos-pdf: professor altera" on storage.objects;
  create policy "produtos-pdf: professor altera" on storage.objects for update using (bucket_id = 'produtos-pdf' and eh_professor());
end $$;

-- quem tem o curso: professor ou matrícula ativa no produto (inclui o "gratuito por enquanto")
create or replace function tem_curso(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (eh_professor() or exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and p.slug = p_slug
       and (p.acesso_ate is null or p.acesso_ate >= _hoje())
       and (m.valida_ate is null or m.valida_ate >= _hoje())));
$$;
notify pgrst, 'reload schema';
