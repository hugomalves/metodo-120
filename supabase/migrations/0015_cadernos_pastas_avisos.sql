-- Banco de questões em abas: pastas (com subpastas) para os cadernos, quadro de avisos.
-- Pode rodar de novo sem problema.

-- 1) Pastas dos cadernos (uma pasta pode ficar dentro de outra)
create table if not exists pastas_cadernos (
  id        uuid primary key default gen_random_uuid(),
  aluno_id  uuid not null references perfis(id) on delete cascade,
  nome      text not null check (length(btrim(nome)) between 1 and 80),
  pai_id    uuid references pastas_cadernos(id) on delete cascade,
  criada_em timestamptz not null default now()
);
create index if not exists pastas_cadernos_aluno on pastas_cadernos (aluno_id, pai_id);

-- limites: até 100 pastas por aluno, até 6 níveis, e a pasta-mãe precisa ser do mesmo aluno
create or replace function checar_pasta_caderno() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nivel int := 1; v_atual uuid := new.pai_id; v_dono uuid;
begin
  if new.pai_id is not null then
    select aluno_id into v_dono from pastas_cadernos where id = new.pai_id;
    if v_dono is distinct from new.aluno_id then raise exception 'Pasta inválida.'; end if;
    while v_atual is not null and v_nivel < 20 loop
      v_nivel := v_nivel + 1;
      select pai_id into v_atual from pastas_cadernos where id = v_atual;
    end loop;
    if v_nivel > 6 then raise exception 'Pastas dentro de pastas: no máximo 6 níveis.'; end if;
  end if;
  if tg_op = 'INSERT' and (select count(*) from pastas_cadernos where aluno_id = new.aluno_id) >= 100 then
    raise exception 'Você já tem 100 pastas. Apague alguma para criar outra.';
  end if;
  return new;
end $$;
drop trigger if exists pastas_cadernos_checar on pastas_cadernos;
create trigger pastas_cadernos_checar before insert or update of pai_id on pastas_cadernos
  for each row execute function checar_pasta_caderno();

alter table pastas_cadernos enable row level security;
drop policy if exists "pastas: dono lê" on pastas_cadernos;
create policy "pastas: dono lê" on pastas_cadernos for select using (aluno_id = auth.uid() or eh_professor());
drop policy if exists "pastas: dono cria" on pastas_cadernos;
create policy "pastas: dono cria" on pastas_cadernos for insert with check (aluno_id = auth.uid());
drop policy if exists "pastas: dono renomeia" on pastas_cadernos;
create policy "pastas: dono renomeia" on pastas_cadernos for update using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());
drop policy if exists "pastas: dono apaga" on pastas_cadernos;
create policy "pastas: dono apaga" on pastas_cadernos for delete using (aluno_id = auth.uid());

-- 2) O caderno (lista) agora mora numa pasta. Apagar a pasta não apaga o caderno: ele volta para "sem pasta".
alter table listas_questoes add column if not exists pasta_id uuid references pastas_cadernos(id) on delete set null;
create index if not exists listas_pasta on listas_questoes (aluno_id, pasta_id);

-- renomear e mover são feitos por função (o aluno não pode alterar as questões do caderno)
create or replace function renomear_caderno(p_id uuid, p_titulo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  if length(btrim(coalesce(p_titulo, ''))) < 1 then raise exception 'Dê um nome ao caderno.'; end if;
  update listas_questoes set titulo = left(btrim(p_titulo), 200) where id = p_id and aluno_id = auth.uid();
end $$;

create or replace function mover_caderno(p_id uuid, p_pasta uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  if p_pasta is not null and not exists (select 1 from pastas_cadernos where id = p_pasta and aluno_id = auth.uid()) then
    raise exception 'Pasta inválida.';
  end if;
  update listas_questoes set pasta_id = p_pasta where id = p_id and aluno_id = auth.uid();
end $$;

-- 3) Criar caderno a partir do filtro: as questões chegam já escolhidas pelo servidor; aqui só se confere o que é do aluno
create or replace function criar_caderno(p_titulo text, p_pasta uuid, p_filtros jsonb, p_ids uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare v_sit record; v_max int; v_max_dia int; v_ids uuid[]; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  if p_pasta is null or not exists (select 1 from pastas_cadernos where id = p_pasta and aluno_id = auth.uid()) then
    raise exception 'Escolha a pasta do caderno.';
  end if;
  select * into v_sit from banco_situacao();
  v_max := case when v_sit.completo then 500 else v_sit.lista_max end;
  v_max_dia := case when v_sit.completo then 30 else 3 end;
  if (select count(*) from listas_questoes where aluno_id = auth.uid() and criada_em > now() - interval '1 day') >= v_max_dia then
    raise exception 'Você já criou muitos cadernos hoje. Termine os que estão abertos.';
  end if;
  select array_agg(t.id order by t.ord) into v_ids from (
    select u.id, u.ord from unnest(p_ids) with ordinality as u(id, ord)
      join questoes q on q.id = u.id and q.publicada
     order by u.ord limit v_max) t;
  if v_ids is null then raise exception 'Nenhuma questão com esses filtros. Tente tirar algum filtro.'; end if;
  insert into listas_questoes (aluno_id, titulo, filtros, questoes, pasta_id)
  values (auth.uid(), left(btrim(coalesce(nullif(p_titulo, ''), 'Caderno')), 200), coalesce(p_filtros, '{}'), v_ids, p_pasta)
  returning id into v_id;
  return v_id;
end $$;

-- 4) Quadro de avisos do banco (o professor escreve; todos os alunos veem os ativos)
create table if not exists avisos_banco (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null check (length(btrim(titulo)) between 1 and 90),
  texto      text check (texto is null or length(texto) <= 300),
  link_url   text check (link_url is null or link_url ~ '^(https?://|/)'),
  link_texto text check (link_texto is null or length(link_texto) <= 40),
  ordem      int not null default 0,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);
alter table avisos_banco enable row level security;
drop policy if exists "avisos: alunos leem os ativos" on avisos_banco;
create policy "avisos: alunos leem os ativos" on avisos_banco for select using (auth.uid() is not null and (ativo or eh_professor()));
drop policy if exists "avisos: professor" on avisos_banco;
create policy "avisos: professor" on avisos_banco for all using (eh_professor()) with check (eh_professor());
