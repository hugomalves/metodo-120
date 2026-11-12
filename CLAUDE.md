# Método 120 · instruções do projeto

Site de preparação para concursos de carreiras policiais. Marca: **Método 120** ("Estude certo. Evolua. Aprove.").
No ar em https://metodo-120.vercel.app (Vercel, projeto `metodo-120`, publica sozinho a cada push na `main`).

## Quem pede e como trabalhar com ele

- **Hugo** (professor e servidor público, Natal/RN). **Não é programador.** Tudo em **português**, linguagem simples, sem jargão.
- Ele escreve rápido e com erros de digitação: entenda pela intenção.
- Quando ele precisar fazer algo (Supabase, Vercel, Kiwify, DNS): **passo a passo numerado, com o link direto da tela** e o texto exato do botão.
- **Ele decide o produto; você decide a técnica.** Pergunte só o que muda o resultado (preço, regra de acesso, público), de preferência com opções.
- **Visual: mostre antes de publicar.** Trabalhe numa **branch** (ex.: `ajuste-cabecalho`), faça push: a Vercel gera um **link de prévia**. Mande o link ao Hugo e só faça merge na `main` depois de ele aprovar. Mudanças pequenas e de texto podem ir direto, se ele pedir.
- Termine cada entrega com: **o que mudou**, **o que ele precisa fazer (se algo)** e **o próximo passo**. Sem recapitular o caminho.

## Regras que não podem ser quebradas

1. **Nunca peça nem aceite** pela conversa: senha do banco, chave `secret`/`service_role` do Supabase, token da Kiwify, chave do Resend, `CRON_SECRET`, senhas. Segredos vão **só** na Vercel (Settings → Environment Variables, tipo **Secret**). Se ele colar algum, avise para trocar.
2. Nunca coloque `.env.local` em commit.
3. **Público só adulto (18+)**: cadastro exige ano de nascimento e a declaração; o banco recusa menores.
4. LGPD: dados mínimos; nenhum pixel de anúncio ou rastreador na área logada; exclusão de conta pelo próprio aluno. Webhook de pagamento grava só e-mail, produto e status (nunca CPF, telefone, endereço).
5. **O gabarito nunca vai para o navegador antes da resposta.** Toda permissão é por RLS; o que precisa contornar RLS é função `security definer` com checagem de `auth.uid()`.
6. **Promessa honesta**: o produto promete o **plano** (2 horas por dia, por 1 ano), **não a aprovação**. Não escreva textos que garantam aprovação.
7. Direitos autorais: provas oficiais e gabaritos públicos podem entrar; material de terceiros (apostilas, cursinhos, sites de questões) **não**.

## Tecnologia

- Next.js 15 (App Router, server components, server actions), React 19, TypeScript. CSS modules + tokens em `src/app/globals.css` (sem Tailwind).
- Fontes locais: `@fontsource-variable/sora` (títulos), `@fontsource-variable/figtree` (texto), IBM Plex Mono.
- Supabase (Postgres + RLS + funções RPC, Auth, Storage): projeto `kuffwzclcggsmwyrtsrx` (região São Paulo).
  Buckets: `materiais` (privado: PDFs, recortes de questões) e `vitrine` (público: imagens das notícias).
- Variáveis na Vercel (públicas, tipo Config): `NEXT_PUBLIC_SUPABASE_URL` (só `https://CODIGO.supabase.co`, sem `/rest/v1`), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave **publishable** `sb_publishable_…`), `NEXT_PUBLIC_SITE_URL`. Opcionais: `NEXT_PUBLIC_WHATSAPP_URL`, `NEXT_PUBLIC_COMUNIDADE_URL`, `EMAIL_REMETENTE`.
  Secretas (ainda não cadastradas): `SUPABASE_SERVICE_ROLE_KEY`, `KIWIFY_TOKEN`, `RESEND_API_KEY`.
- `src/lib/supabase/env.ts` limpa as variáveis (espaços, barra final, `/rest/v1`). `/api/saude` mostra `{"banco":"ok"}` ou o erro.
- Supabase com **Data API**: depois de criar tabelas por SQL, rodar `notify pgrst, 'reload schema';`.

