-- =====================================================================
-- 0008 · Cronograma de estudos + planos de assinatura
-- • cronogramas: configuração do aluno por edital (blocos por dia, dias da semana, intervalos de revisão)
-- • cronograma_itens: em que dia cada conteúdo do edital foi programado
-- • conteudos_progresso: teoria concluída e revisões (1ª a 6ª) marcadas no edital verticalizado
-- • estudos: cada registro de estudo (tempo, tipo, conteúdo, dia)
-- • revisoes: revisões agendadas (geradas ao registrar o estudo ou criadas à mão)
-- • aproveitamento_edital(): % de acertos do aluno e dos demais por assunto do edital
-- • planos: quem assina um plano (produto com endereço "plano-...") também abre os PDFs dos cursos que o plano cobre
-- Rodar depois da 0007. Pode rodar de novo sem problema.
-- =====================================================================

create table if not exists cronogramas (
  aluno_id       uuid not null references perfis(id) on delete cascade,
  edital_id      uuid not null references editais(id) on delete cascade,
  inicio         date not null default _hoje(),
  blocos_por_dia int  not null default 2 check (blocos_por_dia between 1 and 8),
  dias_semana    int[] not null default '{1,2,3,4,5,6}',     -- 0 = domingo … 6 = sábado
  intervalos     int[] not null default '{1,7,14,30}',       -- dias até cada revisão
  atualizado_em  timestamptz not null default now(),
  primary key (aluno_id, edital_id)
);

-- conteúdo = (disciplina, chave); chave = id do assunto, ou 'geral' quando a disciplina não tem assuntos cadastrados
create table if not exists cronograma_itens (
  aluno_id    uuid not null references perfis(id) on delete cascade,
  edital_id   uuid not null references editais(id) on delete cascade,
  disciplina  text not null references disciplinas(nome) on update cascade on delete cascade,
  chave       text not null,
  assunto_id  uuid references assuntos(id) on delete cascade,
  dia         date not null,
  ordem       int  not null default 0,
  primary key (aluno_id, edital_id, disciplina, chave)
);
create index if not exists cronograma_itens_dia on cronograma_itens (aluno_id, edital_id, dia);

create table if not exists conteudos_progresso (
  aluno_id      uuid not null references perfis(id) on delete cascade,
  edital_id     uuid not null references editais(id) on delete cascade,
  disciplina    text not null references disciplinas(nome) on update cascade on delete cascade,
  chave         text not null,
  assunto_id    uuid references assuntos(id) on delete cascade,
  teoria        boolean not null default false,
  revisoes      boolean[] not null default '{f,f,f,f,f,f}',
  atualizado_em timestamptz not null default now(),
  primary key (aluno_id, edital_id, disciplina, chave)
);

create table if not exists estudos (
  id           bigint generated always as identity primary key,
  aluno_id     uuid not null references perfis(id) on delete cascade,
  edital_id    uuid references editais(id) on delete set null,
  disciplina   text not null references disciplinas(nome) on update cascade on delete cascade,
  chave        text,
  assunto_id   uuid references assuntos(id) on delete set null,
  assunto_nome text check (length(assunto_nome) <= 160),
  dia          date not null,
  minutos      int  not null check (minutos between 0 and 1440),
  tipo         text not null default 'misto' check (tipo in ('teoria', 'questoes', 'revisao', 'leitura', 'misto')),
  observacoes  text check (length(observacoes) <= 1000),
  criado_em    timestamptz not null default now()
);
create index if not exists estudos_aluno_dia on estudos (aluno_id, dia);

create table if not exists revisoes (
  id           bigint generated always as identity primary key,
  aluno_id     uuid not null references perfis(id) on delete cascade,
  edital_id    uuid references editais(id) on delete set null,
  disciplina   text not null references disciplinas(nome) on update cascade on delete cascade,
  chave        text,
  assunto_id   uuid references assuntos(id) on delete set null,
  assunto_nome text check (length(assunto_nome) <= 160),
  numero       smallint check (numero between 1 and 6),
  dia          date not null,
  feita_em     timestamptz,
  criado_em    timestamptz not null default now()
);
create index if not exists revisoes_aluno_dia on revisoes (aluno_id, dia);

