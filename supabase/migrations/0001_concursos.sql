-- =====================================================================
-- Plataforma de concursos · banco de dados completo (instalação nova)
-- Rodar UMA VEZ num projeto novo do Supabase:
--   SQL Editor → New query → colar tudo → Run.
-- Pode ser rodado de novo sem estragar nada (cria só o que falta).
--
-- Partes:
--   1. Tipos e cadastros (produtos, turmas, perfis, matrículas)
--   2. Concursos: editais, disciplinas, assuntos, liberação por edital
--   3. Curso (módulos, aulas, simulados) e atividade do aluno
--   4. Banco de questões (múltipla escolha e certo/errado)
--   5. Plano grátis, listas e contagem dos filtros
--   6. Dúvidas, engajamento, conquistas e ranking
--   7. Kiwify (pagamento libera o acesso)
--   8. Exclusão de conta e limpeza automática
--   9. Regras de acesso (RLS) e arquivos
--  10. Dados iniciais
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 1. Tipos e cadastros
-- =====================================================================
do $$ begin create type papel_usuario    as enum ('aluno', 'professor');                 exception when duplicate_object then null; end $$;
do $$ begin create type trilha_tipo      as enum ('gabaritar', 'ir_bem');                exception when duplicate_object then null; end $$;
do $$ begin create type alcance_trilha   as enum ('ambas', 'gabaritar', 'ir_bem');       exception when duplicate_object then null; end $$;
do $$ begin create type tipo_aula        as enum ('aula', 'revisao');                    exception when duplicate_object then null; end $$;
do $$ begin create type tipo_simulado    as enum ('mini', 'completo', 'diagnostico');    exception when duplicate_object then null; end $$;
do $$ begin create type status_matricula as enum ('ativa', 'cancelada', 'reembolsada');  exception when duplicate_object then null; end $$;
do $$ begin create type origem_matricula as enum ('checkout', 'manual');                 exception when duplicate_object then null; end $$;
do $$ begin create type status_duvida    as enum ('pendente', 'respondida', 'sanada', 'nao_compreendida'); exception when duplicate_object then null; end $$;

create table if not exists produtos (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  nome              text not null,
  tipo              text not null default 'curso' check (tipo in ('curso', 'banco', 'mentoria')),
  dias_curso        int,
  venda_aberta      boolean not null default false,
  venda_fecha_em    date,                               -- data-limite de venda
  acesso_ate        date,                               -- último dia de acesso (vazio = sem prazo)
  checkout_url      text,
  kiwify_product_id text unique,
  criado_em         timestamptz not null default now()
);

create table if not exists turmas (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references produtos(id) on delete cascade,
  nome        text not null,
  inicio      date not null,
  semanas     int  not null default 20,
  criado_em   timestamptz not null default now()
);

create table if not exists perfis (
  id                 uuid primary key references auth.users(id) on delete cascade,
  papel              papel_usuario not null default 'aluno',
  nome               text not null default '',
  apelido            text,
  ano_nascimento     int check (ano_nascimento between 1900 and 2100),
  maior_idade_em     timestamptz,                     -- quando declarou ter 18 anos ou mais
  trilha             trilha_tipo,
  turma_id           uuid references turmas(id) on delete set null,
  edital_id          uuid,                            -- edital que o aluno está seguindo (ligado na parte 2)
  onboarding_ok      boolean not null default false,
  participa_ranking  boolean not null default false,
  criado_em          timestamptz not null default now()
);
create unique index if not exists perfis_apelido_unico on perfis (lower(apelido));

create table if not exists matriculas (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references perfis(id) on delete cascade,
  produto_id    uuid not null references produtos(id),
  turma_id      uuid references turmas(id),
  status        status_matricula not null default 'ativa',
  origem        origem_matricula not null default 'checkout',
  checkout_ref  text,
  criado_em     timestamptz not null default now()
);
create index if not exists matriculas_ativas on matriculas (aluno_id) where status = 'ativa';

