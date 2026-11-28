-- =====================================================================
-- 0018 · Aba de Redação (modelo AOCP · concursos)
-- • redacoes: a redação do aluno (digitada ou em PDF/foto) e a correção do professor
--   nos 4 critérios da AOCP (0 a 10 cada, total 0 a 40). Pode ser "zerada", com o motivo.
-- • redacoes_ia: a pré-correção da IA. Só o PROFESSOR lê; o aluno vê só a correção do professor.
-- • redacoes_envios: registro de cada envio. O limite do mês conta por aqui
--   (apagar uma redação ainda não corrigida não devolve a vaga). Mês no horário de Brasília.
-- • redacoes_exemplares: redações-modelo publicadas pelo professor (nota de 0 a 40).
-- • bucket privado 'redacoes': PDFs e fotos das folhas (cada aluno só mexe na própria pasta).
-- Só quem tem curso ou mentoria ativa (tem_matricula_ativa) envia e lê.
-- Pode rodar mais de uma vez.
-- =====================================================================

-- ---------- Redações dos alunos ----------
create table if not exists redacoes (
  id              uuid primary key default gen_random_uuid(),
  aluno_id        uuid not null references perfis (id) on delete cascade,
  tema            text not null check (char_length(tema) between 3 and 200),
  proposta        text check (proposta is null or proposta ~ '^[a-z0-9-]{2,60}$'),
  texto           text,
  arquivo_path    text,
  status          text not null default 'enviada' check (status in ('enviada', 'corrigida')),
  c1 int check (c1 between 0 and 10),
  c2 int check (c2 between 0 and 10),
  c3 int check (c3 between 0 and 10),
  c4 int check (c4 between 0 and 10),
  nota            int check (nota between 0 and 40),
  zerada          boolean not null default false,
  motivo_zero     text check (motivo_zero is null or char_length(motivo_zero) <= 300),
  pontos_fortes   text,
  pontos_melhorar text,
  comentarios     jsonb not null default '{}',     -- {"c1": "...", ... "c4": "..."}
  enviada_em      timestamptz not null default now(),
  corrigida_em    timestamptz,
  constraint redacoes_texto_ou_arquivo check (
    (texto is not null and char_length(texto) between 200 and 6000)
    or (arquivo_path is not null and (texto is null or char_length(texto) <= 6000))
  )
);
create index if not exists redacoes_aluno on redacoes (aluno_id, enviada_em desc);
create index if not exists redacoes_fila on redacoes (status, enviada_em);
alter table redacoes enable row level security;

drop policy if exists "redacoes: dono e professor leem" on redacoes;
create policy "redacoes: dono e professor leem" on redacoes for select using (aluno_id = auth.uid() or eh_professor());
drop policy if exists "redacoes: aluno envia" on redacoes;
create policy "redacoes: aluno envia" on redacoes for insert with check (
  aluno_id = auth.uid() and tem_matricula_ativa() and status = 'enviada' and nota is null and zerada = false
  and (arquivo_path is null or arquivo_path like auth.uid()::text || '/%')
);
drop policy if exists "redacoes: aluno apaga a não corrigida" on redacoes;
create policy "redacoes: aluno apaga a não corrigida" on redacoes for delete using (aluno_id = auth.uid() and status = 'enviada');
drop policy if exists "redacoes: professor corrige" on redacoes;
create policy "redacoes: professor corrige" on redacoes for update using (eh_professor()) with check (eh_professor());
drop policy if exists "redacoes: professor apaga" on redacoes;
create policy "redacoes: professor apaga" on redacoes for delete using (eh_professor());

-- ---------- Pré-correção por IA (só o professor) ----------
create table if not exists redacoes_ia (
  redacao_id      uuid primary key references redacoes (id) on delete cascade,
  status          text not null default 'pendente' check (status in ('pendente', 'pronta', 'erro')),
  c1 int, c2 int, c3 int, c4 int,
  nota            int,
  zerar           boolean not null default false,
  motivo_zero     text,
  comentarios     jsonb not null default '{}',
  pontos_fortes   text,
  pontos_melhorar text,
  alerta          text,
  modelo          text,
  erro            text,
  criada_em       timestamptz not null default now(),
  atualizada_em   timestamptz not null default now()
);
alter table redacoes_ia enable row level security;
drop policy if exists "redacoes_ia: professor" on redacoes_ia;
create policy "redacoes_ia: professor" on redacoes_ia for all using (eh_professor()) with check (eh_professor());

-- ---------- Limite mensal ----------
create table if not exists redacoes_envios (
  id         bigserial primary key,
  aluno_id   uuid not null references perfis (id) on delete cascade,
  enviada_em timestamptz not null default now()
);
create index if not exists redacoes_envios_aluno on redacoes_envios (aluno_id, enviada_em);
alter table redacoes_envios enable row level security;
drop policy if exists "envios: dono lê" on redacoes_envios;
create policy "envios: dono lê" on redacoes_envios for select using (aluno_id = auth.uid() or eh_professor());

insert into configuracoes (chave, valor) values ('redacoes_por_mes', '8') on conflict (chave) do nothing;

