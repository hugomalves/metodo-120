-- Cadastro com nome completo, CPF e telefone (leads) + materiais gratuitos com marca d'água.
-- Pode rodar de novo sem problema.

-- 1) O cadastro grava os dados do aluno em dados_comprador (os da Kiwify, se já existirem, têm prioridade).
--    Se algo vier errado, o cadastro NUNCA falha por causa disso (só deixa de gravar; o aluno informa depois).
create or replace function criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ano int := nullif(new.raw_user_meta_data->>'ano_nascimento', '')::int;
  v_nome text := regexp_replace(trim(coalesce(new.raw_user_meta_data->>'nome_completo', '')), '\s+', ' ', 'g');
  v_cpf text := regexp_replace(coalesce(new.raw_user_meta_data->>'cpf', ''), '\D', '', 'g');
  v_tel text := regexp_replace(coalesce(new.raw_user_meta_data->>'telefone', ''), '\D', '', 'g');
begin
  if v_ano is not null and extract(year from now())::int - v_ano < 18 then
    raise exception 'Este site é só para maiores de 18 anos.';
  end if;
  insert into perfis (id, nome, ano_nascimento, maior_idade_em, papel)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'nome', ''), 120),
    v_ano,
    case when new.raw_user_meta_data->>'maior_idade' = 'sim' then now() end,
    'aluno'
  )
  on conflict (id) do nothing;
  if length(v_nome) >= 5 and length(v_cpf) = 11 and length(v_tel) between 10 and 13 and new.email is not null then
    begin
      insert into dados_comprador (email, nome, cpf, telefone, origem)
      values (lower(new.email), left(v_nome, 120), v_cpf, v_tel, 'aluno')
      on conflict (email) do nothing;
    exception when others then null;
    end;
  end if;
  return new;
end $$;

-- 2) Materiais gratuitos (o PDF fica na pasta privada 'produtos-pdf'; só sai pelo servidor, com a marca d'água de quem baixa)
create table if not exists materiais_gratuitos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null check (char_length(titulo) between 3 and 140),
  descricao     text,
  pdf_path      text not null,
  nome_arquivo  text,
  ordem         int not null default 0,
  publicado     boolean not null default true,
  criado_em     timestamptz not null default now()
);
alter table materiais_gratuitos enable row level security;
drop policy if exists "materiais_gratuitos: todos leem os publicados" on materiais_gratuitos;
create policy "materiais_gratuitos: todos leem os publicados" on materiais_gratuitos for select using (publicado or eh_professor());
drop policy if exists "materiais_gratuitos: professor" on materiais_gratuitos;
create policy "materiais_gratuitos: professor" on materiais_gratuitos for all using (eh_professor()) with check (eh_professor());
grant select on materiais_gratuitos to anon, authenticated;

-- 3) Quem baixou o quê (interesse de cada lead). Grava só o servidor; só o professor lê.
create table if not exists materiais_gratuitos_baixas (
  id          bigint generated always as identity primary key,
  material_id uuid not null references materiais_gratuitos(id) on delete cascade,
  email       text not null,
  em          timestamptz not null default now()
);
alter table materiais_gratuitos_baixas enable row level security;
drop policy if exists "baixas: professor lê" on materiais_gratuitos_baixas;
create policy "baixas: professor lê" on materiais_gratuitos_baixas for select using (eh_professor());
create index if not exists materiais_baixas_material on materiais_gratuitos_baixas (material_id);
