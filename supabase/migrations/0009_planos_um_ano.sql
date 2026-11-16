-- =====================================================================
-- 0009 · Planos de 1 ano
-- • produtos.dias_acesso: cada compra vale N dias a partir do dia da compra (planos = 365)
-- • produtos.libera_produto_id: o plano Básico libera o PDF do extensivo escolhido
-- • matriculas.valida_ate: preenchido sozinho na compra (hoje + dias_acesso)
-- • as funções de acesso passam a respeitar a validade de cada matrícula
-- Rodar depois da 0008. Pode rodar de novo sem problema.
-- =====================================================================

alter table produtos add column if not exists dias_acesso int check (dias_acesso between 1 and 3650);
alter table produtos add column if not exists libera_produto_id uuid references produtos(id) on delete set null;
alter table matriculas add column if not exists valida_ate date;

create or replace function _validade_matricula() returns trigger
language plpgsql security definer set search_path = public as $$
declare d int;
begin
  if new.valida_ate is null then
    select dias_acesso into d from produtos where id = new.produto_id;
    if d is not null then new.valida_ate := _hoje() + d; end if;
  end if;
  return new;
end $$;
drop trigger if exists matriculas_validade on matriculas;
create trigger matriculas_validade before insert on matriculas for each row execute function _validade_matricula();

create or replace function tem_matricula_ativa() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and p.tipo in ('curso', 'mentoria')
       and (p.acesso_ate is null or p.acesso_ate >= _hoje())
       and (m.valida_ate is null or m.valida_ate >= _hoje()));
$$;

create or replace function tem_curso_edital(p_edital uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select eh_professor() or exists (
    select 1 from matriculas m
      join produtos p on p.id = m.produto_id
      join produto_editais pe on pe.produto_id = p.id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and pe.edital_id = p_edital
       and (p.acesso_ate is null or p.acesso_ate >= _hoje())
       and (m.valida_ate is null or m.valida_ate >= _hoje()));
$$;

create or replace function tem_banco_completo() returns boolean
language sql stable security definer set search_path = public as $$
  select eh_professor() or exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa'
       and (p.acesso_ate is null or p.acesso_ate >= _hoje())
       and (m.valida_ate is null or m.valida_ate >= _hoje()));
$$;

create or replace function tem_produto(p_tipo text, p_edital uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and p.tipo = p_tipo
       and (p.acesso_ate is null or p.acesso_ate >= _hoje())
       and (m.valida_ate is null or m.valida_ate >= _hoje())
       and (p_edital is null or p.edital_id is null or p.edital_id = p_edital));
$$;

-- o plano cobre o curso: Básico → o extensivo escolhido; Até a prova → os cursos do edital; Todos → todos
create or replace function _plano_cobre(p_produto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m join produtos pl on pl.id = m.produto_id, produtos alvo
     where alvo.id = p_produto and m.aluno_id = auth.uid() and m.status = 'ativa'
       and pl.slug like 'plano-%'
       and (pl.acesso_ate is null or pl.acesso_ate >= _hoje())
       and (m.valida_ate is null or m.valida_ate >= _hoje())
       and (pl.libera_produto_id = alvo.id
            or (pl.libera_produto_id is null and pl.tipo = 'curso' and (pl.edital_id is null or pl.edital_id = alvo.edital_id))));
$$;

create or replace function pode_baixar_pdf(p_produto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from produto_pdfs d where d.produto_id = p_produto)
     and (exists (
            select 1 from matriculas m join produtos p on p.id = m.produto_id
             where m.aluno_id = auth.uid() and m.status = 'ativa' and p.id = p_produto
               and (p.acesso_ate is null or p.acesso_ate >= _hoje())
               and (m.valida_ate is null or m.valida_ate >= _hoje()))
          or _plano_cobre(p_produto));
$$;

create or replace function meus_pdfs() returns table (produto_id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome from produtos p
   where exists (select 1 from produto_pdfs d where d.produto_id = p.id)
     and (exists (select 1 from matriculas m where m.aluno_id = auth.uid() and m.status = 'ativa' and m.produto_id = p.id
                    and (p.acesso_ate is null or p.acesso_ate >= _hoje())
                    and (m.valida_ate is null or m.valida_ate >= _hoje()))
          or _plano_cobre(p.id))
   order by p.ordem, p.nome;
$$;

notify pgrst, 'reload schema';

select 'planos de 1 ano prontos' as resultado;