-- quantas redações o aluno já enviou neste mês (mês de Brasília); o aluno só consulta o próprio número
create or replace function redacoes_no_mes(p_aluno uuid default auth.uid()) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from redacoes_envios
   where aluno_id = case when auth.uid() is null or eh_professor() then p_aluno else auth.uid() end
     and enviada_em >= (date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo');
$$;

create or replace function redacoes_limite() returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select nullif(regexp_replace(valor #>> '{}', '\D', '', 'g'), '')::int from configuracoes where chave = 'redacoes_por_mes'), 8);
$$;

-- confere o limite e registra o envio no próprio banco (não depende da página)
create or replace function redacoes_conferir_limite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not eh_professor() then
    if redacoes_no_mes(new.aluno_id) >= redacoes_limite() then
      raise exception 'LIMITE_REDACOES' using hint = 'O limite de redações do mês já foi usado.';
    end if;
  end if;
  insert into redacoes_envios (aluno_id, enviada_em) values (new.aluno_id, new.enviada_em);
  return new;
end $$;
drop trigger if exists redacoes_limite_mes on redacoes;
create trigger redacoes_limite_mes before insert on redacoes for each row execute function redacoes_conferir_limite();

-- a nota é sempre a soma dos critérios (ou 0 se zerada): o banco garante
create or replace function redacoes_calcular_nota() returns trigger
language plpgsql as $$
begin
  if new.status = 'corrigida' then
    if new.zerada then
      new.c1 := 0; new.c2 := 0; new.c3 := 0; new.c4 := 0; new.nota := 0;
    else
      new.motivo_zero := null;
      new.nota := coalesce(new.c1, 0) + coalesce(new.c2, 0) + coalesce(new.c3, 0) + coalesce(new.c4, 0);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists redacoes_nota on redacoes;
create trigger redacoes_nota before update on redacoes for each row execute function redacoes_calcular_nota();

-- média de cada critério de todas as redações corrigidas (só números agregados, sem identificar ninguém).
-- As zeradas entram na nota média, mas não na média dos critérios.
drop function if exists redacoes_media_plataforma();
create or replace function redacoes_media_plataforma()
returns table (redacoes int, c1 numeric, c2 numeric, c3 numeric, c4 numeric, nota numeric)
language sql stable security definer set search_path = public as $$
  select count(*)::int,
         round(avg(r.c1) filter (where not r.zerada), 1), round(avg(r.c2) filter (where not r.zerada), 1),
         round(avg(r.c3) filter (where not r.zerada), 1), round(avg(r.c4) filter (where not r.zerada), 1),
         round(avg(r.nota), 1)
    from redacoes r where r.status = 'corrigida' and r.nota is not null
   having tem_matricula_ativa() or eh_professor();
$$;
grant execute on function redacoes_media_plataforma() to authenticated;

-- ---------- Redações-modelo ----------
create table if not exists redacoes_exemplares (
  id         uuid primary key default gen_random_uuid(),
  tema       text not null check (char_length(tema) between 3 and 200),
  nota       int check (nota between 0 and 40),
  texto      text not null check (char_length(texto) between 100 and 6000),
  comentario text check (comentario is null or char_length(comentario) <= 2000),
  publicada  boolean not null default false,
  ordem      int not null default 0,
  criado_em  timestamptz not null default now()
);
alter table redacoes_exemplares enable row level security;
drop policy if exists "exemplares: aluno com curso lê" on redacoes_exemplares;
create policy "exemplares: aluno com curso lê" on redacoes_exemplares for select using (eh_professor() or (publicada and tem_matricula_ativa()));
drop policy if exists "exemplares: professor altera" on redacoes_exemplares;
create policy "exemplares: professor altera" on redacoes_exemplares for all using (eh_professor()) with check (eh_professor());

-- ---------- Arquivos (PDF ou foto da folha) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('redacoes', 'redacoes', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "redacoes arquivos: aluno envia" on storage.objects;
create policy "redacoes arquivos: aluno envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'redacoes' and (storage.foldername(name))[1] = auth.uid()::text and tem_matricula_ativa());
drop policy if exists "redacoes arquivos: dono e professor leem" on storage.objects;
create policy "redacoes arquivos: dono e professor leem" on storage.objects for select to authenticated
  using (bucket_id = 'redacoes' and ((storage.foldername(name))[1] = auth.uid()::text or eh_professor()));
drop policy if exists "redacoes arquivos: dono e professor apagam" on storage.objects;
create policy "redacoes arquivos: dono e professor apagam" on storage.objects for delete to authenticated
  using (bucket_id = 'redacoes' and ((storage.foldername(name))[1] = auth.uid()::text or eh_professor()));

-- conferência: deve mostrar 4 tabelas e o limite do mês
select (select count(*) from information_schema.tables where table_schema = 'public'
          and table_name in ('redacoes', 'redacoes_ia', 'redacoes_envios', 'redacoes_exemplares')) as tabelas_criadas,
       redacoes_limite() as redacoes_por_mes;
