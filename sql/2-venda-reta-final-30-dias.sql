-- =====================================================================
-- 14 · Página de venda do Reta Final PM PE: a nova jogada (apostila em 30 dias)
-- Atualiza só os textos do produto (descrição e o que está incluído).
-- Preço, link da Kiwify e o resto ficam como estão. Pode rodar mais de uma vez.
-- =====================================================================
update produtos
   set descricao = 'A apostila que cobre todo o edital de Soldado da PM PE em 30 dias: 366 páginas, cerca de 12 por dia, e 500 questões no estilo da AOCP.',
       beneficios = array[
         'Apostila de 366 páginas com todo o conteúdo do edital de Soldado',
         'Cronograma de 30 dias: cerca de 12 páginas por dia, começando no dia que você escolher',
         '500 questões no estilo da AOCP, divididas ao longo do mês',
         'Simulados e minissimulados no padrão da prova',
         'Redação com correção nos 4 critérios da AOCP',
         'Redação do Zero: 8 aulas com modelos prontos',
         'Banco de questões e listas em PDF para imprimir'
       ]
 where slug = 'reta-final-pmpe';

-- conferência: deve mostrar 1 linha com a nova descrição
select slug, descricao, array_length(beneficios, 1) as itens_incluidos from produtos where slug = 'reta-final-pmpe';
