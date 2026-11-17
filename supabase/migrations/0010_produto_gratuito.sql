-- =====================================================================
-- 0010 · Produto gratuito por enquanto
-- • produtos.gratuito: ao ligar, TODOS os alunos (os de hoje e os que se cadastrarem depois) ganham a matrícula
--   do produto, com tudo o que ele libera (aulas, PDF, minissimulados, simulados do edital, banco completo).
-- • ao desligar, só as matrículas gratuitas são encerradas; quem comprou de verdade continua com acesso.
-- Rodar depois da 0009. Pode rodar de novo sem problema.
-- =====================================================================

alter table produtos add column if not exists gratuito boolean not null default false;

-- matrícula gratuita fica marcada com checkout_ref = 'gratuito:<id do produto>'
create or replace function _matricular_gratis(p_aluno uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- reativa o que foi encerrado numa rodada anterior
  update matriculas m set status = 'ativa'
    from produtos p
   where p.gratuito and m.aluno_id = p_aluno and m.checkout_ref = 'gratuito:' || p.id::text and m.status <> 'ativa';
  -- cria para quem ainda não tem matrícula ativa no produto
  insert into matriculas (aluno_id, produto_id, origem, checkout_ref)
  select p_aluno, p.id, 'manual', 'gratuito:' || p.id::text
    from produtos p
   where p.gratuito
     and not exists (select 1 from matriculas m where m.aluno_id = p_aluno and m.produto_id = p.id
                      and (m.status = 'ativa' or m.checkout_ref = 'gratuito:' || p.id::text));
end $$;
revoke execute on function _matricular_gratis(uuid) from public, anon, authenticated;

-- aluno novo já entra com os produtos gratuitos
create or replace function _perfil_novo_gratis() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.papel = 'aluno' then perform _matricular_gratis(new.id); end if;
  return new;
end $$;
drop trigger if exists perfis_gratis on perfis;
create trigger perfis_gratis after insert on perfis for each row execute function _perfil_novo_gratis();

-- ligar/desligar o gratuito no produto: matricula todos ou encerra só as matrículas gratuitas
create or replace function _produto_gratuito_mudou() returns trigger
language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  if tg_op = 'UPDATE' and new.gratuito is not distinct from old.gratuito then return new; end if;
  if new.gratuito then
    for a in select id from perfis where papel = 'aluno' loop perform _matricular_gratis(a); end loop;
  else
    update matriculas set status = 'cancelada' where checkout_ref = 'gratuito:' || new.id::text and status = 'ativa';
  end if;
  return new;
end $$;
drop trigger if exists produtos_gratuito on produtos;
create trigger produtos_gratuito after insert or update of gratuito on produtos
  for each row execute function _produto_gratuito_mudou();

-- Reta Final PM PE: gratuita por enquanto (para encerrar: Painel → Produtos e loja → desmarcar "Gratuito por enquanto")
update produtos set gratuito = true where slug = 'reta-final-pmpe';

notify pgrst, 'reload schema';

select p.nome, p.gratuito,
       (select count(*) from matriculas m where m.produto_id = p.id and m.status = 'ativa') as alunos_com_acesso
  from produtos p where p.slug = 'reta-final-pmpe';
