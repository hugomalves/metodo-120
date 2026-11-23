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
- **Cartão de produto** (`src/components/CartaoProduto.tsx`): imagem quadrada + título embaixo; ao passar o mouse desce a descrição e a lista "O que está incluído" (o mesmo texto da página do curso), por cima do que vem abaixo (no celular fica sempre visível). Sem imagem, mostra um quadrado com o nome da carreira. Preço e botão de compra ficam só na página `/curso/[slug]`. A imagem é enviada em Painel → Produtos e loja → "Imagem do curso" (envio direto do navegador para o bucket `vitrine`).
- **Página do curso** (`/curso/[slug]`): seção "O que você recebe" (`src/components/ColunasCurso.tsx`) com 3 colunas lado a lado (PDF detalhado, banco de questões focado na banca, material impresso ilimitado), cada uma com um vídeo curto repetindo sem som. Os 3 vídeos são **iguais para todos os cursos**: ficam no bucket `vitrine` (pasta `videos/`) e o caminho em `configuracoes` (`video_curso_pdf`, `video_curso_banco`, `video_curso_impressao`). Envio em Painel → Vídeos da página do curso (MP4/WebM, até 8 MB). Sem vídeo enviado, a seção não aparece. Não precisa de SQL.
- **Página do curso, versão completa** (`/curso/[slug]`): para curso ligado a um edital (ex.: Reta Final) mostra, além do básico, a contagem de dias até a prova, a prova em números (disciplinas por bloco e regra de corte, lidas do edital), faixa de compra, expert com aprovações, perguntas frequentes e barra de compra fixa no celular. Fotos de abertura e de faixa vêm do mapa `IMAGENS` no próprio arquivo, por **slug do edital** (arquivos em `public/img/reta-final/`; só o curso ligado ao edital, a Reta Final, tem). **Fotos enviadas pelo Hugo (formatura e tropa da PMPE): confirmar o direito de uso; para tirar, apague a entrada em `IMAGENS`.** Não usar brasão nem cartaz da PMPE. O aviso de que o Método 120 não tem vínculo com o órgão nem com a banca fica no fim da página.
- **Reta Final ≠ Extensivo.** Reta Final PM PE é um produto próprio (preparação intensa até a prova de 21/02/2027, ligada ao edital). O Extensivo Carreiras Policiais é o plano de 2 horas por dia, por 1 ano, sem edital. Não copiar textos de um para o outro (os blocos de 50 + 50 + 20 min e "2 horas por dia" são do Extensivo). A Reta Final é **estudo intenso até a prova**; chamada da página: "Gabarite a prova da PMPE aqui.". Horas por dia e estrutura exata ainda a definir com o Hugo (por isso os textos não citam horas).
- O endereço de cada curso (`/curso/slug`) é criado só na criação do produto; salvar no painel não o altera. `supabase/consertar-enderecos.sql` devolve os endereços originais, se algum tiver mudado antes dessa correção, e também reescreve a descrição e a lista "O que está incluído" da Reta Final.
- **Quais cartões aparecem:** só os produtos com "À venda" marcado (Painel → Produtos e loja). Hoje: Reta Final PM PE e Extensivo PRF; os outros 6 Extensivos estão escondidos (`supabase/mostrar-so-pmpe-e-prf.sql`). O Hugo cadastra os novos produtos à mão em "Novo produto" conforme termina cada curso em PDF, pacote de simulados etc.
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

## Limite de 1000 linhas do Supabase
O Supabase entrega no máximo 1000 linhas por chamada (mesmo com `.limit(5000)`). Qualquer lista que possa passar disso (questões, contagem do banco, tentativas) deve usar `todasAsLinhas` de `src/lib/paginar.ts` com ordem fixa. `contagem_banco()` tem ORDER BY (migração 0006).

