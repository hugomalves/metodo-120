-- Deixa à venda (visíveis na loja e na vitrine) só a Reta Final PM PE e o Extensivo PRF.
-- Os outros continuam cadastrados, só ficam escondidos. Para mostrar um deles de novo:
-- Painel → Produtos e loja → abra o produto → marque "À venda" → Salvar.
update produtos set venda_aberta = true
 where slug in ('reta-final-pmpe', 'extensivo-prf');

update produtos set venda_aberta = false
 where slug in ('extensivo-pf', 'extensivo-policia-civil', 'extensivo-policia-militar', 'extensivo-policia-penal',
                'extensivo-prf-administrativo', 'extensivo-guardas-municipais')
    or nome in ('Extensivo Carreiras Policiais · PF', 'Extensivo Carreiras Policiais · Polícia Civil',
                'Extensivo Carreiras Policiais · Polícia Militar', 'Extensivo Carreiras Policiais · Polícia Penal',
                'Extensivo Carreiras Policiais · PRF Administrativo', 'Extensivo Carreiras Policiais · Guardas Municipais');

notify pgrst, 'reload schema';

-- conferência: só 2 devem aparecer como "à venda"
select ordem, nome, case when venda_aberta then 'à venda' else 'escondido' end as situacao from produtos order by ordem, nome;
