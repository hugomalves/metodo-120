-- =====================================================================
-- 0011 · Listas com vários filtros de uma vez
-- • gerar_lista aceita várias bancas, anos, disciplinas, assuntos, tipos e níveis (separados por |)
-- • quem tem o banco completo pode montar até 200 listas por dia (antes 30)
-- Rodar depois da 0010. Pode rodar de novo sem problema.
-- =====================================================================

drop function if exists gerar_lista(int, uuid, text, text, text, int, text, text, text, text, text, text, boolean);
create or replace function gerar_lista(
  p_qtd int,
  p_edital uuid default null, p_banca text default null, p_orgao text default null, p_cargo text default null,
  p_ano text default null, p_escolaridade text default null, p_disciplina text default null, p_assunto text default null,
  p_tipo text default null, p_nivel text default null, p_origem text default null, p_somente_novas boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_banca text[]; v_orgao text[]; v_cargo text[]; v_ano int[]; v_esc text[]; v_disc text[]; v_ass text[]; v_tipo text[]; v_nivel text[]; v_orig text[];
        v_ids uuid[]; v_id uuid; v_titulo text; v_sit record; v_max int; v_qtd int; v_max_listas int; v_edital text;
        v_semente text := gen_random_uuid()::text;   -- sorteio: itens do mesmo texto-base recebem o mesmo número
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  -- cada filtro pode vir com vários valores separados por | (ex.: 'AOCP|IDIB')
  v_banca := string_to_array(nullif(p_banca, ''), '|');   v_orgao := string_to_array(nullif(p_orgao, ''), '|');
  v_cargo := string_to_array(nullif(p_cargo, ''), '|');    v_esc := string_to_array(nullif(p_escolaridade, ''), '|');
  v_disc := string_to_array(nullif(p_disciplina, ''), '|'); v_ass := string_to_array(nullif(p_assunto, ''), '|');
  v_tipo := string_to_array(nullif(p_tipo, ''), '|');      v_nivel := string_to_array(nullif(p_nivel, ''), '|');
  v_orig := string_to_array(nullif(p_origem, ''), '|');
  v_ano := array(select x::int from unnest(string_to_array(nullif(p_ano, ''), '|')) x where x ~ '^[0-9]{4}$');
  if cardinality(v_ano) = 0 then v_ano := null; end if;
  select * into v_sit from banco_situacao();
  v_max := case when v_sit.completo then 60 else v_sit.lista_max end;
  v_qtd := least(greatest(coalesce(p_qtd, 10), 5), v_max);
  v_max_listas := case when v_sit.completo then 200 else 3 end;
  if (select count(*) from listas_questoes where aluno_id = auth.uid() and criada_em > now() - interval '1 day') >= v_max_listas then
    raise exception 'Você já montou muitas listas hoje. Termine as que estão abertas.';
  end if;
  if p_edital is not null then select nome into v_edital from editais where id = p_edital; end if;

  -- primeiro as que o aluno ainda não fez, depois as outras; itens do mesmo texto-base ficam juntos
  select array_agg(y.id order by y.ord) into v_ids from (
    select z.id, row_number() over (order by z.grupo_feito, z.sorteio, z.numero_prova nulls last, z.codigo) as ord
      from (select x.*, bool_and(x.feita) over (partition by x.grupo) as grupo_feito from (
        select q.id, q.codigo, q.numero_prova, coalesce(q.texto_base_id, q.id) as grupo,
               exists (select 1 from respostas_questoes r where r.questao_id = q.id and r.aluno_id = auth.uid()) as feita,
               md5(coalesce(q.texto_base_id, q.id)::text || v_semente) as sorteio
          from questoes q
         where q.publicada
           and (p_edital is null or q.disciplina in (select ed.disciplina from edital_disciplinas ed where ed.edital_id = p_edital))
           and (v_banca is null or q.banca = any(v_banca))
           and (v_orgao is null or q.orgao = any(v_orgao))
           and (v_cargo is null or q.cargo = any(v_cargo))
           and (v_ano is null or q.ano = any(v_ano))
           and (v_esc is null or q.escolaridade = any(v_esc))
           and (v_disc is null or q.disciplina = any(v_disc))
           and (v_ass is null or q.assunto = any(v_ass))
           and (v_tipo is null or q.tipo = any(v_tipo))
           and (v_nivel is null or q.nivel = any(v_nivel))
           and (v_orig is null or q.origem = any(v_orig))
           and (not p_somente_novas or not exists (
                 select 1 from respostas_questoes r where r.questao_id = q.id and r.aluno_id = auth.uid()))
      ) x) z
     order by ord
     limit v_qtd) y;
  if v_ids is null then raise exception 'Nenhuma questão com esses filtros. Tente tirar algum filtro.'; end if;

  v_titulo := concat_ws(' · ',
    v_edital, replace(p_disciplina, '|', ', '), replace(p_assunto, '|', ', '), replace(p_banca, '|', ', '),
    case when p_edital is null then replace(p_orgao, '|', ', ') end, case when p_edital is null then replace(p_cargo, '|', ', ') end, replace(p_ano, '|', ', '),
    case p_tipo when 'certo_errado' then 'certo ou errado' when 'multipla' then 'múltipla escolha' end,
    case p_nivel when 'facil' then 'fáceis' when 'medio' then 'médias' when 'dificil' then 'difíceis' end,
    cardinality(v_ids) || ' questões');

  insert into listas_questoes (aluno_id, titulo, filtros, questoes)
  values (auth.uid(), left(v_titulo, 200),
          jsonb_strip_nulls(jsonb_build_object('e', p_edital, 'b', p_banca, 'o', p_orgao, 'c', p_cargo, 'y', p_ano,
            'esc', p_escolaridade, 'd', p_disciplina, 'a', p_assunto, 't', p_tipo, 'n', p_nivel, 'or', p_origem,
            'novas', p_somente_novas)),
          v_ids)
  returning id into v_id;
  return v_id;
end $$;

notify pgrst, 'reload schema';

select 'listas com varios filtros prontas' as resultado;