-- configurações editáveis no painel (limites do plano grátis etc.)
create table if not exists configuracoes (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- =====================================================================
-- 2. Concursos: editais, disciplinas e assuntos
-- =====================================================================
-- catálogo de disciplinas (o nome é a chave: renomear aqui atualiza as questões)
create table if not exists disciplinas (
  nome   text primary key check (length(nome) between 2 and 80),
  ordem  int not null default 0
);

-- árvore de assuntos de cada disciplina (pai_id = assunto acima; vazio = tópico principal)
create table if not exists assuntos (
  id          uuid primary key default gen_random_uuid(),
  disciplina  text not null references disciplinas(nome) on update cascade on delete cascade,
  nome        text not null check (length(nome) between 2 and 120),
  pai_id      uuid references assuntos(id) on delete set null,
  ordem       int not null default 0,
  unique (disciplina, nome)
);

-- edital = concurso + cargo (ex.: PM PE 2026 · Soldado)
create table if not exists editais (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null check (slug ~ '^[a-z0-9-]{3,60}$'),
  nome         text not null,                       -- 'PM PE 2026 · Soldado'
  orgao        text not null,                       -- 'PM PE'
  cargo        text not null,                       -- 'Soldado'
  banca        text,                                -- 'Instituto AOCP'
  esfera       text not null default 'estadual' check (esfera in ('municipal', 'estadual', 'federal')),
  escolaridade text check (escolaridade in ('fundamental', 'medio', 'superior')),
  situacao     text not null default 'aberto' check (situacao in ('previsto', 'aberto', 'encerrado')),
  data_prova   date,
  tipo_prova   text not null default 'multipla' check (tipo_prova in ('multipla', 'certo_errado')),
  n_alternativas int not null default 5 check (n_alternativas in (4, 5)),
  observacoes  text,                                -- regras de corte, redação etc.
  publicado    boolean not null default false,
  criado_em    timestamptz not null default now()
);

-- disciplinas de cada edital, com quantas questões caem e o peso
create table if not exists edital_disciplinas (
  edital_id   uuid not null references editais(id) on delete cascade,
  disciplina  text not null references disciplinas(nome) on update cascade,
  questoes    int not null default 0 check (questoes between 0 and 200),
  peso        numeric(4,2) not null default 1 check (peso > 0),
  bloco       text,                                 -- 'Bloco I'
  ordem       int not null default 0,
  primary key (edital_id, disciplina)
);

-- quais editais cada produto libera (curso por edital)
create table if not exists produto_editais (
  produto_id  uuid not null references produtos(id) on delete cascade,
  edital_id   uuid not null references editais(id) on delete cascade,
  primary key (produto_id, edital_id)
);

do $$ begin
  alter table perfis add constraint perfis_edital_fk foreign key (edital_id) references editais(id) on delete set null;
exception when duplicate_object then null; end $$;

-- =====================================================================
-- 3. Curso e atividade do aluno
-- =====================================================================
create table if not exists modulos (
  id         uuid primary key default gen_random_uuid(),
  numero     int unique not null,
  titulo     text not null,
  extra      boolean not null default false,
  disciplina text references disciplinas(nome) on update cascade on delete set null,
  capa_path  text
);

create table if not exists aulas (
  id           uuid primary key default gen_random_uuid(),
  modulo_id    uuid not null references modulos(id) on delete cascade,
  tipo         tipo_aula not null default 'aula',
  numero       int not null,
  titulo       text not null,
  video_url    text,
  pdf_path     text,
  habilidades  text[] not null default '{}',
  trilha       alcance_trilha not null default 'ambas',
  duracao_min  int not null default 15,
  publicada    boolean not null default false,
  criado_em    timestamptz not null default now(),
  unique (modulo_id, numero)
);

create table if not exists simulados (
  id                 uuid primary key default gen_random_uuid(),
  codigo             text unique not null,
  tipo               tipo_simulado not null,
  trilha             alcance_trilha not null default 'ambas',
  semana             int,
  n_questoes         int not null check (n_questoes between 1 and 200),
  edital_id          uuid references editais(id) on delete set null,
  tipo_questao       text not null default 'multipla' check (tipo_questao in ('multipla', 'certo_errado')),
  n_alternativas     int not null default 5 check (n_alternativas in (4, 5)),
  prova_pdf_path     text,
  gabarito_pdf_path  text,
  correcao_video_url text,
  capa_path          text,
  liberado           boolean not null default false,
  criado_em          timestamptz not null default now()
);

-- gabarito separado: o aluno só vê depois de enviar (A–E; no certo/errado, C ou E)
create table if not exists gabaritos (
  simulado_id  uuid primary key references simulados(id) on delete cascade,
  respostas    text not null check (respostas ~ '^[A-E]+$'),
  habilidades  text[] not null default '{}',        -- aqui: a disciplina de cada questão, na ordem
  assuntos     text[] not null default '{}',
  niveis       text[] not null default '{}' check (niveis <@ array['facil', 'medio', 'dificil', '']::text[]),
  comentarios  text[] not null default '{}'
);

create table if not exists progresso_aulas (
  aluno_id     uuid not null references perfis(id) on delete cascade,
  aula_id      uuid not null references aulas(id) on delete cascade,
  concluida_em timestamptz not null default now(),
  primary key (aluno_id, aula_id)
);

create table if not exists dias_estudo (
  aluno_id  uuid not null references perfis(id) on delete cascade,
  dia       date not null default (now() at time zone 'America/Sao_Paulo')::date,
  minutos   int  not null default 0,
  primary key (aluno_id, dia)
);

create table if not exists rascunhos_cartao (
  aluno_id      uuid not null references perfis(id) on delete cascade,
  simulado_id   uuid not null references simulados(id) on delete cascade,
  respostas     text not null default '',
  atualizado_em timestamptz not null default now(),
  primary key (aluno_id, simulado_id)
);

create table if not exists envios (
  id              uuid primary key default gen_random_uuid(),
  aluno_id        uuid not null references perfis(id) on delete cascade,
  simulado_id     uuid not null references simulados(id) on delete cascade,
  respostas       text not null check (respostas ~ '^[A-E-]+$'),
  acertos         int  not null,
  em_branco       int  not null,
  nota            numeric not null default 0,       -- certo/errado: acertos − erros; múltipla: acertos
  conta_evolucao  boolean not null,
  enviado_em      timestamptz not null default now()
);
create unique index if not exists envios_primeiro_unico on envios (aluno_id, simulado_id) where conta_evolucao;

create table if not exists envios_anonimos (
  id          uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references simulados(id) on delete cascade,
  turma_id    uuid references turmas(id) on delete set null,
  respostas   text not null,
  acertos     int not null,
  enviado_em  timestamptz not null
);

create table if not exists recados (
  id           uuid primary key default gen_random_uuid(),
  turma_id     uuid references turmas(id) on delete cascade,
  texto        varchar(140) not null,
  video_url    text,
  publicado_em timestamptz not null default now()
);

create table if not exists materiais_habilidade (
  id                uuid primary key default gen_random_uuid(),
  habilidade        text not null,
  tipo              text not null check (tipo in ('aula', 'lista')),
  titulo            text not null,
  video_url         text,
  pdf_path          text,
  gabarito_pdf_path text,
  ordem             int not null default 0,
  publicada         boolean not null default true,
  criado_em         timestamptz not null default now()
);

-- =====================================================================
-- 4. Banco de questões
-- =====================================================================
-- texto-base compartilhado (no Cebraspe, um texto com vários itens para julgar)
create table if not exists textos_base (
  id         uuid primary key default gen_random_uuid(),
  codigo     text unique not null check (codigo ~ '^[A-Z0-9-]{3,40}$'),
  texto      text not null default '',
  figuras    text[] not null default '{}',
  criado_em  timestamptz not null default now()
);

create table if not exists questoes (
  id            uuid primary key default gen_random_uuid(),
  codigo        text unique not null check (codigo ~ '^[A-Z0-9-]{3,40}$'),  -- 'AOCP-PMPE-2024-SD-15', 'AUT-000123'
  origem        text not null default 'prova' check (origem in ('prova', 'autoral')),
  tipo          text not null default 'multipla' check (tipo in ('multipla', 'certo_errado')),
  banca         text,                                 -- 'Instituto AOCP', 'Cebraspe'…
  orgao         text,                                 -- 'PM PE'
  cargo         text,                                 -- 'Soldado'
  ano           int check (ano between 1990 and 2100),
  escolaridade  text check (escolaridade in ('fundamental', 'medio', 'superior')),
  prova         text,                                 -- código da prova de origem: 'AOCP-PMPE-2024-SD'
  numero_prova  int,                                  -- número da questão (ou do item) na prova
  disciplina    text not null references disciplinas(nome) on update cascade,
  assunto       text,
  texto_base_id uuid references textos_base(id) on delete set null,
  enunciado     text not null default '',
  formato       text not null default 'texto' check (formato in ('texto', 'imagem')),
  imagem_path   text,                                 -- recorte da prova (botão "Ver na prova")
  figuras       text[] not null default '{}',         -- figuras citadas como [[fig:1]]…
  alt_a         text not null default '',
  alt_b         text not null default '',
  alt_c         text not null default '',
  alt_d         text not null default '',
  alt_e         text not null default '',
  nivel         text check (nivel in ('facil', 'medio', 'dificil')),
  publicada     boolean not null default false,
  revisada      boolean not null default false,
  respondidas   int not null default 0,               -- contadores anônimos (primeira resposta de cada aluno)
  acertadas     int not null default 0,
  criado_em     timestamptz not null default now()
);
do $$ begin
  alter table questoes add constraint questoes_assunto_fk foreign key (disciplina, assunto)
    references assuntos(disciplina, nome) on update cascade;
exception when duplicate_object then null; end $$;
create index if not exists questoes_filtro on questoes (disciplina, banca, ano) where publicada;
create index if not exists questoes_prova on questoes (prova, numero_prova);
create index if not exists questoes_texto_base on questoes (texto_base_id);

-- resposta e resolução separadas: o aluno só vê depois de responder
create table if not exists questoes_gabarito (
  questao_id  uuid primary key references questoes(id) on delete cascade,
  resposta    char(1) not null check (resposta in ('A', 'B', 'C', 'D', 'E')),
  comentario  text,
  video_url   text
);

-- primeira resposta de cada aluno (estatística da questão)
create table if not exists respostas_questoes (
  aluno_id      uuid not null references perfis(id) on delete cascade,
  questao_id    uuid not null references questoes(id) on delete cascade,
  letra         char(1) not null,
  acertou       boolean not null,
  respondida_em timestamptz not null default now(),
  primary key (aluno_id, questao_id)
);

create table if not exists listas_questoes (
  id        uuid primary key default gen_random_uuid(),
  aluno_id  uuid not null references perfis(id) on delete cascade,
  titulo    text not null,
  filtros   jsonb not null default '{}',
  questoes  uuid[] not null,
  criada_em timestamptz not null default now()
);
create index if not exists listas_aluno on listas_questoes (aluno_id, criada_em desc);

-- todas as tentativas (banco livre e listas)
create table if not exists tentativas_questoes (
  id            bigint generated always as identity primary key,
  aluno_id      uuid not null references perfis(id) on delete cascade,
  questao_id    uuid not null references questoes(id) on delete cascade,
  lista_id      uuid references listas_questoes(id) on delete cascade,
  letra         char(1) not null,
  acertou       boolean not null,
  respondida_em timestamptz not null default now()
);
create index if not exists tentativas_aluno_questao on tentativas_questoes (aluno_id, questao_id, respondida_em desc);
create unique index if not exists tentativas_uma_por_lista on tentativas_questoes (lista_id, questao_id) where lista_id is not null;

-- =====================================================================
-- Funções de acesso
-- =====================================================================
create or replace function eh_professor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and papel = 'professor');
$$;

create or replace function _hoje() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- CURSO: matrícula ativa, dentro do prazo, num produto do tipo curso ou mentoria
create or replace function tem_matricula_ativa() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and p.tipo in ('curso', 'mentoria')
       and (p.acesso_ate is null or p.acesso_ate >= _hoje()));
$$;

-- curso de UM edital (o produto comprado libera aquele edital)
create or replace function tem_curso_edital(p_edital uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select eh_professor() or exists (
    select 1 from matriculas m
      join produtos p on p.id = m.produto_id
      join produto_editais pe on pe.produto_id = p.id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and pe.edital_id = p_edital
       and (p.acesso_ate is null or p.acesso_ate >= _hoje()));
$$;

-- BANCO COMPLETO: matrícula ativa em qualquer produto (o curso inclui o banco), ou professor
create or replace function tem_banco_completo() returns boolean
language sql stable security definer set search_path = public as $$
  select eh_professor() or exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa'
       and (p.acesso_ate is null or p.acesso_ate >= _hoje()));