## PDF do produto com marca d'água
- O professor envia o PDF em Produtos e loja → campo "PDF do curso" (pasta privada `produtos-pdf`; alunos NÃO têm permissão nela). Tabela `produto_pdfs` liga produto → arquivo.
- O aluno que comprou abre `/aluno/material/[produtoId]` → botão leva a `/api/material/[produtoId]`, que confere `pode_baixar_pdf`, lê `dados_comprador` (nome, CPF, telefone), baixa o original com a chave de serviço e devolve o PDF com marca d'água (`src/lib/marcaDagua.ts`, biblioteca `pdf-lib`).
- `dados_comprador` (chave: e-mail) é preenchida pelo webhook da Kiwify (Customer.full_name, CPF, mobile); se faltar, o aluno informa uma vez (não consegue trocar depois). Migração 0007. Política de privacidade atualizada.
- Limite da Vercel: resposta de função ~4,5 MB pode ser barrada; a entrega é em pedaços (streaming), mas teste com o PDF real.

## Topo do site, planos e tema escuro do aluno (nov/2026)
- Topo das páginas abertas (`src/components/Cabecalho.tsx`): abas Loja · Editais · Planos · Oferta + Login e Garantir vaga. "Oferta" e "Garantir vaga" levam ao curso em destaque à venda (`/curso/[slug]`), ou à loja.
- `/planos`: planos de assinatura definidos em `src/lib/planos.ts` (Básico, Até a prova, Todos os cursos). O botão usa o produto com endereço `plano-basico`, `plano-ate-a-prova-<concurso>` (um por concurso) e `plano-todos-os-cursos`; sem produto, aparece "Em breve". Produtos `plano-*` não aparecem como cursos soltos na loja. Plano é produto do tipo curso: sem edital libera todos os cursos; com edital, só aquele (e "acesso até" = data da prova). `_plano_cobre()` também libera os PDFs com marca d'água (migração 0008).
- Área do aluno com tema escuro: `Painel tema="app"` (classe `.tema-app` em globals.css troca as variáveis). Cronômetro de estudo no topo (`src/components/Cronometro.tsx`, guardado no localStorage); "Registrar" abre `/aluno/cronograma?registrar=<min>`.

## Cronograma (`/aluno/cronograma`, migração 0008)
- Abas: Cronograma (blocos de hoje, revisões, agenda da semana), Revisões, Histórico, Calendário, Edital (verticalizado, com teoria e 1ª–6ª revisões marcáveis e aproveitamento meu/outros por assunto).
- Conteúdo = (disciplina, chave): chave = id do assunto (folha da árvore `assuntos`) ou 'geral' se a disciplina não tem assuntos. Lógica em `src/lib/cronograma.ts` (estrutura, ciclo ponderado pelas questões da prova, distribuição por dia).
- Tabelas: cronogramas, cronograma_itens, conteudos_progresso, estudos, revisoes (RLS: dono; professor lê). RPCs: ajustar_minutos_dia, aproveitamento_edital.
- Ao registrar estudo com "Gerar revisões", as revisões pendentes do mesmo conteúdo são substituídas pelas novas. Concluir revisão marca a caixa da revisão no edital.
- Testes visuais: crie uma rota temporária com dados de mentira (os componentes de `Vistas.tsx` recebem tudo por props) e tire prints com Playwright; apague a rota antes de entregar.
- Planos (migração 0009): todos valem 1 ano por compra (`produtos.dias_acesso` = 365 → `matriculas.valida_ate` preenchido na compra; todas as funções de acesso respeitam). Básico = produto tipo Banco com `libera_produto_id` = o extensivo escolhido (um produto por extensivo, `plano-basico-…`); Até a prova = tipo Curso com o edital (`plano-ate-a-prova-…`); Todos = tipo Curso sem edital. Desconto de 60% do Básico para o Até a prova é feito com cupom na Kiwify.
- Páginas abertas (início, loja, como funciona, curso, entrar, planos, termos, nova senha) usam o mesmo tema escuro: classe `tema-site` no invólucro da página (mesma paleta de `.tema-app`, com `--navy` claro para os títulos). Fundos que usavam navy têm ajuste com `:global(.tema-site)` em cada CSS module.

