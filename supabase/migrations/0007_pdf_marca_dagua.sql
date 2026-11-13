-- PDF do produto entregue com marca d'água (nome completo, CPF e telefone de quem comprou).
-- Pode rodar de novo sem problema.

-- 1) Dados de quem comprou (a Kiwify manda no aviso de compra; se faltar, o aluno informa uma vez)
create table if not exists dados_comprador (
  email         text primary key,
  nome          text not null,
  cpf           text not null,
  telefone      text not null,
  origem        text not null default 'kiwify' check (origem in ('kiwify', 'aluno')),
  atualizado_em timestamptz not null default now()
);
alter table dados_comprador enable row level security;
drop policy if exists "dados_comprador: aluno lê o seu" on dados_comprador;
create policy "dados_comprador: aluno lê o seu" on dados_comprador for select
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));
-- o aluno só consegue informar uma vez (não consegue trocar depois: o que vale é o da compra)
drop policy if exists "dados_comprador: aluno informa" on dados_comprador;
create policy "dados_comprador: aluno informa" on dados_comprador for insert
  with check (email = lower(coalesce(auth.jwt() ->> 'email', '')) and origem = 'aluno');
drop policy if exists "dados_comprador: professor lê" on dados_comprador;
create policy "dados_comprador: professor lê" on dados_comprador for select using (eh_professor());

-- 2) Qual PDF pertence a qual produto (o aluno nunca lê esta tabela: o arquivo só sai marcado, pelo servidor)
create table if not exists produto_pdfs (
  produto_id    uuid primary key references produtos(id) on delete cascade,
  pdf_path      text not null,
  nome_arquivo  text,
  atualizado_em timestamptz not null default now()
);
alter table produto_pdfs enable row level security;
drop policy if exists "produto_pdfs: professor" on produto_pdfs;
create policy "produto_pdfs: professor" on produto_pdfs for all using (eh_professor()) with check (eh_professor());

-- 3) Pasta privada só do professor (alunos não têm nenhuma permissão nela)
insert into storage.buckets (id, name, public) values ('produtos-pdf', 'produtos-pdf', false) on conflict (id) do nothing;
do $$ begin
  drop policy if exists "produtos-pdf: professor envia" on storage.objects;
  create policy "produtos-pdf: professor envia" on storage.objects for insert with check (bucket_id = 'produtos-pdf' and eh_professor());
  drop policy if exists "produtos-pdf: professor lê" on storage.objects;
  create policy "produtos-pdf: professor lê" on storage.objects for select using (bucket_id = 'produtos-pdf' and eh_professor());
  drop policy if exists "produtos-pdf: professor apaga" on storage.objects;
  create policy "produtos-pdf: professor apaga" on storage.objects for delete using (bucket_id = 'produtos-pdf' and eh_professor());
end $$;

-- 4) O aluno comprou este produto (acesso vigente) e ele tem PDF?
create or replace function pode_baixar_pdf(p_produto uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m join produtos p on p.id = m.produto_id
     where m.aluno_id = auth.uid() and m.status = 'ativa' and p.id = p_produto
       and (p.acesso_ate is null or p.acesso_ate >= _hoje())
       and exists (select 1 from produto_pdfs d where d.produto_id = p.id));
$$;

create or replace function meus_pdfs() returns table (produto_id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome from matriculas m join produtos p on p.id = m.produto_id
   where m.aluno_id = auth.uid() and m.status = 'ativa' and (p.acesso_ate is null or p.acesso_ate >= _hoje())
     and exists (select 1 from produto_pdfs d where d.produto_id = p.id)
   group by p.id, p.nome, p.ordem order by p.ordem, p.nome;
$$;
revoke execute on function pode_baixar_pdf(uuid) from public, anon;
revoke execute on function meus_pdfs() from public, anon;
grant execute on function pode_baixar_pdf(uuid) to authenticated;
grant execute on function meus_pdfs() to authenticated;

-- 5) Reta Final PM PE à venda
update produtos set venda_aberta = true where slug = 'reta-final-pmpe';

notify pgrst, 'reload schema';

select 'pdf com marca dagua pronto' as resultado, nome, case when venda_aberta then 'à venda' else 'fechado' end as situacao, checkout_url is not null as tem_link, kiwify_product_id is not null as tem_id_kiwify
  from produtos where slug = 'reta-final-pmpe';
