-- =====================================================================
-- 0002 · Simulados do edital (feitos no site, no formato da prova)
-- • o aluno gera um simulado com a mesma distribuição de questões do edital
--   (completo) ou uma versão menor (minissimulado);
-- • responde tudo e só vê a correção quando entrega (como na prova);
-- • o resultado aplica a regra de corte do edital (mínimo por bloco, no total
--   e sem zerar disciplina).
-- Rodar depois da 0001. Pode rodar de novo sem problema.
-- =====================================================================

-- regras de corte e tempo de prova de cada edital
alter table editais add column if not exists corte_bloco numeric(4,3) check (corte_bloco between 0 and 1);   -- 0.30 = 30% de cada bloco
alter table editais add column if not exists corte_total numeric(4,3) check (corte_total between 0 and 1);   -- 0.30 = 30% do total
alter table editais add column if not exists sem_zerar  boolean not null default false;                       -- eliminado se zerar alguma disciplina
alter table editais add column if not exists duracao_min int check (duracao_min between 10 and 600);         -- tempo da prova objetiva

update editais set corte_bloco = 0.30, corte_total = 0.30, sem_zerar = true
 where slug = 'pmpe-2026-soldado' and corte_bloco is null;

create table if not exists provas (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references perfis(id) on delete cascade,
  edital_id     uuid references editais(id) on delete set null,
  tipo          text not null check (tipo in ('completo', 'mini')),
  titulo        text not null,
  questoes      uuid[] not null,
  respostas     text not null default '',            -- uma letra por questão; '-' = em branco
  duracao_min   int,
  iniciada_em   timestamptz not null default now(),
  finalizada_em timestamptz,
  acertos       int,
  resultado     jsonb                                -- por disciplina, por bloco e regra de corte
);
create index if not exists provas_aluno on provas (aluno_id, iniciada_em desc);
alter table provas enable row level security;
drop policy if exists "provas: dono lê" on provas;
create policy "provas: dono lê" on provas for select using (aluno_id = auth.uid() or eh_professor());
drop policy if exists "provas: dono apaga em andamento" on provas;
create policy "provas: dono apaga em andamento" on provas for delete using (aluno_id = auth.uid() and finalizada_em is null);
-- (provas só entram e mudam pelas funções abaixo)

-- Gera o simulado: para cada disciplina do edital, sorteia as questões
-- (primeiro as que o aluno nunca fez, primeiro as da banca do edital).
-- completo = quantidade da prova; mini = um quarto (no mínimo 2 por disciplina).
create or replace function gerar_prova_edital(p_edital uuid, p_tipo text default 'completo')
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_ed record; d record; v_n int; v_ids uuid[] := '{}'; v_parte uuid[]; v_id uuid; v_falta int := 0;
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  if p_tipo not in ('completo', 'mini') then raise exception 'Tipo de simulado inválido.'; end if;
  select * into v_ed from editais where id = p_edital and publicado;
  if v_ed.id is null then raise exception 'Edital não encontrado.'; end if;

  -- simulado completo: banco completo ou curso; plano grátis: um minissimulado por dia
  if p_tipo = 'completo' and not tem_banco_completo() then
    raise exception 'O simulado completo faz parte do banco completo e do curso. No plano grátis, faça o minissimulado.';
  end if;
  if not tem_banco_completo() and exists (
       select 1 from provas where aluno_id = auth.uid() and iniciada_em >= (_hoje())::timestamp at time zone 'America/Sao_Paulo') then
    raise exception 'No plano grátis, dá para fazer um minissimulado por dia. Amanhã tem outro.';
  end if;
  if (select count(*) from provas where aluno_id = auth.uid() and iniciada_em > now() - interval '1 day') >= 6 then
    raise exception 'Você já gerou muitos simulados hoje. Termine os que estão abertos.';
  end if;

  for d in select * from edital_disciplinas where edital_id = p_edital and questoes > 0 order by ordem, disciplina loop
    v_n := case when p_tipo = 'completo' then d.questoes else greatest(2, ceil(d.questoes / 4.0)::int) end;
    select array_agg(x.id order by x.ord) into v_parte from (
      select q.id, row_number() over (
               order by exists (select 1 from respostas_questoes r where r.questao_id = q.id and r.aluno_id = auth.uid()),
                        (q.banca is distinct from v_ed.banca), random()) as ord
        from questoes q
       where q.publicada and q.disciplina = d.disciplina and q.tipo = v_ed.tipo_prova
       order by ord limit v_n) x;
    v_ids := v_ids || coalesce(v_parte, '{}');
    v_falta := v_falta + v_n - coalesce(cardinality(v_parte), 0);
  end loop;
  if cardinality(v_ids) = 0 then raise exception 'Ainda não há questões publicadas para as disciplinas deste edital.'; end if;

  insert into provas (aluno_id, edital_id, tipo, titulo, questoes, respostas, duracao_min)
  values (auth.uid(), p_edital, p_tipo,
          (case when p_tipo = 'completo' then 'Simulado' else 'Minissimulado' end) || ' · ' || v_ed.nome
            || case when v_falta > 0 then ' (' || cardinality(v_ids) || ' questões)' else '' end,
          v_ids, repeat('-', cardinality(v_ids)),
          case when p_tipo = 'completo' then v_ed.duracao_min else ceil(coalesce(v_ed.duracao_min, cardinality(v_ids) * 3) / 4.0)::int end)
  returning id into v_id;
  return v_id;