## Linguagem visual do site (referência: Projeto Caveira)
Títulos em Chakra Petch maiúsculos, rótulos "//" em IBM Plex Mono, cantos cortados (clip-path), fundo preto com pontinhos, botão claro `.btn-claro` com seta, vermelho `--vermelho-vivo` como cor de ação. Tokens no fim de `globals.css`; a home usa `src/app/home.module.css` (seções em tela cheia). Planos e Como funciona seguem o mesmo estilo.

## Produto gratuito por enquanto (migração 0010)
- `produtos.gratuito`: caixa "Gratuito por enquanto" em Painel → Produtos e loja. Ligada, todos os alunos (atuais e novos, via trigger em `perfis`) ganham matrícula do produto (`origem 'manual'`, `checkout_ref = 'gratuito:<id>'`), o que libera aulas, PDF com marca d'água, minissimulados, simulados do edital e o banco completo (`tem_banco_completo()` vale para qualquer matrícula ativa). Desligada, só as matrículas gratuitas são canceladas; quem comprou continua.
- Páginas mostram "Grátis" (cartão, página do curso, bloco do edital na home). Reta Final PM PE começa gratuita pela própria migração.
- Simulados e minissimulados da PMPE: Painel → Simulados (edital = PM PE; minissimulado = ligado a uma aula). O aluno precisa informar nome, CPF e telefone uma vez para baixar PDF com marca d'água.

## Filtros do banco, listas em PDF e compra logada (nov/2026, migração 0011)
- Filtros em construção (`FiltrosBanco`, `CamposFiltro`, `lib/filtros.ts`): banca, ano, disciplina, assunto, tipo e dificuldade aceitam VÁRIOS valores (na URL separados por `|`); edital é um só. Nada vale até clicar em "Filtrar". Banca aparece sempre, ordenada por quantidade de questões no banco (`bancasPorQuantidade`). Escolher um edital já marca a banca dele (`bancaDoEdital`, compara por nome sem acento); o aluno pode trocar a banca depois. Etiquetas com × mostram o que está escolhido. A migração 0011 refaz `gerar_lista` para aceitar vários valores (`p_ano` virou texto) e sobe o limite diário de listas do banco completo para 200.
- "Listas impressas" virou "Criar listas em PDF" (menu, página, cartões).
- Banco irrestrito para quem tem qualquer matrícula ativa: `tem_banco_completo()` não olha banca nem edital.
- Compra já logado: o botão do curso leva a `/comprar/[slug]` (explica o pagamento e abre a Kiwify com `?email=` e `?name=` da conta; o acesso é liberado pelo e-mail da compra). Cabeçalho mostra "Minha área" quando logado. Não há parâmetro garantido da Kiwify para preencher o e-mail: testar uma compra.
- Trocar de edital: `SeletorEdital` (início e cronograma) troca ao escolher na lista.
- Auditoria: nenhum link interno quebrado e nenhum botão solto encontrados (script: href contra as rotas de `src/app`).

## Notícias de concurso (aba "Notícias")
- Migração `0012_noticias_concursos.sql`: tabela `noticias_concursos` (carreira, título, fonte, url único, oculta, origem busca/manual) e coluna `carreira` em `produtos` e `editais` (federais | civis | militares | guardas).
- `src/lib/noticiasConcursos.ts`: `CARREIRAS` e `atualizarNoticias()` (Google Notícias RSS; cada manchete vai para a carreira que o título cita; guarda 25 por carreira; apaga as da busca com mais de 45 dias).
- Busca automática: `vercel.json` (cron a cada 2 dias) → `/api/cron/noticias`, exige `CRON_SECRET` na Vercel. Manual: painel "Notícias de concurso" → "Buscar notícias agora".
- Páginas: `/noticias` (4 quadrados com manchetes girando) e `/noticias/[carreira]` (notícias + cursos da carreira: do edital aberto e extensivos). Para um curso aparecer ali, escolha a "Carreira" no cadastro do produto (e do edital).

