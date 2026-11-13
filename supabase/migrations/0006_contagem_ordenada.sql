-- A contagem do banco agora vem em páginas de 1000 linhas; para as páginas não se misturarem, a lista precisa de ordem fixa.
-- Pode rodar de novo sem problema.
create or replace function contagem_banco()
returns table (banca text, orgao text, cargo text, ano int, escolaridade text, disciplina text, assunto text,
               tipo text, nivel text, origem text, feita boolean, n int)
language sql stable security definer set search_path = public as $$
  select q.banca, q.orgao, q.cargo, q.ano, q.escolaridade, q.disciplina, q.assunto, q.tipo, q.nivel, q.origem,
         exists (select 1 from respostas_questoes r where r.questao_id = q.id and r.aluno_id = auth.uid()),
         count(*)::int
    from questoes q
   where q.publicada and auth.uid() is not null
   group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
   order by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11;
$$;

notify pgrst, 'reload schema';

select 'contagem do banco pronta' as resultado, count(*) as combinacoes from contagem_banco();