-- cada aluno lê e escreve só o que é dele; o professor pode ler
do $$
declare t text;
begin
  foreach t in array array['cronogramas', 'cronograma_itens', 'conteudos_progresso', 'estudos', 'revisoes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "%s: dono" on %I', t, t);
    execute format('create policy "%s: dono" on %I for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid())', t, t);
    execute format('drop policy if exists "%s: professor lê" on %I', t, t);
    execute format('create policy "%s: professor lê" on %I for select using (eh_professor())', t, t);
  end loop;
end $$;

-- soma (ou desconta) minutos num dia de estudo, para a sequência de dias e as estatísticas
create or replace function ajustar_minutos_dia(p_dia date, p_minutos int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_dia > _hoje() or p_dia < _hoje() - 400 then return; end if;
  insert into dias_estudo (aluno_id, dia, minutos) values (auth.uid(), p_dia, greatest(p_minutos, 0))
  on conflict (aluno_id, dia) do update set minutos = greatest(dias_estudo.minutos + p_minutos, 0);
end $$;
revoke execute on function ajustar_minutos_dia(date, int) from public, anon;
grant execute on function ajustar_minutos_dia(date, int) to authenticated;

-- aproveitamento por disciplina e assunto das disciplinas do edital: o meu e o dos demais alunos
create or replace function aproveitamento_edital(p_edital uuid)
returns table (disciplina text, assunto text, meus_acertos int, meus_total int, outros_acertos int, outros_total int)
language sql stable security definer set search_path = public as $$
  select q.disciplina, coalesce(q.assunto, ''),
         count(*) filter (where t.aluno_id = auth.uid() and t.acertou)::int,
         count(*) filter (where t.aluno_id = auth.uid())::int,
         count(*) filter (where t.aluno_id <> auth.uid() and t.acertou)::int,
         count(*) filter (where t.aluno_id <> auth.uid())::int
    from tentativas_questoes t
    join questoes q on q.id = t.questao_id
   where auth.uid() is not null
     and q.disciplina in (select ed.disciplina from edital_disciplinas ed where ed.edital_id = p_edital)
   group by 1, 2;
$$;
revoke execute on function aproveitamento_edital(uuid) from public, anon;
grant execute on function aproveitamento_edital(uuid) to authenticated;

-- planos de assinatura: o plano (produto "plano-...") cobre os cursos do edital dele (ou de todos, se não tiver edital)
create or replace function _plano_cobre(p_produto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m join produtos pl on pl.id = m.produto_id, produtos alvo
     where alvo.id = p_produto and m.aluno_id = auth.uid() and m.status = 'ativa'
       and pl.slug like 'plano-%' and pl.tipo = 'curso'
       and (pl.acesso_ate is null or pl.acesso_ate >= _hoje())
       and (pl.edital_id is null or pl.edital_id = alvo.edital_id));
$$;

create or replace function pode_baixar_pdf(p_produto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from produto_pdfs d where d.produto_id = p_produto)
     and (exists (
            select 1 from matriculas m join produtos p on p.id = m.produto_id
             where m.aluno_id = auth.uid() and m.status = 'ativa' and p.id = p_produto
               and (p.acesso_ate is null or p.acesso_ate >= _hoje()))
          or _plano_cobre(p_produto));
$$;

create or replace function meus_pdfs() returns table (produto_id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome from produtos p
   where exists (select 1 from produto_pdfs d where d.produto_id = p.id)
     and (exists (select 1 from matriculas m where m.aluno_id = auth.uid() and m.status = 'ativa' and m.produto_id = p.id
                    and (p.acesso_ate is null or p.acesso_ate >= _hoje()))
          or _plano_cobre(p.id))
   order by p.ordem, p.nome;
$$;
revoke execute on function _plano_cobre(uuid) from public, anon;
grant execute on function _plano_cobre(uuid) to authenticated;
revoke execute on function pode_baixar_pdf(uuid) from public, anon;
revoke execute on function meus_pdfs() from public, anon;
grant execute on function pode_baixar_pdf(uuid) to authenticated;
grant execute on function meus_pdfs() to authenticated;

notify pgrst, 'reload schema';

select 'cronograma pronto' as resultado,
       (select count(*) from information_schema.tables where table_name in ('cronogramas', 'cronograma_itens', 'conteudos_progresso', 'estudos', 'revisoes')) as tabelas;
