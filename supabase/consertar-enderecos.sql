-- 1) Devolve o endereço original da página de cada curso (/curso/...), se ele tiver mudado ao salvar no painel.
update produtos p set slug = v.slug
  from (values
    ('Reta Final PM PE 2026 · Soldado', 'reta-final-pmpe'),
    ('Extensivo Carreiras Policiais · PRF', 'extensivo-prf'),
    ('Extensivo Carreiras Policiais · PF', 'extensivo-pf'),
    ('Extensivo Carreiras Policiais · Polícia Civil', 'extensivo-policia-civil'),
    ('Extensivo Carreiras Policiais · Polícia Militar', 'extensivo-policia-militar'),
    ('Extensivo Carreiras Policiais · Polícia Penal', 'extensivo-policia-penal'),
    ('Extensivo Carreiras Policiais · PRF Administrativo', 'extensivo-prf-administrativo'),
    ('Extensivo Carreiras Policiais · Guardas Municipais', 'extensivo-guardas-municipais')
  ) as v(nome, slug)
 where p.nome = v.nome and p.slug <> v.slug
   and not exists (select 1 from produtos x where x.slug = v.slug);

-- 2) Textos da Reta Final PM PE: estudo intenso até a prova (nada do plano de 2 horas do Extensivo).
--    Atenção: troca a descrição e a lista "O que está incluído" que estão hoje no painel.
update produtos set
  descricao = 'Estudo intenso até a prova da PM PE, em 21 de fevereiro de 2027 (Instituto AOCP): as 6 disciplinas do edital, com foco no que a banca mais cobra, simulados no padrão AOCP e correção com a regra de corte do edital.',
  beneficios = array[
    'Estudo intenso até a prova, organizado pelas 6 disciplinas do edital',
    'Aulas em PDF das 6 disciplinas: teoria e questões',
    'Foco no que a AOCP mais cobra, contado no banco de questões',
    'Simulados completos no padrão AOCP, com a regra de corte do edital (30% por bloco, sem zerar disciplina)',
    'Banco de questões da AOCP liberado e caderno de erros',
    'Minissimulado em cada aula, com gabarito comentado'
  ],
  selo = 'Reta final'
where slug = 'reta-final-pmpe';

notify pgrst, 'reload schema';

-- conferência: o endereço de cada curso é /curso/ + a coluna "slug"
select ordem, nome, slug from produtos order by ordem, nome;