$$;

create or replace function config_int(p_chave text, p_padrao int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (valor #>> '{}')::int from configuracoes where chave = p_chave), p_padrao);
$$;

-- cria o perfil no cadastro: só adultos (o formulário exige a declaração de 18+)
create or replace function criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_ano int := nullif(new.raw_user_meta_data->>'ano_nascimento', '')::int;
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
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function criar_perfil();

-- o próprio usuário não muda papel, ano de nascimento nem turma
create or replace function proteger_papel() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not eh_professor() then
    if new.papel is distinct from old.papel then
      raise exception 'Não é permitido alterar o papel do usuário.';
    end if;
    if new.ano_nascimento is distinct from old.ano_nascimento then
      raise exception 'O ano de nascimento só pode ser corrigido pela equipe.';
    end if;
    if new.turma_id is distinct from old.turma_id then
      raise exception 'A turma só pode ser alterada pela equipe.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists perfis_proteger_papel on perfis;
create trigger perfis_proteger_papel before update on perfis
  for each row execute function proteger_papel();

-- marca o dia como dia de estudo
create or replace function _marcar_dia_estudo(p_aluno uuid) returns void
language sql security definer set search_path = public as $$
  insert into dias_estudo (aluno_id, dia, minutos) values (p_aluno, _hoje(), 0)
  on conflict (aluno_id, dia) do nothing;
$$;
revoke execute on function _marcar_dia_estudo(uuid) from public, anon, authenticated;

create or replace function registrar_estudo(p_minutos int) returns void
language sql security definer set search_path = public as $$
  insert into dias_estudo (aluno_id, dia, minutos)
  values (auth.uid(), _hoje(), greatest(p_minutos, 0))
  on conflict (aluno_id, dia) do update set minutos = dias_estudo.minutos + excluded.minutos;
$$;

-- =====================================================================
-- Simulados: envio do cartão, gabarito e correção
-- =====================================================================
-- no certo/errado (Cebraspe) cada erro anula um acerto; em branco não conta
drop function if exists enviar_cartao(uuid, text);
create or replace function enviar_cartao(p_simulado uuid, p_respostas text)
returns table (acertos int, em_branco int, erros int, nota numeric, conta_evolucao boolean, gabarito text)
language plpgsql security definer set search_path = public as $$
declare
  v_gab text; v_n int; v_tipo text; v_nalt int; v_acertos int := 0; v_branco int := 0; v_erros int; v_nota numeric;
  v_conta boolean; v_validas text; i int;
begin
  if auth.uid() is null then raise exception 'Faça login para enviar.'; end if;
  if not tem_matricula_ativa() then raise exception 'Seu acesso não está ativo.'; end if;

  select s.n_questoes, s.tipo_questao, s.n_alternativas, g.respostas into v_n, v_tipo, v_nalt, v_gab
    from simulados s join gabaritos g on g.simulado_id = s.id
   where s.id = p_simulado and s.liberado;
  if v_gab is null then raise exception 'Este simulado ainda não está disponível.'; end if;

  v_validas := case when v_tipo = 'certo_errado' then 'CE' when v_nalt = 4 then 'ABCD' else 'ABCDE' end;
  p_respostas := upper(coalesce(p_respostas, ''));
  if length(p_respostas) <> v_n or p_respostas !~ ('^[' || v_validas || '-]+$') then
    raise exception 'O cartão precisa ter % respostas (%, ou - para em branco).', v_n,
      case when v_tipo = 'certo_errado' then 'C ou E' else 'A a ' || right(v_validas, 1) end;
  end if;

  for i in 1..v_n loop
    if substr(p_respostas, i, 1) = '-' then v_branco := v_branco + 1;
    elsif substr(p_respostas, i, 1) = substr(v_gab, i, 1) then v_acertos := v_acertos + 1;
    end if;
  end loop;
  v_erros := v_n - v_acertos - v_branco;
  v_nota := case when v_tipo = 'certo_errado' then v_acertos - v_erros else v_acertos end;

  v_conta := not exists (select 1 from envios e
                          where e.aluno_id = auth.uid() and e.simulado_id = p_simulado and e.conta_evolucao);

  insert into envios (aluno_id, simulado_id, respostas, acertos, em_branco, nota, conta_evolucao)
  values (auth.uid(), p_simulado, p_respostas, v_acertos, v_branco, v_nota, v_conta);
  delete from rascunhos_cartao where aluno_id = auth.uid() and simulado_id = p_simulado;
  perform _marcar_dia_estudo(auth.uid());

  return query select v_acertos, v_branco, v_erros, v_nota, v_conta, v_gab;
end $$;

create or replace function ver_gabarito(p_simulado uuid)
returns table (respostas text, habilidades text[])
language sql stable security definer set search_path = public as $$
  select g.respostas, g.habilidades from gabaritos g
   where g.simulado_id = p_simulado
     and (eh_professor() or exists (select 1 from envios e where e.simulado_id = p_simulado and e.aluno_id = auth.uid()));
$$;

create or replace function ver_correcao(p_simulado uuid)
returns table (respostas text, habilidades text[], assuntos text[], niveis text[], comentarios text[])
language sql stable security definer set search_path = public as $$
  select g.respostas, g.habilidades, g.assuntos, g.niveis, g.comentarios from gabaritos g
   where g.simulado_id = p_simulado
     and (eh_professor() or exists (select 1 from envios e where e.simulado_id = p_simulado and e.aluno_id = auth.uid()));
$$;

create or replace function habilidades_do_simulado(p_simulado uuid) returns text[]
language sql stable security definer set search_path = public as $$
  select g.habilidades from gabaritos g
   where g.simulado_id = p_simulado
     and exists (select 1 from envios e where e.simulado_id = p_simulado and e.aluno_id = auth.uid());
$$;

-- acertos do aluno por disciplina/tema dos simulados (só primeiros envios)
create or replace function minhas_habilidades()
returns table (habilidade text, acertos int, total int, pct int)
language sql stable security definer set search_path = public as $$
  select g.habilidades[i],
         (count(*) filter (where substr(e.respostas, i, 1) = substr(g.respostas, i, 1)))::int,
         count(*)::int,
         round(100.0 * count(*) filter (where substr(e.respostas, i, 1) = substr(g.respostas, i, 1)) / count(*))::int
    from envios e
    join gabaritos g on g.simulado_id = e.simulado_id
    cross join lateral generate_series(1, length(g.respostas)) as i
   where e.aluno_id = auth.uid() and e.conta_evolucao and coalesce(g.habilidades[i], '') <> ''
   group by 1
   order by 4 desc, 1;
$$;

create or replace function questoes_que_mais_derrubaram(p_simulado uuid, p_limite int default 5)
returns table (questao int, habilidade text, pct_erro numeric, mais_marcada text, certa text, envios int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  with g as (select respostas, habilidades from gabaritos where simulado_id = p_simulado),
       e as (select respostas from envios where simulado_id = p_simulado and conta_evolucao),
       total as (select count(*)::int n from e),
       q as (select generate_series(1, (select length(respostas) from g)) i),
       marc as (select q.i, substr(e.respostas, q.i, 1) letra, count(*)::int n from q cross join e group by q.i, letra)
  select q.i, (select g.habilidades[q.i] from g),
         round(100.0 * coalesce(sum(m.n) filter (where m.letra <> substr((select respostas from g), q.i, 1)), 0)
               / nullif((select n from total), 0), 1),
         (select m2.letra from marc m2 where m2.i = q.i and m2.letra not in ('-', substr((select respostas from g), q.i, 1))
           order by m2.n desc limit 1),
         substr((select respostas from g), q.i, 1),
         (select n from total)
    from q left join marc m on m.i = q.i
   group by q.i
   order by 3 desc nulls last
   limit p_limite;
end $$;

-- =====================================================================
-- 4b. Banco de questões: responder e rever
-- =====================================================================
create or replace function banco_situacao()
returns table (completo boolean, usadas_hoje int, limite_dia int, lista_max int)
language sql stable security definer set search_path = public as $$
  select tem_banco_completo(),
         (select count(*)::int from tentativas_questoes t
           where t.aluno_id = auth.uid()
             and t.respondida_em >= (_hoje())::timestamp at time zone 'America/Sao_Paulo'),
         config_int('banco_gratis_por_dia', 10),
         config_int('banco_gratis_lista_max', 10);
$$;

-- letras que valem para a questão: C/E no certo/errado; A–D ou A–E na múltipla escolha
create or replace function _letras_validas(p_tipo text, p_alt_e text) returns text
language sql immutable as $$
  select case when p_tipo = 'certo_errado' then 'CE' when coalesce(p_alt_e, '') = '' then 'ABCD' else 'ABCDE' end;
$$;

create or replace function responder_questao(p_questao uuid, p_letra text, p_lista uuid default null)
returns table (acertou boolean, resposta text, comentario text, video_url text, primeira boolean, vezes int, acertos int)
language plpgsql security definer set search_path = public as $$
declare v_resp text; v_com text; v_vid text; v_tipo text; v_alt_e text; v_formato text; v_ok boolean; v_primeira boolean;
        v_lista uuid := p_lista; v_letra text := upper(coalesce(p_letra, '')); v_sit record;
begin
  if auth.uid() is null then raise exception 'Faça login para responder.'; end if;

  select qg.resposta, qg.comentario, qg.video_url, q.tipo, q.alt_e, q.formato
    into v_resp, v_com, v_vid, v_tipo, v_alt_e, v_formato
    from questoes q join questoes_gabarito qg on qg.questao_id = q.id
   where q.id = p_questao and q.publicada;
  if v_resp is null then raise exception 'Esta questão não está disponível.'; end if;

  -- questão em imagem não tem o texto das alternativas: vale até a E
  if length(v_letra) <> 1 or position(v_letra in
       case when v_formato = 'imagem' and v_tipo = 'multipla' then 'ABCDE' else _letras_validas(v_tipo, v_alt_e) end) = 0 then
    raise exception '%', case when v_tipo = 'certo_errado' then 'Marque Certo ou Errado.' else 'Escolha uma alternativa.' end;
  end if;

  select * into v_sit from banco_situacao();
  if not v_sit.completo and v_sit.usadas_hoje >= v_sit.limite_dia then
    raise exception 'Você já respondeu as % questões grátis de hoje. Amanhã tem mais, ou desbloqueie o banco completo para responder sem limite.', v_sit.limite_dia;
  end if;

  -- a lista precisa ser do aluno e ter a questão; se já foi respondida nela, esta vira treino
  if v_lista is not null and not exists (
       select 1 from listas_questoes l where l.id = v_lista and l.aluno_id = auth.uid() and p_questao = any (l.questoes)) then
    v_lista := null;
  end if;
  if v_lista is not null and exists (select 1 from tentativas_questoes t where t.lista_id = v_lista and t.questao_id = p_questao) then
    v_lista := null;
  end if;

  v_ok := v_letra = v_resp;
  insert into tentativas_questoes (aluno_id, questao_id, lista_id, letra, acertou)
  values (auth.uid(), p_questao, v_lista, v_letra, v_ok);

  insert into respostas_questoes (aluno_id, questao_id, letra, acertou)
  values (auth.uid(), p_questao, v_letra, v_ok)
  on conflict do nothing;
  v_primeira := found;
  if v_primeira then
    update questoes set respondidas = respondidas + 1, acertadas = acertadas + (case when v_ok then 1 else 0 end)
     where id = p_questao;
  end if;
  perform _marcar_dia_estudo(auth.uid());

  return query
    select v_ok, v_resp, v_com, v_vid, v_primeira, count(*)::int, (count(*) filter (where t.acertou))::int
      from tentativas_questoes t where t.aluno_id = auth.uid() and t.questao_id = p_questao;
end $$;

create or replace function ver_resolucao_questao(p_questao uuid)
returns table (resposta text, comentario text, video_url text, minha_letra text, acertou boolean)
language sql stable security definer set search_path = public as $$
  select qg.resposta::text, qg.comentario, qg.video_url, r.letra::text, r.acertou
    from questoes_gabarito qg
    join respostas_questoes r on r.questao_id = qg.questao_id and r.aluno_id = auth.uid()
   where qg.questao_id = p_questao;
$$;

create or replace function ver_resolucoes_lista(p_lista uuid)
returns table (questao_id uuid, resposta text, comentario text, video_url text, minha_letra text, acertou boolean)
language sql stable security definer set search_path = public as $$
  select t.questao_id, qg.resposta::text, qg.comentario, qg.video_url, t.letra::text, t.acertou
    from tentativas_questoes t
    join listas_questoes l on l.id = t.lista_id and l.aluno_id = auth.uid()
    join questoes_gabarito qg on qg.questao_id = t.questao_id
   where t.lista_id = p_lista and t.aluno_id = auth.uid();
$$;

-- =====================================================================
-- 5. Listas sob medida e contagem dos filtros
-- =====================================================================
drop function if exists gerar_lista(int, uuid, text, text, text, int, text, text, text, text, text, text, boolean);
create or replace function gerar_lista(
  p_qtd int,
  p_edital uuid default null, p_banca text default null, p_orgao text default null, p_cargo text default null,
  p_ano int default null, p_escolaridade text default null, p_disciplina text default null, p_assunto text default null,
  p_tipo text default null, p_nivel text default null, p_origem text default null, p_somente_novas boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_ids uuid[]; v_id uuid; v_titulo text; v_sit record; v_max int; v_qtd int; v_max_listas int; v_edital text;
        v_semente text := gen_random_uuid()::text;   -- sorteio: itens do mesmo texto-base recebem o mesmo número
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  select * into v_sit from banco_situacao();
  v_max := case when v_sit.completo then 60 else v_sit.lista_max end;
  v_qtd := least(greatest(coalesce(p_qtd, 10), 5), v_max);
  v_max_listas := case when v_sit.completo then 30 else 3 end;
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
           and (p_banca is null or q.banca = p_banca)
           and (p_orgao is null or q.orgao = p_orgao)
           and (p_cargo is null or q.cargo = p_cargo)
           and (p_ano is null or q.ano = p_ano)
           and (p_escolaridade is null or q.escolaridade = p_escolaridade)
           and (p_disciplina is null or q.disciplina = p_disciplina)
           and (p_assunto is null or q.assunto = p_assunto)
           and (p_tipo is null or q.tipo = p_tipo)
           and (p_nivel is null or q.nivel = p_nivel)
           and (p_origem is null or q.origem = p_origem)
           and (not p_somente_novas or not exists (
                 select 1 from respostas_questoes r where r.questao_id = q.id and r.aluno_id = auth.uid()))
      ) x) z
     order by ord
     limit v_qtd) y;
  if v_ids is null then raise exception 'Nenhuma questão com esses filtros. Tente tirar algum filtro.'; end if;

  v_titulo := concat_ws(' · ',
    v_edital, p_disciplina, p_assunto, p_banca,
    case when p_edital is null then p_orgao end, case when p_edital is null then p_cargo end, p_ano::text,
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

-- combinações que existem no banco, com quantas questões em cada (alimenta filtros e contagem ao vivo)
drop function if exists contagem_banco();
create or replace function contagem_banco()
returns table (banca text, orgao text, cargo text, ano int, escolaridade text, disciplina text, assunto text,
               tipo text, nivel text, origem text, feita boolean, n int)
language sql stable security definer set search_path = public as $$
  select q.banca, q.orgao, q.cargo, q.ano, q.escolaridade, q.disciplina, q.assunto, q.tipo, q.nivel, q.origem,
         exists (select 1 from respostas_questoes r where r.questao_id = q.id and r.aluno_id = auth.uid()),
         count(*)::int
    from questoes q
   where q.publicada and auth.uid() is not null
   group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11;
$$;

-- =====================================================================
-- 6. Painel do professor, dúvidas, engajamento, conquistas e ranking
-- =====================================================================
create or replace function professor_resumo()
returns table (alunos_ativos int, estudaram_semana int, sem_estudar_7d int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  with ativos as (select distinct aluno_id from matriculas where status = 'ativa'),
       semana as (select distinct aluno_id from dias_estudo where dia > _hoje() - 7)
  select (select count(*)::int from ativos),
         (select count(*)::int from ativos a join semana s using (aluno_id)),
         (select count(*)::int from ativos a where not exists (select 1 from semana s where s.aluno_id = a.aluno_id));
end $$;

drop function if exists professor_listar_alunos();
create or replace function professor_listar_alunos()
returns table (id uuid, nome text, email text, trilha trilha_tipo, turma text, edital text,
               acesso_ativo boolean, aulas_concluidas int, questoes int, ultimo_dia date, criado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  select p.id, p.nome, u.email::text, p.trilha,
         (select t.nome from matriculas m join turmas t on t.id = m.turma_id
           where m.aluno_id = p.id and m.status = 'ativa' order by m.criado_em desc limit 1),
         (select e.nome from editais e where e.id = p.edital_id),
         exists (select 1 from matriculas m where m.aluno_id = p.id and m.status = 'ativa'),
         (select count(*)::int from progresso_aulas pa where pa.aluno_id = p.id),
         (select count(*)::int from tentativas_questoes t where t.aluno_id = p.id),
         (select max(d.dia) from dias_estudo d where d.aluno_id = p.id),
         p.criado_em
    from perfis p join auth.users u on u.id = p.id
   where p.papel = 'aluno'
   order by p.criado_em desc;
end $$;

create or replace function professor_liberar_acesso(p_email text, p_produto uuid, p_turma uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'Não existe conta com o e-mail %. Peça para a pessoa se cadastrar primeiro.', p_email;
  end if;
  if (select papel from perfis where id = v_id) <> 'aluno' then raise exception 'Essa conta não é de aluno.'; end if;
  if exists (select 1 from matriculas where aluno_id = v_id and produto_id = p_produto and status = 'ativa') then
    return 'Esse aluno já tem acesso ativo a este produto.';
  end if;
  insert into matriculas (aluno_id, produto_id, turma_id, origem) values (v_id, p_produto, p_turma, 'manual');
  update perfis set turma_id = coalesce(p_turma, turma_id) where id = v_id;
  return 'Acesso liberado.';
end $$;

create or replace function professor_resumo_simulados()
returns table (id uuid, codigo text, tipo tipo_simulado, n_questoes int, liberado boolean,
               tem_gabarito boolean, envios int, media numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  select s.id, s.codigo, s.tipo, s.n_questoes, s.liberado,
         exists (select 1 from gabaritos g where g.simulado_id = s.id),
         (select count(*)::int from envios e where e.simulado_id = s.id and e.conta_evolucao),
         (select round(avg(e.nota), 1) from envios e where e.simulado_id = s.id and e.conta_evolucao)
    from simulados s
   order by s.criado_em desc;
end $$;

-- resumo por prova de origem (quantas questões, revisadas e publicadas)
drop function if exists professor_provas_banco();
create or replace function professor_provas_banco()
returns table (prova text, banca text, orgao text, cargo text, ano int, tipo text,
               total int, revisadas int, publicadas int, com_resolucao int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  select coalesce(q.prova, case when q.origem = 'autoral' then 'AUTORAIS' else 'SEM-PROVA' end),
         min(q.banca), min(q.orgao), min(q.cargo), min(q.ano), min(q.tipo),
         count(*)::int, count(*) filter (where q.revisada)::int, count(*) filter (where q.publicada)::int,
         count(*) filter (where coalesce(g.comentario, '') <> '')::int
    from questoes q left join questoes_gabarito g on g.questao_id = q.id
   group by 1
   order by 5 desc nulls last, 1;
end $$;

create or replace function assuntos_usados() returns setof text
language sql stable security definer set search_path = public as $$
  select distinct a from (select nome a from assuntos union all select assunto from questoes) x
   where coalesce(a, '') <> '' and eh_professor()
   order by 1;
$$;

-- dúvidas (privadas: aluno e professor)
create table if not exists duvidas (
  id            uuid primary key default gen_random_uuid(),
  aluno_id      uuid not null references perfis(id) on delete cascade,
  aula_id       uuid references aulas(id) on delete set null,
  contexto      text not null default '',
  status        status_duvida not null default 'pendente',
  lida_aluno    boolean not null default true,
  criada_em     timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index if not exists duvidas_status on duvidas (status, atualizada_em);
create index if not exists duvidas_aluno on duvidas (aluno_id, atualizada_em desc);

create table if not exists duvida_mensagens (
  id           uuid primary key default gen_random_uuid(),
  duvida_id    uuid not null references duvidas(id) on delete cascade,
  do_professor boolean not null,
  texto        text not null check (length(texto) between 1 and 3000),
  criada_em    timestamptz not null default now()
);
create index if not exists duvida_mensagens_duvida on duvida_mensagens (duvida_id, criada_em);

create or replace function enviar_duvida(p_aula uuid, p_texto text, p_contexto text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_texto text := trim(coalesce(p_texto, '')); v_ctx text; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Faça login para enviar.'; end if;
  if not tem_matricula_ativa() then raise exception 'Seu acesso não está ativo.'; end if;
  if length(v_texto) < 5 then raise exception 'Escreva a dúvida com um pouco mais de detalhe.'; end if;
  if length(v_texto) > 2000 then raise exception 'A dúvida pode ter até 2.000 caracteres.'; end if;
  if (select count(*) from duvidas where aluno_id = auth.uid() and criada_em > now() - interval '1 day') >= 15 then
    raise exception 'Você já enviou muitas dúvidas hoje. Traga as outras para o plantão ao vivo.';
  end if;
  if p_aula is not null then
    select 'Módulo ' || m.numero || ' · ' ||
           case when a.tipo = 'revisao' then 'Revisão' else 'Aula ' || a.numero end || ' · ' || a.titulo
      into v_ctx from aulas a join modulos m on m.id = a.modulo_id where a.id = p_aula;
  end if;
  v_ctx := coalesce(v_ctx, left(nullif(trim(coalesce(p_contexto, '')), ''), 120), 'Dúvida geral');
  insert into duvidas (aluno_id, aula_id, contexto) values (auth.uid(), p_aula, v_ctx) returning id into v_id;
  insert into duvida_mensagens (duvida_id, do_professor, texto) values (v_id, false, v_texto);
  return v_id;
end $$;

create or replace function responder_duvida(p_duvida uuid, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  if length(trim(coalesce(p_texto, ''))) < 2 then raise exception 'Escreva a resposta.'; end if;
  insert into duvida_mensagens (duvida_id, do_professor, texto) values (p_duvida, true, trim(p_texto));
  update duvidas set status = 'respondida', lida_aluno = false, atualizada_em = now() where id = p_duvida;
  if not found then raise exception 'Dúvida não encontrada.'; end if;
end $$;

create or replace function encerrar_duvida(p_duvida uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  update duvidas set status = 'sanada', atualizada_em = now() where id = p_duvida;
end $$;

create or replace function avaliar_resposta(p_duvida uuid, p_entendeu boolean, p_texto text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_texto text := trim(coalesce(p_texto, ''));
begin
  update duvidas
     set status = case when p_entendeu then 'sanada'::status_duvida else 'nao_compreendida'::status_duvida end,
         lida_aluno = true, atualizada_em = now()
   where id = p_duvida and aluno_id = auth.uid() and status = 'respondida';
  if not found then raise exception 'Esta dúvida não está aguardando a sua avaliação.'; end if;
  if not p_entendeu and v_texto <> '' then
    insert into duvida_mensagens (duvida_id, do_professor, texto) values (p_duvida, false, left(v_texto, 2000));
  end if;
end $$;

create or replace function marcar_duvidas_lidas() returns void
language sql security definer set search_path = public as $$
  update duvidas set lida_aluno = true where aluno_id = auth.uid() and not lida_aluno;
$$;

create or replace function professor_engajamento_turmas()
returns table (turma_id uuid, turma text, produto text, inicio date, ativos int, estudaram_semana int, sem_estudar_7d int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  with ativos as (
         select distinct p.id, p.turma_id from perfis p
           join matriculas m on m.aluno_id = p.id and m.status = 'ativa'
          where p.papel = 'aluno'),
       semana as (select distinct d.aluno_id from dias_estudo d where d.dia > _hoje() - 7)
  select t.id, coalesce(t.nome, 'Sem turma'), pr.nome, t.inicio,
         count(*)::int, count(s.aluno_id)::int, (count(*) - count(s.aluno_id))::int
    from ativos a
    left join turmas t on t.id = a.turma_id
    left join produtos pr on pr.id = t.produto_id
    left join semana s on s.aluno_id = a.id
   group by t.id, t.nome, pr.nome, t.inicio
   order by t.inicio desc nulls last;
end $$;

create or replace function professor_questoes_criticas(p_turma uuid default null, p_simulado uuid default null, p_limite int default 20)
returns table (simulado_id uuid, codigo text, questao int, habilidade text, assunto text, nivel text,
               pct_erro numeric, respostas int, mais_marcada text, certa text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  with e as (
         select en.simulado_id, en.respostas, p.turma_id
           from envios en join perfis p on p.id = en.aluno_id where en.conta_evolucao
         union all
         select a.simulado_id, a.respostas, a.turma_id from envios_anonimos a),
       f as (select e.* from e where (p_turma is null or e.turma_id = p_turma) and (p_simulado is null or e.simulado_id = p_simulado)),
       q as (
         select f.simulado_id, i, substr(f.respostas, i, 1) as letra, substr(g.respostas, i, 1) as gab
           from f join gabaritos g on g.simulado_id = f.simulado_id
           cross join lateral generate_series(1, length(g.respostas)) as i),
       agg as (
         select q.simulado_id, q.i, min(q.gab) as gab, count(*)::int as n,
                count(*) filter (where q.letra <> q.gab)::int as erros,
                mode() within group (order by q.letra) filter (where q.letra <> q.gab and q.letra <> '-') as mais
           from q group by q.simulado_id, q.i)
  select agg.simulado_id, s.codigo, agg.i,
         nullif(g.habilidades[agg.i], ''), nullif(g.assuntos[agg.i], ''), nullif(g.niveis[agg.i], ''),
         round(100.0 * agg.erros / agg.n, 1), agg.n, agg.mais, agg.gab
    from agg
    join simulados s on s.id = agg.simulado_id
    join gabaritos g on g.simulado_id = agg.simulado_id
   order by 7 desc, agg.n desc, s.codigo, agg.i
   limit greatest(1, least(p_limite, 200));
end $$;

create or replace function professor_erros_por_assunto(p_turma uuid default null)
returns table (assunto text, habilidade text, questoes int, respostas int, pct_erro numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not eh_professor() then raise exception 'Somente o professor.'; end if;
  return query
  with e as (
         select en.simulado_id, en.respostas, p.turma_id
           from envios en join perfis p on p.id = en.aluno_id where en.conta_evolucao
         union all
         select a.simulado_id, a.respostas, a.turma_id from envios_anonimos a),
       q as (
         select e.simulado_id, i, nullif(g.assuntos[i], '') as assunto, nullif(g.habilidades[i], '') as hab,
                substr(e.respostas, i, 1) <> substr(g.respostas, i, 1) as errou
           from e join gabaritos g on g.simulado_id = e.simulado_id
           cross join lateral generate_series(1, length(g.respostas)) as i
          where p_turma is null or e.turma_id = p_turma)
  select q.assunto, q.hab, count(distinct (q.simulado_id, q.i))::int, count(*)::int,
         round(100.0 * count(*) filter (where q.errou) / count(*), 1)
    from q where q.assunto is not null or q.hab is not null
   group by q.assunto, q.hab
   order by 5 desc, 4 desc;
end $$;

-- conquistas: sequência de dias e pontos (1/min de aula, 20/mini, 50/completo, 2/questão do banco)
create or replace function _conquistas(p_aluno uuid)
returns table (sequencia_atual int, maior_sequencia int, dias_total int, minutos_aula int,
               minis int, completos int, questoes int, pontos int)
language sql stable security definer set search_path = public as $$
  with d as (select dia, dia - (row_number() over (order by dia))::int as grupo from dias_estudo where aluno_id = p_aluno),
       ilhas as (select max(dia) as fim, count(*)::int as n from d group by grupo),
       x as (
         select
           coalesce((select n from ilhas where fim >= _hoje() - 1 order by fim desc limit 1), 0) as seq,
           coalesce((select max(n) from ilhas), 0) as maior,
           (select count(*)::int from dias_estudo where aluno_id = p_aluno) as dias,
           coalesce((select sum(a.duracao_min)::int from progresso_aulas pa join aulas a on a.id = pa.aula_id
                      where pa.aluno_id = p_aluno), 0) as minutos,
           (select count(*)::int from envios e join simulados s on s.id = e.simulado_id
             where e.aluno_id = p_aluno and e.conta_evolucao and s.tipo in ('mini', 'diagnostico')) as minis,
           (select count(*)::int from envios e join simulados s on s.id = e.simulado_id
             where e.aluno_id = p_aluno and e.conta_evolucao and s.tipo = 'completo') as completos,
           (select count(*)::int from respostas_questoes where aluno_id = p_aluno) as questoes)
  select seq, maior, dias, minutos, minis, completos, questoes, minutos + 20 * minis + 50 * completos + 2 * questoes from x;
$$;
revoke execute on function _conquistas(uuid) from public, anon, authenticated;

create or replace function conquistas_de(p_aluno uuid)
returns table (sequencia_atual int, maior_sequencia int, dias_total int, minutos_aula int,
               minis int, completos int, questoes int, pontos int)
language sql stable security definer set search_path = public as $$
  select * from _conquistas(p_aluno) where p_aluno = auth.uid() or eh_professor();
$$;

-- todos os alunos são adultos: o ranking só depende de o aluno querer participar
create or replace function ranking_liberado(p_aluno uuid) returns boolean
language sql stable as $$ select true $$;

create or replace function evolucao_aluno(p_aluno uuid) returns int
language sql stable security definer set search_path = public as $$
  with m as (
    select e.nota, e.enviado_em from envios e join simulados s on s.id = e.simulado_id
     where e.aluno_id = p_aluno and e.conta_evolucao and s.tipo = 'mini')
  select case when (select count(*) from m) >= 2
              then ((select nota from m order by enviado_em desc limit 1) - (select nota from m order by enviado_em limit 1))::int end;
$$;

create or replace function meu_ranking()
returns table (posicao int, total int, evolucao int, participa boolean, liberado boolean)
language sql stable security definer set search_path = public as $$
  with eu as (select id, turma_id, participa_ranking from perfis where id = auth.uid()),
       part as (
         select p.id, evolucao_aluno(p.id) as ev from perfis p, eu
          where p.papel = 'aluno' and p.turma_id is not distinct from eu.turma_id and p.participa_ranking),
       r as (select id, ev, rank() over (order by ev desc nulls last) as pos from part)
  select (select pos::int from r where id = auth.uid()), (select count(*)::int from part),
         evolucao_aluno(auth.uid()), (select participa_ranking from eu), true;
$$;

create or replace function ranking_turma(p_ordem text default 'evolucao')
returns table (posicao int, apelido text, evolucao int, pontos int, maior_sequencia int, eu boolean)
language sql stable security definer set search_path = public as $$
  with eu as (select id, turma_id from perfis where id = auth.uid()),
       part as (
         select p.id, p.apelido, evolucao_aluno(p.id) as ev, c.pontos, c.maior_sequencia
           from perfis p cross join eu cross join lateral _conquistas(p.id) c
          where p.papel = 'aluno' and p.turma_id is not distinct from eu.turma_id
            and p.participa_ranking and p.apelido is not null),
       r as (
         select part.*, (rank() over (order by
                  case when p_ordem = 'pontos' then part.pontos else coalesce(part.ev, -1000) end desc,
                  case when p_ordem = 'pontos' then coalesce(part.ev, -1000) else part.pontos end desc))::int as pos
           from part)
  select r.pos, r.apelido, r.ev, r.pontos, r.maior_sequencia, r.id = auth.uid()
    from r where r.pos <= 20 or r.id = auth.uid()
   order by r.pos, r.apelido;
$$;

-- =====================================================================
-- 7. Kiwify
-- =====================================================================
create table if not exists eventos_kiwify (
  id             uuid primary key default gen_random_uuid(),
  order_id       text,
  evento         text,
  email          text,
  produto_kiwify text,
  payload        jsonb not null,
  resultado      text,
  recebido_em    timestamptz not null default now()
);

create table if not exists compras_pendentes (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  produto_id  uuid not null references produtos(id),
  order_id    text unique not null,
  criado_em   timestamptz not null default now(),
  usado_em    timestamptz
);

create or replace function proxima_turma(p_produto uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select id from turmas where produto_id = p_produto and inicio >= _hoje() order by inicio limit 1),
    (select id from turmas where produto_id = p_produto order by inicio desc limit 1));
$$;

-- quem compra o curso de um edital passa a seguir esse edital (se ainda não segue nenhum)
create or replace function _seguir_edital_do_produto(p_aluno uuid, p_produto uuid) returns void
language sql security definer set search_path = public as $$
  update perfis set edital_id = (select edital_id from produto_editais where produto_id = p_produto limit 1)
   where id = p_aluno and edital_id is null
     and exists (select 1 from produto_editais where produto_id = p_produto);
$$;
revoke execute on function _seguir_edital_do_produto(uuid, uuid) from public, anon, authenticated;

create or replace function kiwify_compra_aprovada(p_email text, p_produto_kiwify text, p_order text)
returns text
language plpgsql security definer set search_path = public as $$
declare v_prod uuid; v_aluno uuid; v_turma uuid;
begin
  select id into v_prod from produtos where kiwify_product_id = p_produto_kiwify;
  if v_prod is null then return 'produto desconhecido'; end if;
  if exists (select 1 from matriculas where checkout_ref = p_order) then return 'já processado'; end if;

  select u.id into v_aluno from auth.users u join perfis p on p.id = u.id
   where lower(u.email) = lower(trim(p_email)) and p.papel = 'aluno';
  if v_aluno is null then
    insert into compras_pendentes (email, produto_id, order_id) values (lower(trim(p_email)), v_prod, p_order)
    on conflict (order_id) do nothing;
    return 'aguardando cadastro';
  end if;

  v_turma := proxima_turma(v_prod);
  insert into matriculas (aluno_id, produto_id, turma_id, origem, checkout_ref)
  values (v_aluno, v_prod, v_turma, 'checkout', p_order);
  update perfis set turma_id = coalesce(v_turma, turma_id) where id = v_aluno;
  perform _seguir_edital_do_produto(v_aluno, v_prod);
  return 'acesso liberado';
end $$;

create or replace function kiwify_compra_cancelada(p_order text, p_status status_matricula)
returns text
language plpgsql security definer set search_path = public as $$
begin
  update matriculas set status = p_status where checkout_ref = p_order and status = 'ativa';
  if found then return 'acesso encerrado'; end if;
  update compras_pendentes set usado_em = now() where order_id = p_order and usado_em is null;
  return 'nada a encerrar';
end $$;

revoke execute on function kiwify_compra_aprovada(text, text, text) from public, anon, authenticated;
revoke execute on function kiwify_compra_cancelada(text, status_matricula) from public, anon, authenticated;
grant execute on function kiwify_compra_aprovada(text, text, text) to service_role;
grant execute on function kiwify_compra_cancelada(text, status_matricula) to service_role;

create or replace function aplicar_compras_pendentes() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; v_email text; v_turma uuid;
begin
  if new.papel <> 'aluno' then return new; end if;
  select lower(email) into v_email from auth.users where id = new.id;
  for c in select * from compras_pendentes where email = v_email and usado_em is null loop
    v_turma := proxima_turma(c.produto_id);
    insert into matriculas (aluno_id, produto_id, turma_id, origem, checkout_ref)
    values (new.id, c.produto_id, v_turma, 'checkout', c.order_id);
    update compras_pendentes set usado_em = now() where id = c.id;
    update perfis set turma_id = coalesce(v_turma, turma_id) where id = new.id;
    perform _seguir_edital_do_produto(new.id, c.produto_id);
  end loop;
  return new;
end $$;

drop trigger if exists ao_criar_perfil_aplicar_compras on perfis;
create trigger ao_criar_perfil_aplicar_compras after insert on perfis
  for each row execute function aplicar_compras_pendentes();

-- =====================================================================
-- 8. Exclusão de conta e limpeza automática
-- =====================================================================
create table if not exists registro_exclusoes (
  id          uuid primary key default gen_random_uuid(),
  papel       papel_usuario,
  motivo      text not null,
  compras     text[] not null default '{}',
  excluido_em timestamptz not null default now()
);

create or replace function _apagar_usuario(p_id uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select lower(email) into v_email from auth.users where id = p_id;
  insert into envios_anonimos (simulado_id, turma_id, respostas, acertos, enviado_em)
  select e.simulado_id, p.turma_id, e.respostas, e.acertos, e.enviado_em
    from envios e join perfis p on p.id = e.aluno_id
   where e.aluno_id = p_id and e.conta_evolucao;
  insert into registro_exclusoes (papel, motivo, compras)
  select p.papel, p_motivo,
         coalesce(array(select m.checkout_ref from matriculas m where m.aluno_id = p_id and m.checkout_ref is not null), '{}')
    from perfis p where p.id = p_id;
  if v_email is not null then
    update eventos_kiwify set email = null where lower(email) = v_email;
    delete from compras_pendentes where email = v_email and usado_em is not null;
  end if;
  delete from auth.users where id = p_id;
end $$;
revoke execute on function _apagar_usuario(uuid, text) from public, anon, authenticated;

create or replace function excluir_minha_conta() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Faça login.'; end if;
  if eh_professor() then raise exception 'A conta do professor não pode ser excluída por aqui.'; end if;
  perform _apagar_usuario(auth.uid(), 'pedido do usuário');
end $$;

create or replace function limpar_contas_expiradas(p_meses int default 6) returns int
language plpgsql security definer set search_path = public as $$
declare r record; v_n int := 0; v_limite timestamptz := now() - make_interval(months => p_meses);
begin
  for r in
    select p.id, exists (select 1 from matriculas m where m.aluno_id = p.id) as comprou
      from perfis p join auth.users u on u.id = p.id
     where p.papel <> 'professor'
       and coalesce(u.last_sign_in_at, u.created_at) < v_limite
       and not exists (
             select 1 from matriculas m join produtos pr on pr.id = m.produto_id
              where m.aluno_id = p.id and m.status = 'ativa'
                and (pr.acesso_ate is null or pr.acesso_ate + make_interval(months => p_meses) > now()))
  loop
    perform _apagar_usuario(r.id, case when r.comprou then 'fim do acesso' else 'conta sem uso' end);
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke execute on function limpar_contas_expiradas(int) from public, anon, authenticated;

do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('limpeza-contas-expiradas', '0 6 * * *', 'select public.limpar_contas_expiradas(6)');
exception when others then
  raise notice 'Limpeza automática não agendada (%). Ative a extensão pg_cron e rode este arquivo de novo.', sqlerrm;
end $$;

-- =====================================================================
-- 9. Regras de acesso (Row Level Security)
-- =====================================================================
do $$ declare t text; begin
  foreach t in array array['produtos','turmas','perfis','matriculas','configuracoes','disciplinas','assuntos','editais',
    'edital_disciplinas','produto_editais','modulos','aulas','simulados','gabaritos','progresso_aulas','dias_estudo',
    'rascunhos_cartao','envios','envios_anonimos','recados','materiais_habilidade','textos_base','questoes',
    'questoes_gabarito','respostas_questoes','listas_questoes','tentativas_questoes','duvidas','duvida_mensagens',
    'eventos_kiwify','compras_pendentes','registro_exclusoes'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- cria (ou recria) uma regra: assim o arquivo pode rodar de novo
create or replace function _regra(p_tabela text, p_nome text, p_sql text) returns void
language plpgsql as $$
begin
  execute format('drop policy if exists %I on %I', p_nome, p_tabela);
  execute format('create policy %I on %I %s', p_nome, p_tabela, p_sql);
end $$;

-- públicos (vitrine) e catálogo
select _regra('produtos', 'produtos: todos leem', 'for select using (true)');
select _regra('produtos', 'produtos: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('turmas', 'turmas: todos leem', 'for select using (true)');
select _regra('turmas', 'turmas: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('configuracoes', 'config: todos leem', 'for select using (true)');
select _regra('configuracoes', 'config: professor altera', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('disciplinas', 'disciplinas: todos leem', 'for select using (true)');
select _regra('disciplinas', 'disciplinas: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('assuntos', 'assuntos: todos leem', 'for select using (true)');
select _regra('assuntos', 'assuntos: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('editais', 'editais: publicados para todos', 'for select using (publicado or eh_professor())');
select _regra('editais', 'editais: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('edital_disciplinas', 'edital disc.: todos leem', 'for select using (true)');
select _regra('edital_disciplinas', 'edital disc.: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('produto_editais', 'produto editais: todos leem', 'for select using (true)');
select _regra('produto_editais', 'produto editais: professor edita', 'for all using (eh_professor()) with check (eh_professor())');

-- perfis: cada um vê e edita o seu; o professor vê todos
select _regra('perfis', 'perfis: ver o próprio', 'for select using (id = auth.uid() or eh_professor())');
select _regra('perfis', 'perfis: editar o próprio', 'for update using (id = auth.uid() or eh_professor()) with check (id = auth.uid() or eh_professor())');

select _regra('matriculas', 'matrículas: ver as próprias', 'for select using (aluno_id = auth.uid() or eh_professor())');
select _regra('matriculas', 'matrículas: professor edita', 'for all using (eh_professor()) with check (eh_professor())');

-- conteúdo do curso
select _regra('modulos', 'módulos: alunos leem', 'for select using (tem_matricula_ativa() or eh_professor())');
select _regra('modulos', 'módulos: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('aulas', 'aulas: alunos leem publicadas', 'for select using ((publicada and tem_matricula_ativa()) or eh_professor())');
select _regra('aulas', 'aulas: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('simulados', 'simulados: alunos leem liberados', 'for select using ((liberado and tem_matricula_ativa()) or eh_professor())');
select _regra('simulados', 'simulados: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('gabaritos', 'gabaritos: só professor', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('materiais_habilidade', 'materiais: alunos leem', 'for select using ((publicada and tem_matricula_ativa()) or eh_professor())');
select _regra('materiais_habilidade', 'materiais: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('recados', 'recados: logados leem', 'for select using (auth.uid() is not null)');
select _regra('recados', 'recados: professor edita', 'for all using (eh_professor()) with check (eh_professor())');

-- atividade do aluno
select _regra('progresso_aulas', 'progresso: dono', 'for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid())');
select _regra('progresso_aulas', 'progresso: professor lê', 'for select using (eh_professor())');
select _regra('dias_estudo', 'dias: dono', 'for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid())');
select _regra('dias_estudo', 'dias: professor lê', 'for select using (eh_professor())');
select _regra('rascunhos_cartao', 'rascunhos: dono', 'for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid())');
select _regra('envios', 'envios: ler', 'for select using (aluno_id = auth.uid() or eh_professor())');
select _regra('envios_anonimos', 'anônimos: só professor lê', 'for select using (eh_professor())');

-- banco de questões: qualquer pessoa com conta vê as publicadas (o limite é para responder)
select _regra('textos_base', 'textos-base: logados leem', 'for select using (auth.uid() is not null)');
select _regra('textos_base', 'textos-base: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('questoes', 'questões: logados leem publicadas', 'for select using ((publicada and auth.uid() is not null) or eh_professor())');
select _regra('questoes', 'questões: professor edita', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('questoes_gabarito', 'resolução: só professor', 'for all using (eh_professor()) with check (eh_professor())');
select _regra('respostas_questoes', 'respostas: ler', 'for select using (aluno_id = auth.uid() or eh_professor())');
select _regra('tentativas_questoes', 'tentativas: dono e professor leem', 'for select using (aluno_id = auth.uid() or eh_professor())');
select _regra('listas_questoes', 'listas: dono lê', 'for select using (aluno_id = auth.uid() or eh_professor())');
select _regra('listas_questoes', 'listas: dono apaga', 'for delete using (aluno_id = auth.uid())');

-- dúvidas (só entram pelas funções)
select _regra('duvidas', 'dúvidas: aluno e professor leem', 'for select using (aluno_id = auth.uid() or eh_professor())');
select _regra('duvida_mensagens', 'mensagens: aluno e professor leem',
  'for select using (eh_professor() or exists (select 1 from duvidas d where d.id = duvida_id and d.aluno_id = auth.uid()))');

-- registros internos
select _regra('eventos_kiwify', 'eventos: só professor lê', 'for select using (eh_professor())');
select _regra('compras_pendentes', 'pendentes: só professor lê', 'for select using (eh_professor())');
select _regra('registro_exclusoes', 'exclusões: só professor lê', 'for select using (eh_professor())');

-- arquivos: bucket privado 'materiais'
insert into storage.buckets (id, name, public) values ('materiais', 'materiais', false)
on conflict (id) do nothing;

do $$ begin
  drop policy if exists "materiais: aluno ativo lê" on storage.objects;
  create policy "materiais: aluno ativo lê" on storage.objects for select using (
    bucket_id = 'materiais' and (
      eh_professor()
      or (tem_matricula_ativa() and (
            name not like 'gabaritos/%'
            or exists (select 1 from simulados s join envios e on e.simulado_id = s.id
                        where s.gabarito_pdf_path = storage.objects.name and e.aluno_id = auth.uid())))));
  drop policy if exists "materiais: imagens do banco" on storage.objects;
  create policy "materiais: imagens do banco" on storage.objects for select
    using (bucket_id = 'materiais' and name like 'questoes/%' and auth.uid() is not null);
  drop policy if exists "materiais: professor envia" on storage.objects;
  create policy "materiais: professor envia" on storage.objects for insert with check (bucket_id = 'materiais' and eh_professor());
  drop policy if exists "materiais: professor altera" on storage.objects;
  create policy "materiais: professor altera" on storage.objects for update using (bucket_id = 'materiais' and eh_professor());
  drop policy if exists "materiais: professor apaga" on storage.objects;
  create policy "materiais: professor apaga" on storage.objects for delete using (bucket_id = 'materiais' and eh_professor());
end $$;

-- =====================================================================
-- 10. Dados iniciais
-- =====================================================================
insert into configuracoes (chave, valor) values
  ('banco_gratis_por_dia', '10'),
  ('banco_gratis_lista_max', '10')
on conflict (chave) do nothing;

insert into produtos (slug, nome, tipo, venda_aberta) values
  ('banco-completo', 'Banco de questões · completo', 'banco', false)
on conflict (slug) do nothing;

-- disciplinas mais comuns nas carreiras policiais (dá para incluir outras no painel)
insert into disciplinas (nome, ordem) values
  ('Língua Portuguesa', 1), ('Raciocínio Lógico', 2), ('Matemática', 3), ('Informática', 4),
  ('Direito Constitucional', 5), ('Direito Administrativo', 6), ('Direito Penal', 7), ('Direito Processual Penal', 8),
  ('Direito Penal Militar', 9), ('Direitos Humanos', 10), ('Legislação Extravagante', 11),
  ('Direitos Humanos e Legislação Extravagante', 12), ('Legislação de Trânsito', 13), ('Ética no Serviço Público', 14),
  ('Estatuto das Guardas Municipais', 15), ('Estatística', 16), ('Língua Inglesa', 17), ('Língua Espanhola', 18),
  ('História de Pernambuco', 19), ('Atualidades', 20), ('Física', 21)
on conflict (nome) do nothing;

-- PM PE 2026 · Soldado (Edital nº 001/2026, Instituto AOCP; prova em 21/02/2027)
-- 60 questões em 3 blocos de 20; mínimo de 30% em cada bloco, sem zerar disciplina; redação de 40 pontos.
insert into editais (slug, nome, orgao, cargo, banca, esfera, escolaridade, situacao, data_prova, tipo_prova, n_alternativas, observacoes, publicado)
values ('pmpe-2026-soldado', 'PM PE 2026 · Soldado', 'PM PE', 'Soldado', 'Instituto AOCP', 'estadual', 'medio', 'aberto',
        '2027-02-21', 'multipla', 5,
        '60 questões (3 blocos de 20). Para não ser eliminado: 30% de cada bloco e do total, sem zerar disciplina. Redação de até 40 pontos no mesmo dia.',
        true)
on conflict (slug) do nothing;

insert into edital_disciplinas (edital_id, disciplina, questoes, peso, bloco, ordem)
select e.id, v.disciplina, v.questoes, 1, v.bloco, v.ordem
  from editais e, (values
    ('Língua Portuguesa', 10, 'Bloco I', 1),
    ('História de Pernambuco', 10, 'Bloco I', 2),
    ('Raciocínio Lógico', 10, 'Bloco II', 3),
    ('Informática', 10, 'Bloco II', 4),
    ('Direito Constitucional', 10, 'Bloco III', 5),
    ('Direitos Humanos e Legislação Extravagante', 10, 'Bloco III', 6)
  ) as v(disciplina, questoes, bloco, ordem)
 where e.slug = 'pmpe-2026-soldado'
on conflict (edital_id, disciplina) do nothing;

drop function if exists _regra(text, text, text);

-- conferência: deve mostrar o edital da PM PE com 6 disciplinas e 60 questões
select e.nome, count(*) as disciplinas, sum(ed.questoes) as questoes
  from editais e join edital_disciplinas ed on ed.edital_id = e.id
 group by e.nome;