## Cadastro com dados (leads) e materiais grátis
- Cadastro pede nome completo, CPF e telefone; vão em `user_metadata` e o gatilho `criar_perfil()` (migração 0013) grava em `dados_comprador` (origem 'aluno'; nunca derruba o cadastro). Quem já tinha conta informa em `/aluno/seus-dados`.
- `/materiais` (aba "Materiais grátis"): lista `materiais_gratuitos`; `/api/gratis/[id]` exige login, aplica a marca d'água (nome, CPF, telefone) e registra em `materiais_gratuitos_baixas`. PDFs ficam no bucket privado `produtos-pdf`.
- Painel: `/professor/materiais-gratuitos` (publicar PDFs, ver downloads, lista de leads e CSV).
- `/entrar?voltar=/caminho` leva a pessoa de volta depois de entrar/cadastrar.

## Notícias com imagem, resumo e "Saiba mais"
- Migração `0014`: `noticias_concursos.texto/imagem_path` e tabela `noticias_imagens` (palavras do título → imagem, ou imagem padrão do quadrado). Imagem no bucket público `vitrine`.
- `imagemDaNoticia()` em `src/lib/noticiasConcursos.ts`: imagem própria > assunto (palavra mais longa no título) > padrão do quadrado.
- Resumo por IA: `resumirPendentes()` (modelo `claude-haiku-5-5`, só usa o que o título diz) roda junto da busca se existir `ANTHROPIC_API_KEY`; sem a chave, o professor escreve o texto no painel.
- NÃO copiamos o texto das matérias (direito autoral): a página `/noticias/n/[id]` tem texto nosso, a fonte em letra pequena e o link "Ler a matéria original"; ao lado, as ofertas (`Ofertas.tsx`).

## Banco de questões em abas, cadernos e pastas (migração 0015)
- Abas (`AbasBanco`): Home · Filtrar questões · Meus cadernos · Cadernos de erros · Imprimir lista em PDF. Rotas: `/aluno/questoes` (Home = "Meus Estudos": avisos, cadernos recentes, desempenho), `/filtrar`, `/cadernos`, `/erros`, `/listas`, e `/resolver` (a tela de resolver, a antiga página de questões). Links antigos com filtros em `/aluno/questoes?...` são redirecionados para `/resolver`.
- Filtro em árvore (`filtrar/FiltrarQuestoes.tsx`): abas Matéria e assunto, Edital, Banca, Órgão e cargo, Ano, Opções; contagem ao vivo (`contagemBanco`). Matéria e assunto usa a tabela `assuntos` (pai_id) e fica no filtro `m` (marcas "Disciplina" ou "Disciplina>Assunto", ver `lib/arvoreAssuntos.ts`); marcar um assunto inclui os de dentro; a regra é OU entre as marcas e E com os demais filtros. Seta azul = "Todo o conteúdo de…", seta verde = item.
- Caderno = `listas_questoes` (mesma tabela das listas em PDF), agora com `pasta_id`. Pastas: `pastas_cadernos` (pai_id → pastas dentro de pastas, até 6 níveis, 100 por aluno). Criar caderno exige pasta (escolhida ou nova na hora): RPC `criar_caderno` (as questões vêm já escolhidas pelo servidor via `buscarQuestoes`; limite 500 no banco completo, `lista_max` no grátis; 30/dia completo, 3/dia grátis). `renomear_caderno` e `mover_caderno` também são RPC. Apagar pasta apaga as subpastas; os cadernos voltam para "sem pasta".
- Cadernos de erros: questões cuja ÚLTIMA tentativa foi errada, por disciplina; "Criar caderno" cai na pasta "Cadernos de erros".
- Avisos: tabela `avisos_banco`, painel do professor em `/professor/avisos`; aparecem no quadro azul da Home.

