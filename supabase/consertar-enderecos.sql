-- Devolve o endereço original da página de cada curso (/curso/...), caso ele tenha mudado ao salvar o produto no painel.
-- Pode rodar de novo sem problema: só troca quando o nome bate e o endereço original está livre.
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

notify pgrst, 'reload schema';

-- conferência: o endereço de cada curso é /curso/ + a coluna "slug"
select ordem, nome, slug from produtos order by ordem, nome;