## Banco de dados (`supabase/migrations/`)

- `0001_concursos.sql` + `0002_simulados_edital.sql`: **já rodados** no projeto (como um arquivo só).
- `0003_noticias.sql`: tabela `noticias` e bucket `vitrine` (já rodada).
- `0004_loja.sql`: produtos com tipo/preço/descrição/benefícios/edital/destaque; simulados com `gratuito`, `ordem`, `titulo`, `aula_id` (minissimulado da aula); funções `tem_produto`, `pode_abrir_simulado`, `catalogo_aulas` (rodada pelo Hugo em `banco-de-dados-atualizacao.sql` = 0003 + 0004).
- `0005_imagem_produtos.sql`: coluna `produtos.imagem_path` (imagem quadrada do curso, no bucket público `vitrine`, pasta `produtos/`). Rodar **antes** de subir o código que a usa.
- `supabase/produtos-loja.sql`: cria os 8 produtos (Reta Final PM PE em destaque, ligada ao edital, e os 7 Extensivos Carreiras Policiais: PRF, PF, Polícia Civil, Polícia Militar, Polícia Penal, PRF Administrativo, Guardas Municipais). Preço e link da Kiwify em branco: o Hugo completa no painel.
- Migrações novas: numeradas e **idempotentes** (`if not exists`, `create or replace`, `drop policy if exists`). O Hugo cola no SQL Editor (`https://supabase.com/dashboard/project/kuffwzclcggsmwyrtsrx/sql/new`) e clica em Run → "Run without RLS" (o próprio arquivo liga o RLS). Teste antes num Postgres local com stubs de `auth.uid()`, `auth.users` e `storage.objects`.
- Peças principais: `editais` + `edital_disciplinas` (disciplinas, questões por disciplina, bloco, regra de corte), `disciplinas`/`assuntos` (catálogo), `questoes` (múltipla A–E ou A–D, e certo/errado) + `questoes_gabarito` + `textos_base`, `tentativas_questoes`, `listas_questoes`, `provas` (simulados do edital, corrigidos com a regra de corte), `produtos`/`matriculas`/`produto_editais`, `noticias`.

## O que o site já tem

- **Vitrine** (`src/app/page.tsx`): cabeçalho no estilo AlfaCon (`src/components/Cabecalho.tsx`: faixa de aviso do edital aberto, barra navy com menu e conta, barra clara com atalhos), **carrossel** (`CarrosselVitrine.tsx`: capa "Eu tenho um plano para você chutar a CLT." + notícias cadastradas no painel), passos, editais, planos, expert.
- **Landing** `/como-funciona`: promessa, dor, números (120 min, 365 dias, 730 h), o dia em 3 blocos (50 + 50 + 20), 3 fases, calculadora de datas, treino, minissimulado de 3 questões, promessa honesta, expert.
- **Entrar**: "Entre" e "Cadastre-se" lado a lado.
- **Aluno**: plano de hoje (`src/lib/plano.ts`: 3 blocos, rodízio de disciplinas pelo peso no edital, domingo = simulado, reta final nas 3 últimas semanas), banco de questões com filtros e contagem ao vivo, listas sob medida, simulados do edital com regra de corte, aulas por disciplina.
- **Professor**: editais, notícias da vitrine, aulas, banco de questões (cadastro, revisão, importação de pacote `questoes.json`), alunos, dúvidas, vendas.
- Visual: navy `#071A3D`, azul `#0B5CFF`, branco; **bordas quadradas** (raio 3–4 px). Expert: **Will Miranda** (`src/lib/marca.ts`).

## Loja (o aluno vê tudo; abre o que comprou)