## Cadernos do curso (Reta Final PM PE, migração 0016)
- Os pacotes de produção (`PORTAOCP`, `DHLEXTAOCP`, `DCAOCP`, `INFORMATICAAOCP`, `RLMAOCP`, `HISTPERN`: PDFs `out2/…-completa.pdf` e `…-BlocoNdeM.pdf`, `catalogo.json`, `listas*.json`) definem 72 aulas (blocos de 15 min) e as listas de questões (códigos do banco, ex. `AOCP-PMPR-2025-CAD-4F72E7`). Cada aula e cada bloco vira um caderno em `cadernos_modelo` (código `PT-AULA01` ou `PT-AULA01-B2`), que guarda só os CÓDIGOS das questões: se uma questão entrar no banco depois, o caderno passa a incluí-la na próxima cópia.
- Link/QR dos PDFs: `/lista/PT-AULA01-B2` (rota `src/app/lista/[codigo]`): pede login (`/entrar?voltar=`), chama `abrir_caderno_modelo` (cria UMA cópia por aluno em `listas_questoes.modelo_codigo`, na pasta "Reta Final PM PE › disciplina") e abre `/aluno/questoes/lista/<id>`. Acesso: matrícula ativa no produto `cadernos_modelo.produto_slug` (padrão `reta-final-pmpe`, inclui o "gratuito por enquanto"), professor, ou `gratis = true`.
- "Meus cadernos" mostra os cadernos do curso por disciplina, com progresso. Conferência de questões que faltam: a consulta no final do SQL de dados (no SQL Editor `auth.uid()` é nulo, então a função `conferir_cadernos_modelo()` só serve logado como professor).
- Conferência feita contra os PDFs: o link impresso em cada PDF (`lista/CÓDIGO`) e o "Lista deste bloco: N questões" precisam bater com `cadernos_modelo`. Se um PDF de bloco não tem lista própria, ele aponta para o caderno da aula (ex.: HP e parte de DH/RL). Os 313 códigos impressos nos PDFs = os 313 cadernos. Novos blocos/aulas: gerar o SQL de novo (o insert é "upsert"). Redação (RD) ainda não tem PDF nem caderno.

## Plano da Reta Final no cronograma (migração 0017)
- `plano_curso_itens`: a sequência do curso (298 blocos de aula de 15 min, 18 revisões de 30 min, 4 propostas de redação em 3 blocos, 5 simulados de 4h30 e 6 minissimulados de 2h), gerada a partir do `catalogo.json` + nomes dos PDFs (SQL "12-plano-reta-final-dados"). Gatilhos: Simulado 1 antes de tudo; Sim 2 a 30% dos blocos; Sim 3 e 4 ao fim dos ciclos 1 e 2; Sim 5 no fim; revisão logo após a última aula do ciclo na disciplina; propostas a 20/40/60/80% (depois da RD Aula 02); minissimulados no final.
- Ritmo do aluno em `planos_aluno` (começa no dia que ele escolhe, padrão hoje; 2h/dia padrão, até 10h; dias da semana). `plano_feitos` guarda o dia em que cada item foi concluído. `lib/planoCurso.ts > montarPlano` distribui o que falta de hoje em diante (simulado e minissimulado ocupam o dia inteiro): atraso ou adiantamento se ajustam sozinhos. Com 2h todos os dias = 56 dias (8 semanas).
- Página do aluno: `/aluno/cronograma/reta-final` (quem tem o curso e não tem cronograma próprio é levado para lá; senão aparece a aba "Plano Reta Final"). Acesso: `tem_curso('reta-final-pmpe')`.
- PDFs: bucket privado `produtos-pdf`, caminho `curso/reta-final-pmpe/<CÓDIGO>.pdf`, registrados em `pdfs_curso`. Envio pelo professor em `/professor/pdfs-curso` (aceita os .zip direto, abre no navegador com `fflate`; código pelo nome do arquivo: `PT-Aula01-Bloco1de4.pdf` → `PT-AULA01-B1`, `…-completa.pdf` → `PT-AULA01`, `RD-Proposta1-Bloco1de3.pdf` → `RD-PROP1-B1`). Entrega com marca d'água em `/api/curso-pdf/<CÓDIGO>` (pede os dados de `dados_comprador`).