end $$;

-- guarda as marcações enquanto o aluno faz (sem corrigir)
create or replace function salvar_prova(p_prova uuid, p_respostas text) returns void
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  select cardinality(questoes) into v_n from provas where id = p_prova and aluno_id = auth.uid() and finalizada_em is null;
  if v_n is null then raise exception 'Este simulado já foi entregue ou não é seu.'; end if;
  p_respostas := upper(coalesce(p_respostas, ''));
  if length(p_respostas) <> v_n or p_respostas !~ '^[A-E-]+$' then raise exception 'Respostas inválidas.'; end if;
  update provas set respostas = p_respostas where id = p_prova;
end $$;

-- entrega: corrige, aplica a regra de corte do edital e guarda o resultado
create or replace function finalizar_prova(p_prova uuid, p_respostas text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_p record; v_ed record; v_res jsonb; v_acertos int; v_total int; v_branco int;
        v_blocos jsonb; v_discs jsonb; v_zeradas text[]; v_ok_total boolean; v_ok_blocos boolean;
begin
  perform salvar_prova(p_prova, p_respostas);
  select * into v_p from provas where id = p_prova;
  select * into v_ed from editais where id = v_p.edital_id;

  drop table if exists _corr;
  create temp table _corr on commit drop as
  select u.ord, u.qid, substr(v_p.respostas, u.ord::int, 1) as marcada, g.resposta::text as certa, q.disciplina,
         coalesce(ed.bloco, q.disciplina) as bloco, coalesce(ed.ordem, 0) as ordem
    from unnest(v_p.questoes) with ordinality u(qid, ord)
    join questoes q on q.id = u.qid
    join questoes_gabarito g on g.questao_id = u.qid
    left join edital_disciplinas ed on ed.edital_id = v_p.edital_id and ed.disciplina = q.disciplina;

  select count(*) filter (where marcada = certa), count(*), count(*) filter (where marcada = '-')
    into v_acertos, v_total, v_branco from _corr;

  select coalesce(jsonb_agg(x order by x.ordem), '[]') into v_discs from (
    select disciplina, min(bloco) as bloco, min(ordem) as ordem, count(*) filter (where marcada = certa) as acertos, count(*) as total
      from _corr group by disciplina) x;
  select array_agg(disciplina) into v_zeradas from (
    select disciplina from _corr group by disciplina having count(*) filter (where marcada = certa) = 0) z;

  select coalesce(jsonb_agg(jsonb_build_object('bloco', b.bloco, 'acertos', b.acertos, 'total', b.total,
           'minimo', ceil(coalesce(v_ed.corte_bloco, 0) * b.total), 'ok', b.acertos >= ceil(coalesce(v_ed.corte_bloco, 0) * b.total)) order by b.ordem), '[]')
    into v_blocos
    from (select bloco, min(ordem) as ordem, count(*) filter (where marcada = certa) as acertos, count(*) as total from _corr group by bloco) b;

  v_ok_total := v_acertos >= ceil(coalesce(v_ed.corte_total, 0) * v_total);
  v_ok_blocos := not exists (select 1 from jsonb_array_elements(v_blocos) e where not (e->>'ok')::boolean);

  v_res := jsonb_build_object(
    'acertos', v_acertos, 'total', v_total, 'em_branco', v_branco, 'erros', v_total - v_acertos - v_branco,
    'disciplinas', v_discs, 'blocos', v_blocos,
    'minimo_total', ceil(coalesce(v_ed.corte_total, 0) * v_total), 'ok_total', v_ok_total,
    'zeradas', coalesce(to_jsonb(v_zeradas), '[]'), 'regra_zerar', coalesce(v_ed.sem_zerar, false),
    'tem_regra', v_ed.corte_bloco is not null or v_ed.corte_total is not null or coalesce(v_ed.sem_zerar, false),
    'classificado', v_ok_total and v_ok_blocos and not (coalesce(v_ed.sem_zerar, false) and v_zeradas is not null));

  update provas set finalizada_em = now(), acertos = v_acertos, resultado = v_res where id = p_prova;

  -- a primeira resposta de cada questão também alimenta a estatística das questões
  insert into respostas_questoes (aluno_id, questao_id, letra, acertou)
  select auth.uid(), qid, marcada, marcada = certa from _corr where marcada <> '-'
  on conflict do nothing;
  perform _marcar_dia_estudo(auth.uid());
  return v_res;
end $$;

-- gabarito e resolução de um simulado já entregue (só do próprio aluno)
create or replace function correcao_prova(p_prova uuid)
returns table (questao_id uuid, resposta text, comentario text, video_url text)
language sql stable security definer set search_path = public as $$
  select g.questao_id, g.resposta::text, g.comentario, g.video_url
    from provas p cross join lateral unnest(p.questoes) u(qid)
    join questoes_gabarito g on g.questao_id = u.qid
   where p.id = p_prova and p.finalizada_em is not null and (p.aluno_id = auth.uid() or eh_professor());
$$;

-- conferência
select slug, corte_bloco, corte_total, sem_zerar from editais;