- Produtos (painel **Produtos e loja**): `curso` (curso em PDF de um edital: libera aulas, minissimulados e simulados do edital), `simulados` (pacote), `mentoria`, `banco`. `destaque` = quadrado vermelho da Reta Final na vitrine e no início do aluno.
- **Cartão de produto** (`src/components/CartaoProduto.tsx`): imagem quadrada + título embaixo; ao passar o mouse a descrição desce por cima do que vem abaixo (no celular fica sempre visível). Sem imagem, mostra um quadrado com o nome da carreira. Preço e botão de compra ficam só na página `/curso/[slug]`. A imagem é enviada em Painel → Produtos e loja → "Imagem do curso" (envio direto do navegador para o bucket `vitrine`).
- Loja aberta a todos: `/loja` (item LOJA no menu de cima e na barra de atalhos), seção "Escolha o seu curso" na vitrine e página de cada produto em `/curso/[slug]` (o cartão inteiro é clicável; sem link da Kiwify mostra "Em breve").
- Menu do aluno: Início, Cursos em PDF, Simulados (quadrados 1, 2, 3… com cadeado; gratuito abre), Minissimulados (um por aula, só para quem tem o curso), Questões, Listas impressas (imprimir em PDF liberado para todos), Mentoria individual.
- Aula = 3 arquivos: PDF da teoria com questões, minissimulado (PDF das questões + cartão-resposta) e gabarito comentado (libera depois do envio).
- Plano do dia: dias da semana clicáveis (`/aluno?dia=AAAA-MM-DD`) e resumo com peso no edital, o que mais cai na banca (contado no banco) e erros do aluno.

## Decisões do produto

- Foco atual: **PM PE 2026 · Soldado** (Instituto AOCP, prova 21/02/2027) e Guarda Municipal (cidade a definir). Bancas do momento: **AOCP e IDIB**, múltipla escolha A–E. Certo/errado (Cebraspe) existe, mas não é o destaque.
- Plano grátis: 10 questões/dia, listas de até 10, 1 minissimulado/dia. Banco completo e curso liberam tudo.

## Banco de questões

- 984 questões de Língua Portuguesa (AOCP, 121 provas) já importadas no site; publicar pelo painel (Selecionar todas → Publicar selecionadas). Sem resolução comentada ainda.
- Produção de novos pacotes: `banco/INSTRUCOES-ASSISTENTE-QUESTOES.md` e `banco/ferramentas/` (`extrair_caderno.py` → `empacotar.py`). Pacotes vão em `banco/pacotes/AAAA-MM-DD-descricao/`; a importação no site é pelo painel (Banco de questões → Importar pacote).

## Combinados com o Hugo

- **Acumular as alterações** e entregar um pacote só quando ele pedir ("pode mandar").
- Expert/professor que aparece no site: **Prof. Will Miranda** (`MARCA.professor`).
- Bordas quadradas, vermelho `#E11D2E` para destaques de venda.
- Barra lateral do painel fica recolhida (só ícones) e abre com o mouse; o conteúdo acompanha.

## Pendências

- Dados da empresa (razão social, CNPJ, e-mail) em `src/lib/marca.ts` → rodapé, Termos e Privacidade (textos em `conteudo-legal/`, ainda do projeto antigo: reescrever para o Método 120 e passar por advogado antes de vender).
- Preço, link e ID da Kiwify de cada produto (Painel → Produtos e loja).
- Cadastrar simulados (Simulado 1 gratuito), aulas em PDF e minissimulado de cada aula.
- Resolução comentada das 984 questões de Português, por partes.
- Extensivo: plano anual por ciclos de incidência e trilhas por carreira (ver decisões do Hugo; hoje o plano diário é por edital).
- Links de Instagram e YouTube (`REDES` em `src/lib/marca.ts`); foto de corpo do Will (`EXPERT.fotoCorpo`).
- Kiwify (produtos e webhook `https://metodo-120.vercel.app/api/kiwify`), Resend (e-mails), domínio próprio, planos Pro do Supabase e da Vercel antes de vender.
- Fases do plano por **assunto** (hoje o rodízio é por disciplina): depende do banco de questões classificado por assunto.
- Futuro: IA de mentoria (Hugo citou DeepSeek; atenção à LGPD: transferência internacional, não enviar dados pessoais).
- Arquivos antigos sem uso que podem ser apagados: `src/components/Carrossel.tsx` e `.module.css`, telas de "habilidades" do ENEM.

## Antes de publicar

`npx tsc --noEmit` e `npx next build` sem erro; SQL testado; prints de prévia quando for visual.
