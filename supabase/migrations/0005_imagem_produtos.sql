-- Imagem do curso na loja (quadrada). O arquivo fica no bucket público 'vitrine' (pasta produtos/); aqui só o caminho.
-- Rodar ANTES de subir o código novo. Pode rodar de novo sem problema.
alter table produtos add column if not exists imagem_path text;

notify pgrst, 'reload schema';

select 'imagem dos produtos pronta' as resultado, count(*) as produtos from produtos;
