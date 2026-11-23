-- Cadernos do curso (feitos pelo professor): um por AULA e um por BLOCO de 15 min do Reta Final PM PE.
-- O aluno abre pelo link/QR do PDF (/lista/PT-AULA01-B1) ou por "Meus cadernos"; o site cria uma cópia só dele
-- na pasta "Reta Final PM PE › disciplina", e as respostas ficam nessa cópia.
-- Pode rodar de novo sem problema.

create table if not exists cadernos_modelo (
  codigo       text primary key check (codigo ~ '^[A-Z]{2}-AULA[0-9]{2}(-B[0-9]+)?$'),
  titulo       text not null,
  sigla        text not null,
  disciplina   text not null,
  aula         int  not null,
  bloco        int,                         -- vazio = caderno da aula inteira
  ordem        int  not null default 0,     -- posição da aula na sequência recomendada
  produto_slug text not null default 'reta-final-pmpe',
  gratis       boolean not null default false,  -- true = qualquer aluno logado abre (amostra)
  publicado    boolean not null default true,
  codigos      text[] not null default '{}',    -- códigos das questões no banco, na ordem
  total        int generated always as (cardinality(codigos)) stored
);
alter table cadernos_modelo enable row level security;
drop policy if exists "modelos: logado lê" on cadernos_modelo;
create policy "modelos: logado lê" on cadernos_modelo for select using (auth.uid() is not null and (publicado or eh_professor()));
drop policy if exists "modelos: professor" on cadernos_modelo;
create policy "modelos: professor" on cadernos_modelo for all using (eh_professor()) with check (eh_professor());

-- a cópia do aluno lembra de qual caderno do curso veio
alter table listas_questoes add column if not exists modelo_codigo text;
create unique index if not exists listas_modelo_unica on listas_questoes (aluno_id, modelo_codigo) where modelo_codigo is not null;

-- quem pode abrir: professor, caderno de amostra, ou matrícula ativa no produto do caderno (inclui o "gratuito por enquanto")
create or replace function pode_abrir_caderno_modelo(p_codigo text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from cadernos_modelo c
     where c.codigo = upper(p_codigo) and c.publicado and (
       c.gratis or eh_professor() or exists (
         select 1 from matriculas m join produtos p on p.id = m.produto_id
          where m.aluno_id = auth.uid() and m.status = 'ativa' and p.slug = c.produto_slug
            and (p.acesso_ate is null or p.acesso_ate >= _hoje())
            and (m.valida_ate is null or m.valida_ate >= _hoje()))));
$$;

-- abre (e cria, na primeira vez) a cópia do aluno. Devolve o id do caderno dele.
create or replace function abrir_caderno_modelo(p_codigo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare m cadernos_modelo; v_id uuid; v_ids uuid[]; v_raiz uuid; v_pasta uuid;
begin
  if auth.uid() is null then raise exception 'LOGIN'; end if;
  select * into m from cadernos_modelo where codigo = upper(p_codigo) and publicado;
  if not found then raise exception 'NAO_ACHEI'; end if;
  if not pode_abrir_caderno_modelo(m.codigo) then raise exception 'ACESSO'; end if;

  select id into v_id from listas_questoes where aluno_id = auth.uid() and modelo_codigo = m.codigo;
  if found then return v_id; end if;

  select array_agg(q.id order by u.ord) into v_ids
    from unnest(m.codigos) with ordinality as u(cod, ord)
    join questoes q on q.codigo = u.cod and q.publicada;
  if v_ids is null then raise exception 'SEM_QUESTOES'; end if;

  -- pastas: "Reta Final PM PE" › disciplina (criadas na primeira vez)
  select id into v_raiz from pastas_cadernos where aluno_id = auth.uid() and pai_id is null and nome = 'Reta Final PM PE' limit 1;
  if v_raiz is null then insert into pastas_cadernos (aluno_id, nome) values (auth.uid(), 'Reta Final PM PE') returning id into v_raiz; end if;
  select id into v_pasta from pastas_cadernos where aluno_id = auth.uid() and pai_id = v_raiz and nome = m.disciplina limit 1;
  if v_pasta is null then insert into pastas_cadernos (aluno_id, nome, pai_id) values (auth.uid(), m.disciplina, v_raiz) returning id into v_pasta; end if;

  insert into listas_questoes (aluno_id, titulo, filtros, questoes, pasta_id, modelo_codigo)
  values (auth.uid(), left(m.titulo, 200), jsonb_build_object('modelo', m.codigo), v_ids, v_pasta, m.codigo)
  on conflict (aluno_id, modelo_codigo) where modelo_codigo is not null do nothing
  returning id into v_id;
  if v_id is null then select id into v_id from listas_questoes where aluno_id = auth.uid() and modelo_codigo = m.codigo; end if;
  return v_id;
end $$;

-- conferência para o professor: quantas questões de cada caderno já estão no banco
create or replace function conferir_cadernos_modelo() returns table (codigo text, previstas int, no_banco int, faltando text[])
language sql stable security definer set search_path = public as $$
  select c.codigo, c.total,
         (select count(*)::int from questoes q where q.codigo = any (c.codigos) and q.publicada),
         coalesce((select array_agg(x) from unnest(c.codigos) x where not exists (select 1 from questoes q where q.codigo = x and q.publicada)), '{}')
    from cadernos_modelo c where eh_professor() order by c.ordem, c.aula, c.bloco nulls first;
$$;
notify pgrst, 'reload schema';
