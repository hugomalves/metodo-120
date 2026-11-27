// =====================================================================
// Redação do Zero · PM PE (AOCP) — 8 aulas, uma por semana
// Para quem tem muita dificuldade e tem cerca de 2 meses até a prova.
// Segue o mesmo modelo das aulas RD do Reta Final (4 parágrafos, tese, tópico frasal,
// fundamentação, fechamento e proposta com quem / o quê / para quê).
// Este arquivo alimenta o site (/aluno/redacao/aulas) e os PDFs (RZ-AULA01 a RZ-AULA08).
// Marcação no texto: **negrito**. Quebra de linha: \n.
// =====================================================================

export type Bloco =
  | { t: 'h'; texto: string }
  | { t: 'p'; texto: string }
  | { t: 'lista'; itens: string[]; numerada?: boolean }
  | { t: 'tabela'; cab: string[]; linhas: string[][] }
  | { t: 'modelo'; titulo: string; texto: string }
  | { t: 'compara'; ruim: string; bom: string; porque: string }
  | { t: 'dica'; texto: string }
  | { t: 'alerta'; texto: string }
  | { t: 'exercicio'; enunciado: string; itens?: string[]; resposta: string; linhas?: number };

export type AulaRedacao = {
  n: number;
  titulo: string;
  chamada: string;                 // uma frase para o cartão
  minutos: number;
  objetivo: string;
  aprender: string[];
  blocos: Bloco[];
  lembrar: string[];               // a "cola" do fim da aula
  tarefa: { texto: string; proposta: string };
};

export const codigoPdfAula = (n: number) => `RZ-AULA${String(n).padStart(2, '0')}`;

export const AULAS_REDACAO: AulaRedacao[] = [
  // ------------------------------------------------------------------ 1
  {
    n: 1,
    titulo: 'A prova de redação e como não zerar',
    chamada: 'O que a banca pede, como ela dá a nota e os erros que eliminam.',
    minutos: 40,
    objetivo: 'Entender exatamente o que a AOCP pede e sair desta aula sabendo evitar todos os motivos de nota zero.',
    aprender: ['o que é um texto dissertativo-argumentativo', 'como a nota de 0 a 40 é dada', 'os motivos que zeram a redação', 'quantas palavras cabem na sua linha'],
    blocos: [
      { t: 'p', texto: 'Se redação é o seu ponto fraco, comece por aqui. A boa notícia: a redação da PM PE é **curta** (15 a 20 linhas) e tem **regras claras**. Quem aprende as regras e treina toda semana sai do zero para uma nota segura em 2 meses.' },
      { t: 'h', texto: 'O que a prova pede' },
      { t: 'tabela', cab: ['Item', 'Como é'], linhas: [
        ['Tipo de texto', '**Dissertativo-argumentativo**: você defende uma opinião com argumentos'],
        ['Tamanho', '**De 15 a 20 linhas**, escritas à mão na folha definitiva'],
        ['Nota', '**De 0 a 40 pontos**, em 4 critérios de 10'],
        ['Mínimo para não ser eliminado', '**12 pontos**'],
        ['O que é corrigido', 'Só a folha definitiva. O rascunho nunca vale nota'],
        ['Caneta', 'Esferográfica de tinta **azul ou preta**, de corpo transparente'],
      ] },
      { t: 'dica', texto: '**Mínimo de 12 em 40** quer dizer só 3 pontos por critério. Você não precisa de um texto perfeito para continuar no concurso: precisa de um texto **dentro das regras**. É isso que vamos garantir primeiro.' },
      { t: 'h', texto: 'Dissertar e argumentar: o que é isso?' },
      { t: 'p', texto: '**Dissertar** é discutir um assunto. **Argumentar** é defender uma opinião dando motivos. Na prova, você escreve como quem explica para um leitor por que pensa daquele jeito, com calma e com razões.' },
      { t: 'compara', ruim: 'Ontem eu estava voltando do trabalho e vi um acidente de moto na avenida. O motoqueiro estava correndo muito...', bom: 'O aumento das mortes no trânsito brasileiro está ligado, sobretudo, à imprudência dos condutores e à fiscalização insuficiente.', porque: 'O primeiro trecho **conta uma história** (é narração). O segundo **defende uma ideia** com dois motivos. Só o segundo é dissertativo-argumentativo.' },
      { t: 'h', texto: 'Como a banca dá a nota' },
      { t: 'tabela', cab: ['Critério', 'Em palavras simples', 'Pontos'], linhas: [
        ['1. Tema e argumentação', 'Falou do tema pedido? Defendeu uma ideia com bons motivos e informações?', '10'],
        ['2. Coesão e coerência', 'As frases e os parágrafos estão bem ligados? As ideias combinam entre si?', '10'],
        ['3. Estrutura', 'Tem introdução, desenvolvimento e conclusão, em parágrafos?', '10'],
        ['4. Gramática', 'Vírgula, acento, concordância, crase, letra legível', '10'],
      ] },
      { t: 'h', texto: 'Os motivos que dão nota ZERO' },
      { t: 'p', texto: 'Estes erros fazem a redação inteira valer zero, mesmo que o resto esteja bom. Decore esta lista.' },
      { t: 'tabela', cab: ['Motivo', 'Como evitar'], linhas: [
        ['Fugir do tema', 'Escreva sobre o tema **exato** da proposta (aula 2)'],
        ['Fazer outro tipo de texto', 'Nada de história, carta ou poema: defenda uma ideia'],
        ['Texto todo desorganizado', 'Use sempre os 4 parágrafos (aulas 3 a 5)'],
        ['Identificar-se', 'Nunca escreva seu nome, assinatura, apelido ou desenho na folha'],
        ['Lápis ou tinta de outra cor', 'Só caneta azul ou preta. Leve duas'],
        ['Folha em branco, ilegível ou fora do lugar', 'Passe a limpo na folha certa, com letra que outra pessoa consiga ler'],
        ['Atentado ao pudor', 'Nada de palavrão ou ofensa'],
      ] },
      { t: 'alerta', texto: '**Pegadinha:** escrever no fim "Fulano de Tal" ou "Obrigado" é identificação. Também não coloque título: o edital não pede, e ele só gasta linha.' },
      { t: 'h', texto: 'Quantas palavras cabem na SUA linha' },
      { t: 'p', texto: 'Na folha de prova, uma linha costuma ter de 10 a 12 palavras. Mas depende da sua letra. Por isso, meça hoje:' },
      { t: 'lista', numerada: true, itens: [
        'Pegue uma folha pautada e a caneta que você vai usar na prova.',
        'Copie à mão, com sua letra normal, as 5 primeiras linhas de qualquer texto.',
        'Conte as palavras e divida por 5. Esse é o seu número de palavras por linha.',
        'Multiplique por 15 e por 20: esse é o tamanho certo do seu texto.',
      ] },
      { t: 'exercicio', enunciado: 'Marque C (certo) ou E (errado).', itens: [
        'Uma redação com 14 linhas está dentro do tamanho pedido.',
        'Se eu terminar o texto com "Atenciosamente, João", não tem problema, porque é só uma despedida.',
        'O rascunho é corrigido se a folha definitiva ficar incompleta.',
        'Com 12 pontos, o candidato não é eliminado pela redação.',
      ], resposta: '1. **E**: o mínimo é 15 linhas.\n2. **E**: escrever o nome é identificação e zera a redação.\n3. **E**: só a folha definitiva vale.\n4. **C**: 12 é a nota mínima.' },
      { t: 'exercicio', enunciado: 'Qual dos começos abaixo é de um texto dissertativo-argumentativo? Por quê?', itens: [
        'a) "Era uma vez uma cidade onde ninguém respeitava o sinal vermelho."',
        'b) "Querido prefeito, venho por meio desta pedir mais radares."',
        'c) "O respeito às leis de trânsito é essencial para preservar vidas no Brasil."',
      ], resposta: '**Letra c.** Ela apresenta uma ideia para ser defendida. A letra a é narração (história) e a letra b é carta.' },
      { t: 'h', texto: 'Seu plano para as 8 semanas' },
      { t: 'tabela', cab: ['Semana', 'Aula', 'Redação da semana'], linhas: [
        ['1', 'A prova e como não zerar', 'Redação diagnóstica (sem medo de errar)'],
        ['2', 'Entender o tema sem fugir dele', 'Celular e aprendizagem'],
        ['3', 'A tese e a introdução', 'Envelhecimento da população'],
        ['4', 'O parágrafo de desenvolvimento', 'Apostas online'],
        ['5', 'A conclusão e os conectivos', 'Câmeras corporais'],
        ['6', 'Os erros de português que mais tiram ponto', 'Racismo'],
        ['7', 'O texto inteiro, passo a passo', 'Reescrever a redação da semana 1'],
        ['8', 'Revisão final e o dia da prova', 'Simulado com o tema da prova de 2024'],
      ] },
      { t: 'dica', texto: '**Rotina mínima:** 1 aula + 1 redação por semana + 15 minutos por dia lendo um texto de opinião ou refazendo um parágrafo corrigido. Pouco, mas todo dia.' },
    ],
    lembrar: ['15 a 20 linhas, de 0 a 40 pontos, mínimo 12', 'Defenda uma ideia: nada de história ou carta', 'Nunca escreva seu nome nem coloque título', 'Só caneta azul ou preta, só a folha definitiva vale', 'Saiba quantas palavras cabem na sua linha'],
    tarefa: { texto: 'Escreva a sua **redação diagnóstica**. Ainda não se preocupe com técnica: escreva o melhor que conseguir, em 15 a 20 linhas, e envie. Ela vai mostrar seu ponto de partida, e na semana 7 você vai reescrevê-la para ver a diferença.', proposta: 'transito' },
  },

  // ------------------------------------------------------------------ 2
  {
    n: 2,
    titulo: 'Entender o tema sem fugir dele',
    chamada: 'Ler a proposta, achar as palavras-chave e usar o texto motivador sem copiar.',
    minutos: 40,
    objetivo: 'Ler qualquer tema, descobrir exatamente o que ele pede e transformar o tema numa pergunta que a sua redação vai responder.',
    aprender: ['achar as palavras-chave do tema', 'a diferença entre fugir do tema e tangenciar', 'virar o tema uma pergunta', 'usar o texto motivador do jeito certo'],
    blocos: [
      { t: 'p', texto: 'Fugir do tema é o erro mais caro: zera a redação. E tangenciar, que é falar só "em volta" do tema, derruba muito a nota do critério 1. A solução é ler o tema como um detetive, palavra por palavra.' },
      { t: 'h', texto: 'Passo 1: sublinhe as palavras-chave' },
      { t: 'p', texto: 'Todo tema tem um **assunto geral** e um **recorte** (o pedaço do assunto que a banca quer). Sublinhe as palavras que você não pode esquecer.' },
      { t: 'modelo', titulo: 'Exemplo', texto: 'Tema: "Os efeitos do uso do **celular** por **estudantes** na **aprendizagem**"\n\nAssunto geral: celular\nRecorte: o que o celular causa no APRENDIZADO dos ESTUDANTES' },
      { t: 'tabela', cab: ['Se você escrever sobre…', 'Resultado'], linhas: [
        ['Golpes pelo WhatsApp', '**Fuga ao tema** (não fala de estudantes nem de aprendizagem): nota zero'],
        ['O celular na vida das pessoas em geral', '**Tangenciamento**: fala do assunto, mas não do recorte. Nota baixa no critério 1'],
        ['Como o celular atrapalha a atenção dos alunos e como pode ajudar quando é usado com orientação', '**Tema atendido**'],
      ] },
      { t: 'h', texto: 'Passo 2: vire o tema uma pergunta' },
      { t: 'p', texto: 'Transforme o tema numa pergunta. A sua **tese** (a sua opinião) será a resposta dessa pergunta. Isso prende você no tema do começo ao fim.' },
      { t: 'tabela', cab: ['Tema', 'Pergunta'], linhas: [
        ['Desafios para reduzir as mortes no trânsito brasileiro', 'O que dificulta a redução das mortes no trânsito?'],
        ['Os impactos das apostas online na vida financeira das famílias', 'Como as apostas online afetam o dinheiro das famílias?'],
        ['Caminhos para combater o racismo na sociedade brasileira', 'O que fazer para combater o racismo no Brasil?'],
      ] },
      { t: 'dica', texto: 'Palavras que mudam tudo: **"desafios"** pede os problemas que atrapalham. **"caminhos"** pede soluções. **"impactos"** ou **"efeitos"** pede consequências. Olhe sempre a primeira palavra do tema.' },
      { t: 'h', texto: 'Passo 3: use o texto motivador sem copiar' },
      { t: 'p', texto: 'O texto motivador serve para **dar ideias e informações**. Ele não é para ser copiado. Trechos copiados não mostram a sua argumentação e deixam o texto mais fraco.' },
      { t: 'compara', ruim: 'Segundo o texto, o país passou de 34.881 mortes em 2023 para 37.150 em 2024, um aumento de 6,5%.', bom: 'Dados do Ministério da Saúde mostram que as mortes no trânsito voltaram a crescer entre 2023 e 2024.', porque: 'O primeiro trecho repete o texto motivador quase igual e ainda diz "segundo o texto". O segundo usa a informação **com suas palavras** e cita a fonte de verdade.' },
      { t: 'alerta', texto: '**Pegadinha:** nunca escreva "como diz o texto 1" ou "segundo o texto motivador". Cite a fonte real (o órgão, a lei, a pesquisa) ou só use a ideia.' },
      { t: 'exercicio', enunciado: 'Tema: "O envelhecimento da população e os desafios para garantir os direitos da pessoa idosa". Classifique cada ideia como **atende**, **tangencia** ou **foge**.', itens: [
        'a) A falta de respeito dos jovens nas redes sociais.',
        'b) O aumento do número de idosos no Brasil e a falta de cuidadores e de atendimento de saúde para eles.',
        'c) A importância da família em geral.',
      ], resposta: 'a) **Foge**: não fala de idosos.\nb) **Atende**: fala do envelhecimento e de um direito (saúde) difícil de garantir.\nc) **Tangencia**: família pode entrar no texto, mas só se for ligada ao cuidado com o idoso.' },
      { t: 'exercicio', enunciado: 'Escreva a pergunta de cada tema.', itens: [
        'a) "O uso de câmeras corporais pelas polícias e a relação com a sociedade"',
        'b) "Os efeitos do uso do celular por estudantes na aprendizagem"',
      ], resposta: 'Respostas possíveis:\na) Como as câmeras corporais nos policiais afetam a relação entre a polícia e a população?\nb) Que efeitos o celular tem sobre o aprendizado dos alunos?', linhas: 4 },
    ],
    lembrar: ['Sublinhe as palavras-chave e ache o recorte', 'Vire o tema uma pergunta: a tese é a resposta', 'Desafios = problemas, caminhos = soluções, impactos = consequências', 'Use as ideias do texto motivador com suas palavras, sem copiar'],
    tarefa: { texto: 'Antes de escrever, sublinhe as palavras-chave do tema e escreva a pergunta no rascunho. Depois faça a redação e envie.', proposta: 'celular-escolas' },
  },

  // ------------------------------------------------------------------ 3
  {
    n: 3,
    titulo: 'A tese e a introdução',
    chamada: 'A sua opinião em uma linha e uma introdução pronta em 3 movimentos.',
    minutos: 45,
    objetivo: 'Escrever uma tese clara e uma introdução de 3 a 4 linhas para qualquer tema, usando uma fórmula que sempre funciona.',
    aprender: ['o que é tese e como escrever a sua', 'a introdução em 3 movimentos', 'frases de abertura que servem para muitos temas', 'os começos que você nunca deve usar'],
    blocos: [
      { t: 'h', texto: 'A tese: a sua opinião em uma linha' },
      { t: 'p', texto: 'A **tese** é a resposta para a pergunta do tema (aula 2). É uma **afirmação**, nunca uma pergunta. O texto inteiro existe para provar que a tese está certa.' },
      { t: 'modelo', titulo: 'Fórmula da tese', texto: '[o problema do tema] + [acontece/persiste] + por causa de [MOTIVO 1] e de [MOTIVO 2].' },
      { t: 'compara', ruim: 'O trânsito é um assunto muito importante nos dias de hoje.', bom: 'As mortes no trânsito continuam altas no Brasil, sobretudo por causa da imprudência dos condutores e da fiscalização insuficiente.', porque: 'A primeira frase não defende nada: qualquer pessoa concorda e ela serve para qualquer texto. A segunda tem uma **posição** e já anuncia os **dois motivos** que serão os dois parágrafos de desenvolvimento.' },
      { t: 'dica', texto: '**Macete:** se você não consegue escrever a tese em uma linha no rascunho, ainda não sabe o que vai defender. Não comece o texto antes disso.' },
      { t: 'h', texto: 'A introdução em 3 movimentos' },
      { t: 'p', texto: 'A introdução tem **3 a 4 linhas** e faz três coisas, nesta ordem:' },
      { t: 'tabela', cab: ['Movimento', 'O que faz', 'Exemplo (tema: envelhecimento)'], linhas: [
        ['1. Contexto', 'Apresenta o assunto com uma lei, um fato ou uma informação certa', '"A Constituição Federal determina que a família, a sociedade e o Estado devem amparar as pessoas idosas."'],
        ['2. Tese', 'Sua opinião, ligada à frase anterior por "Entretanto," ou "No entanto,"', '"Entretanto, com o envelhecimento da população, esse direito ainda não é garantido no Brasil,"'],
        ['3. Anúncio', 'Os dois motivos que você vai desenvolver', '"sobretudo devido à falta de estrutura na saúde pública e ao abandono familiar."'],
      ] },
      { t: 'modelo', titulo: 'Introdução pronta para completar', texto: '[Lei, artigo da Constituição ou fato sobre o tema]. Entretanto, [problema do tema] ainda [persiste / é um desafio] no Brasil, sobretudo devido a [motivo 1] e a [motivo 2].' },
      { t: 'h', texto: 'Frases de contexto que servem para muitos temas' },
      { t: 'p', texto: 'Guarde estas frases. Elas são verdadeiras e combinam com os temas que mais aparecem em provas de polícia.' },
      { t: 'tabela', cab: ['Use em temas sobre…', 'Frase de contexto'], linhas: [
        ['Segurança, violência, polícia', 'A Constituição Federal, em seu artigo 144, define a segurança pública como dever do Estado, direito e responsabilidade de todos.'],
        ['Direitos, desigualdade, preconceito', 'A Constituição Federal, em seu artigo 5º, garante que todos são iguais perante a lei, sem distinção de qualquer natureza.'],
        ['Saúde, educação, moradia, trabalho', 'O artigo 6º da Constituição Federal garante a todos os brasileiros direitos sociais como saúde, educação, trabalho e segurança.'],
        ['Escola, jovens, aprendizagem', 'A Constituição Federal estabelece que a educação é direito de todos e dever do Estado e da família.'],
        ['Crianças e adolescentes', 'O Estatuto da Criança e do Adolescente, de 1990, determina que crianças e adolescentes devem ter prioridade na proteção de seus direitos.'],
        ['Mulheres', 'A Lei Maria da Penha, de 2006, criou mecanismos para coibir a violência doméstica e familiar contra a mulher.'],
        ['Trânsito', 'O Código de Trânsito Brasileiro estabelece que o trânsito seguro é direito de todos.'],
      ] },
      { t: 'alerta', texto: '**Nunca comece com:** "Hoje em dia", "Nos dias atuais", "Desde os primórdios", "Atualmente muito se fala". Esses começos não dizem nada e gastam a sua linha mais importante. E não invente números: use só dados de que você tem certeza.' },
      { t: 'exercicio', enunciado: 'Qual é a melhor tese para o tema "Caminhos para combater o racismo na sociedade brasileira"?', itens: [
        'a) O racismo existe há muito tempo.',
        'b) Será que um dia o racismo vai acabar no Brasil?',
        'c) O combate ao racismo no Brasil depende da educação antirracista nas escolas e da aplicação rigorosa da lei.',
      ], resposta: '**Letra c.** É uma afirmação, responde ao tema ("caminhos" = soluções) e anuncia dois argumentos. A letra a é só uma constatação e a letra b é uma pergunta.' },
      { t: 'exercicio', enunciado: 'Escreva uma introdução de 3 a 4 linhas, com os 3 movimentos, para o tema "O envelhecimento da população e os desafios para garantir os direitos da pessoa idosa".', resposta: 'Modelo para comparar: A Constituição Federal determina que a família, a sociedade e o Estado devem amparar as pessoas idosas. Entretanto, com o rápido envelhecimento da população, esse direito ainda não é plenamente garantido no Brasil, sobretudo devido à falta de estrutura na saúde pública e ao abandono familiar.', linhas: 5 },
    ],
    lembrar: ['Tese = afirmação que responde ao tema e traz 2 motivos', 'Introdução de 3 a 4 linhas: contexto + tese + anúncio', 'Comece com lei, artigo ou fato certo', 'Nada de "Hoje em dia" e nada de número inventado'],
    tarefa: { texto: 'Faça a redação usando a fórmula da introdução. Confira: a sua tese tem os 2 motivos que você vai desenvolver?', proposta: 'envelhecimento' },
  },

  // ------------------------------------------------------------------ 4
  {
    n: 4,
    titulo: 'O parágrafo de desenvolvimento',
    chamada: 'Como escrever um argumento completo, com explicação e exemplo.',
    minutos: 45,
    objetivo: 'Escrever os dois parágrafos de desenvolvimento, cada um com tópico frasal, explicação, exemplo e fechamento.',
    aprender: ['as 4 partes de um parágrafo argumentativo', 'como explicar um argumento sem ficar "solto"', 'onde buscar exemplos (repertório)', 'pares de argumentos que servem para quase todo tema'],
    blocos: [
      { t: 'p', texto: 'O desenvolvimento é onde você **prova** a sua tese. São **2 parágrafos de 4 a 5 linhas**: o primeiro defende o motivo 1 e o segundo, o motivo 2. É a parte que mais pesa no critério 1.' },
      { t: 'h', texto: 'As 4 partes do parágrafo' },
      { t: 'tabela', cab: ['Parte', 'O que faz', 'Exemplo (motivo: imprudência no trânsito)'], linhas: [
        ['1. Tópico frasal', 'Apresenta o argumento em uma frase', '"Em primeiro lugar, a imprudência dos condutores é uma das principais causas das mortes no trânsito."'],
        ['2. Explicação', 'Diz por quê ou como isso acontece', '"Muitos motoristas excedem a velocidade e usam o celular ao volante, o que reduz o tempo de reação."'],
        ['3. Exemplo', 'Prova com uma lei, um dado, um fato ou uma comparação', '"Dados do Ministério da Saúde mostram que as mortes de motociclistas cresceram entre 2023 e 2024."'],
        ['4. Fechamento', 'Liga o argumento de volta à tese', '"Desse modo, a falta de cuidado individual transforma as ruas em espaços de risco."'],
      ] },
      { t: 'modelo', titulo: 'Parágrafo pronto para completar', texto: 'Em primeiro lugar, [motivo 1] contribui para [o problema do tema]. Isso acontece porque [explicação: por que ou como]. Um exemplo disso é [lei, dado, fato ou situação comum]. Desse modo, [frase que liga ao tema].\n\nAlém disso, [motivo 2] também agrava [o problema]. [Explicação]. [Exemplo]. Assim, [frase que liga ao tema].' },
      { t: 'compara', ruim: 'Além disso, a educação é muito importante. A educação muda o mundo. Por isso a educação é fundamental.', bom: 'Além disso, a falta de educação para o trânsito também agrava o problema. Isso acontece porque muitos jovens aprendem a dirigir sem entender os riscos da velocidade. Assim, a escola poderia formar condutores mais conscientes desde cedo.', porque: 'O primeiro parágrafo repete a mesma ideia três vezes e não explica nada: é o **argumento solto**. O segundo diz **por quê** e liga a ideia ao tema.' },
      { t: 'h', texto: 'De onde tirar exemplos (repertório)' },
      { t: 'p', texto: 'Você não precisa saber muita coisa. Precisa saber **algumas coisas certas** e usá-las bem. Estes exemplos servem para muitos temas:' },
      { t: 'tabela', cab: ['Repertório', 'O que diz', 'Serve para'], linhas: [
        ['Constituição, art. 5º', 'Todos são iguais perante a lei', 'Racismo, preconceito, desigualdade'],
        ['Constituição, art. 6º', 'Saúde, educação, trabalho, segurança e outros são direitos sociais', 'Quase todos os temas sociais'],
        ['Constituição, art. 144', 'Segurança pública é dever do Estado, direito e responsabilidade de todos', 'Violência, polícia, crime'],
        ['Constituição, art. 205', 'Educação é direito de todos e dever do Estado e da família', 'Escola, jovens, prevenção'],
        ['Estatuto da Criança e do Adolescente (1990)', 'Proteção integral de crianças e adolescentes', 'Jovens, escola, violência'],
        ['Lei Maria da Penha (2006)', 'Combate à violência doméstica contra a mulher', 'Violência contra a mulher'],
        ['Estatuto da Pessoa Idosa (2003)', 'Direitos das pessoas com 60 anos ou mais', 'Idosos, envelhecimento'],
        ['Código de Trânsito Brasileiro (1997)', 'Trânsito seguro é direito de todos', 'Trânsito'],
        ['Marco Civil da Internet (2014)', 'Regras para o uso da internet no Brasil', 'Golpes, redes sociais, tecnologia'],
      ] },
      { t: 'dica', texto: '**Exemplo da vida real também vale.** Se você não lembrar de nenhuma lei, use uma situação comum e verdadeira: "É comum ver motociclistas trafegando entre os carros em alta velocidade nas grandes cidades." Só não conte uma história pessoal ("eu vi", "comigo aconteceu").' },
      { t: 'h', texto: 'Pares de argumentos que servem para quase todo tema' },
      { t: 'tabela', cab: ['Motivo 1', 'Motivo 2'], linhas: [
        ['Falta de educação / conscientização', 'Falta de fiscalização / punição'],
        ['Falha do Estado (governo, leis, estrutura)', 'Falha da sociedade (família, cultura, comportamento)'],
        ['Uma causa do problema', 'Uma consequência do problema'],
        ['Questão econômica (dinheiro, emprego)', 'Questão social (cultura, preconceito)'],
      ] },
      { t: 'exercicio', enunciado: 'Ponha as frases na ordem certa para formar um parágrafo (tópico, explicação, exemplo, fechamento).', itens: [
        'a) Assim, muitas famílias comprometem o dinheiro das contas básicas.',
        'b) Em primeiro lugar, as apostas online prejudicam o orçamento das famílias.',
        'c) Isso acontece porque a promessa de lucro rápido incentiva apostas repetidas.',
        'd) Um estudo do Banco Central mostrou que bilhões de reais foram enviados às empresas de apostas em um único mês de 2024.',
      ], resposta: '**b, c, d, a.** Tópico frasal (b), explicação (c), exemplo (d) e fechamento (a).' },
      { t: 'exercicio', enunciado: 'Escreva um parágrafo de desenvolvimento de 4 a 5 linhas para o tema "Os impactos das apostas online na vida financeira das famílias brasileiras", usando o motivo "a propaganda das apostas nas redes sociais".', resposta: 'Modelo para comparar: Além disso, a propaganda das apostas nas redes sociais também agrava esse problema. Isso acontece porque influenciadores apresentam as apostas como um jeito fácil de ganhar dinheiro, sem mostrar as perdas. Como muitos seguidores são jovens e de baixa renda, eles passam a apostar o que não podem perder. Assim, a publicidade sem controle aumenta o endividamento das famílias.', linhas: 6 },
    ],
    lembrar: ['2 parágrafos de 4 a 5 linhas, um para cada motivo', 'Tópico frasal + explicação + exemplo + fechamento', 'Argumento solto (sem "por quê") perde ponto', 'Use leis e fatos certos; nunca história pessoal'],
    tarefa: { texto: 'Faça a redação. Antes de enviar, confira em cada parágrafo de desenvolvimento se há as 4 partes: tópico, explicação, exemplo e fechamento.', proposta: 'apostas-online' },
  },

  // ------------------------------------------------------------------ 5
  {
    n: 5,
    titulo: 'A conclusão e os conectivos',
    chamada: 'Fechar o texto com uma proposta e ligar as ideias com as palavras certas.',
    minutos: 40,
    objetivo: 'Escrever uma conclusão completa em 3 a 4 linhas e usar conectivos para ligar frases e parágrafos.',
    aprender: ['a conclusão em 2 movimentos', 'a proposta com quem, o quê, como e para quê', 'os conectivos mais úteis', 'como não repetir palavras'],
    blocos: [
      { t: 'h', texto: 'A conclusão em 2 movimentos' },
      { t: 'p', texto: 'A conclusão tem **3 a 4 linhas**. Ela **retoma a tese** com outras palavras e **propõe uma saída** para o problema. A AOCP não exige proposta, mas ela deixa o fim do texto forte e seguro.' },
      { t: 'modelo', titulo: 'Conclusão pronta para completar', texto: 'Portanto, [retome a tese com outras palavras]. Para mudar esse cenário, [QUEM: o Estado, o governo, as escolas, a mídia, a família] deve [O QUÊ: ação concreta], por meio de [COMO], a fim de [PARA QUÊ: o resultado esperado].' },
      { t: 'modelo', titulo: 'Exemplo (tema: trânsito)', texto: 'Portanto, reduzir as mortes no trânsito exige ação do Estado e da sociedade. Para isso, os órgãos de trânsito devem ampliar a fiscalização nas vias, por meio de radares e blitze frequentes, a fim de diminuir a imprudência dos condutores.' },
      { t: 'alerta', texto: '**Pegadinhas da conclusão:** trazer um argumento novo (o lugar dele era o desenvolvimento); terminar com pergunta ("Até quando isso vai continuar?"); propor algo vago ("é preciso que todos se conscientizem"). Diga **quem** faz **o quê**.' },
      { t: 'h', texto: 'Conectivos: as "pontes" do texto' },
      { t: 'p', texto: 'Conectivos ligam as frases e os parágrafos. Eles valem pontos no critério 2. Você não precisa de muitos: aprenda estes e use sempre.' },
      { t: 'tabela', cab: ['Para…', 'Use', 'Onde fica'], linhas: [
        ['Mostrar oposição', 'Entretanto, / No entanto, / Contudo,', 'Na tese da introdução'],
        ['Começar o 1º argumento', 'Em primeiro lugar, / Inicialmente,', 'Início do 2º parágrafo'],
        ['Somar o 2º argumento', 'Além disso, / Ademais,', 'Início do 3º parágrafo'],
        ['Explicar', 'Isso acontece porque / visto que / já que', 'Meio do parágrafo'],
        ['Dar exemplo', 'Um exemplo disso é / como mostra', 'Meio do parágrafo'],
        ['Mostrar consequência', 'Desse modo, / Assim, / Com isso,', 'Fim do parágrafo'],
        ['Concluir', 'Portanto, / Dessa forma, / Logo,', 'Início da conclusão'],
      ] },
      { t: 'dica', texto: 'Depois de conectivo no início da frase, use **vírgula**: "Além disso, …", "Portanto, …". E não repita o mesmo conectivo no texto: um "Além disso" basta.' },
      { t: 'h', texto: 'Como não repetir palavras' },
      { t: 'p', texto: 'Repetir a mesma palavra muitas vezes cansa o leitor. Troque por um **sinônimo**, por um **pronome** ("esse problema", "isso") ou por uma expressão que resume a ideia ("essa situação", "esse cenário").' },
      { t: 'compara', ruim: 'O racismo é um problema grave. O racismo existe no Brasil há séculos. Por isso o racismo precisa ser combatido.', bom: 'O racismo é um problema grave no Brasil. Essa forma de discriminação existe há séculos e, por isso, precisa ser combatida.', porque: 'No segundo trecho, "essa forma de discriminação" retoma "racismo" sem repetir a palavra, e as frases ficaram ligadas.' },
      { t: 'exercicio', enunciado: 'Complete com o conectivo certo: "Entretanto,", "Além disso,", "Portanto,", "Isso acontece porque".', itens: [
        'a) A lei garante a igualdade entre todos. ______ o preconceito ainda é comum no país.',
        'b) ______ o preconceito é aprendido desde a infância.',
        'c) ______ a punição dos crimes raciais ainda é lenta.',
        'd) ______ o combate ao racismo exige educação e aplicação da lei.',
      ], resposta: 'a) **Entretanto,** (oposição)\nb) **Isso acontece porque** (explicação)\nc) **Além disso,** (soma de argumento)\nd) **Portanto,** (conclusão)' },
      { t: 'exercicio', enunciado: 'Escreva uma conclusão de 3 a 4 linhas para o tema "O uso de câmeras corporais pelas polícias e a relação com a sociedade", com quem, o quê, como e para quê.', resposta: 'Modelo para comparar: Portanto, as câmeras corporais podem fortalecer a confiança entre a polícia e a população. Para isso, os governos estaduais devem ampliar o uso dos equipamentos, por meio de investimento e de regras claras de gravação, a fim de proteger tanto os cidadãos quanto os bons policiais.', linhas: 5 },
    ],
    lembrar: ['Conclusão: retome a tese + proposta', 'Proposta = quem + o quê + como + para quê', 'Nada de argumento novo nem pergunta no fim', 'Entretanto (tese), Em primeiro lugar, Além disso, Portanto', 'Troque palavras repetidas por "esse problema", "essa situação"'],
    tarefa: { texto: 'Faça a redação completa. Antes de enviar, circule os conectivos do seu texto: tem um no começo de cada parágrafo?', proposta: 'cameras-corporais' },
  },

  // ------------------------------------------------------------------ 6
  {
    n: 6,
    titulo: 'Os erros de português que mais tiram ponto',
    chamada: '12 erros comuns, a regra simples de cada um e como corrigir na folha.',
    minutos: 45,
    objetivo: 'Parar de perder pontos no critério 4 com os erros que mais aparecem nas redações de concurso.',
    aprender: ['12 erros comuns e a regra de cada um', 'como escrever frases curtas e claras', 'o jeito certo de corrigir um erro na folha', 'a linguagem que a prova pede'],
    blocos: [
      { t: 'p', texto: 'O critério 4 conta os **desvios**: cada erro tira um pouco. Você não precisa saber toda a gramática. Precisa parar de cometer os erros mais comuns. Aqui estão eles.' },
      { t: 'tabela', cab: ['Erro', 'Errado', 'Certo', 'Regra simples'], linhas: [
        ['1. Vírgula entre sujeito e verbo', 'A violência contra a mulher, é um problema.', 'A violência contra a mulher é um problema.', 'Nunca separe com vírgula quem faz (sujeito) da ação (verbo).'],
        ['2. Mas × mais', 'A lei existe, mais não é cumprida.', 'A lei existe, mas não é cumprida.', 'Mas = porém. Mais = quantidade.'],
        ['3. Há × a', 'Isso acontece a muitos anos.', 'Isso acontece há muitos anos.', 'Tempo passado = há (troque por "faz"). Futuro = a ("daqui a dois meses").'],
        ['4. Haver no plural', 'Haviam muitos casos.', 'Havia muitos casos.', 'Haver com sentido de existir fica no singular. Ou use: "Existiam muitos casos."'],
        ['5. Onde', 'Uma situação onde todos perdem.', 'Uma situação em que todos perdem.', 'Onde só para lugar físico.'],
        ['6. Porque × por que', 'Isso ocorre por que falta fiscalização.', 'Isso ocorre porque falta fiscalização.', 'Explicação = porque (junto). Pergunta = por que (separado).'],
        ['7. Tem × têm', 'Os jovens tem direito à educação.', 'Os jovens têm direito à educação.', 'Plural leva acento: ele tem, eles têm.'],
        ['8. Mal × mau', 'O serviço foi mau feito e teve um mal resultado.', 'O serviço foi mal feito e teve um mau resultado.', 'Mau é o contrário de bom. Mal é o contrário de bem.'],
        ['9. Crase', 'Isso leva à aumentar os casos.', 'Isso leva a aumentar os casos.', 'Nunca há crase antes de verbo nem de palavra masculina.'],
        ['10. Linguagem informal', 'A gente vê que o pessoal tá nem aí.', 'Nota-se que parte da população é indiferente.', 'Nada de gíria, "a gente", "tá", "tipo", "né".'],
        ['11. Abreviação', 'vc, pq, tb, q', 'você, porque, também, que', 'Escreva tudo por extenso.'],
        ['12. Frase enorme', 'Uma frase de 5 linhas sem ponto.', 'Duas ou três frases curtas.', 'Frase com mais de 3 linhas: corte com ponto final.'],
      ] },
      { t: 'dica', texto: '**Truque da crase:** troque a palavra feminina por uma masculina. Se virar "ao", tem crase. "Em relação **à** violência" → "em relação **ao** crime". Se não virar "ao", não tem crase.' },
      { t: 'h', texto: 'A linguagem da prova' },
      { t: 'lista', itens: [
        'Prefira a 3ª pessoa: "é preciso", "nota-se", "deve-se". Evite "eu acho".',
        'Escreva os números até dez por extenso ("dois motivos") e use algarismos para dados ("37 mil mortes").',
        'Não use frases feitas de rede social, ironia ou exagero ("todo mundo sabe", "isso é um absurdo").',
      ] },
      { t: 'h', texto: 'Como corrigir um erro na folha definitiva' },
      { t: 'modelo', titulo: 'O jeito certo', texto: 'Passe **um traço simples** sobre a palavra errada e escreva a certa logo depois.\nExemplo: os jovens ~~tem~~ têm direito…\n\nNada de rabisco, borrão, corretivo, parênteses ou "digo".' },
      { t: 'alerta', texto: '**Letra legível também é critério.** Treine sempre à mão, na folha pautada, com a caneta da prova. Se a sua letra é difícil de ler, escreva um pouco maior e separe bem as palavras. Ilegível pode zerar.' },
      { t: 'exercicio', enunciado: 'Encontre e corrija o erro de cada frase.', itens: [
        'a) Os policiais, precisam de treinamento constante.',
        'b) Haviam poucos radares na rodovia.',
        'c) A população tem medo, mais continua denunciando.',
        'd) Isso acontece a décadas no Brasil.',
        'e) O idoso merece respeito por que contribuiu para a sociedade.',
      ], resposta: 'a) Sem vírgula: "Os policiais precisam…"\nb) "**Havia** poucos radares…"\nc) "…medo, **mas** continua…"\nd) "…acontece **há** décadas…"\ne) "…respeito **porque** contribuiu…"' },
      { t: 'exercicio', enunciado: 'Reescreva em linguagem formal: "A gente vê que tá cada vez pior, tipo, os caras não respeitam as leis de trânsito."', resposta: 'Modelo: "Nota-se que a situação está cada vez mais grave, pois muitos condutores não respeitam as leis de trânsito."', linhas: 3 },
    ],
    lembrar: ['Sem vírgula entre sujeito e verbo', 'Mas = porém; há = faz (tempo passado)', '"Havia muitos casos" (haver fica no singular)', 'Crase: troque por masculino; virou "ao"? tem crase', 'Errou na folha: um traço simples e siga'],
    tarefa: { texto: 'Faça a redação e, antes de enviar, procure no seu texto cada um dos 12 erros desta aula. Corrija o que encontrar.', proposta: 'racismo' },
  },

  // ------------------------------------------------------------------ 7
  {
    n: 7,
    titulo: 'O texto inteiro, passo a passo',
    chamada: 'Do tema à folha definitiva em cerca de 1 hora, com o esqueleto pronto.',
    minutos: 50,
    objetivo: 'Juntar tudo o que você aprendeu e montar uma redação completa, do tema à folha definitiva, controlando o tempo.',
    aprender: ['o passo a passo da prova em cerca de 1 hora', 'o esqueleto completo da redação', 'uma redação montada do começo ao fim', 'como revisar antes de passar a limpo'],
    blocos: [
      { t: 'h', texto: 'O passo a passo na prova' },
      { t: 'tabela', cab: ['Etapa', 'O que fazer', 'Tempo'], linhas: [
        ['1. Ler', 'Leia o tema 2 vezes, sublinhe as palavras-chave e vire o tema uma pergunta', '5 min'],
        ['2. Planejar', 'No rascunho: tese em 1 linha, motivo 1 + exemplo, motivo 2 + exemplo, proposta', '10 min'],
        ['3. Rascunho', 'Escreva o texto usando o esqueleto', '20 a 25 min'],
        ['4. Revisar', 'Use o checklist (aula 8) e conte as linhas', '5 min'],
        ['5. Passar a limpo', 'Copie na folha definitiva, com calma e letra legível', '15 min'],
      ] },
      { t: 'dica', texto: 'Total: cerca de **1 hora**. Uma boa estratégia é fazer a redação depois de um primeiro bloco de questões objetivas, e **nunca** deixá-la para os últimos 40 minutos.' },
      { t: 'h', texto: 'O esqueleto completo' },
      { t: 'modelo', titulo: 'Esqueleto da redação (cerca de 17 linhas)', texto: '§1 INTRODUÇÃO (3 a 4 linhas)\n[Contexto: lei ou fato]. Entretanto, [problema do tema] ainda [persiste] no Brasil, sobretudo devido a [motivo 1] e a [motivo 2].\n\n§2 DESENVOLVIMENTO 1 (4 a 5 linhas)\nEm primeiro lugar, [motivo 1] contribui para [o problema]. Isso acontece porque [explicação]. Um exemplo disso é [exemplo]. Desse modo, [ligação com o tema].\n\n§3 DESENVOLVIMENTO 2 (4 a 5 linhas)\nAlém disso, [motivo 2] também agrava [o problema]. [Explicação]. [Exemplo]. Assim, [ligação com o tema].\n\n§4 CONCLUSÃO (3 a 4 linhas)\nPortanto, [tese com outras palavras]. Para mudar esse cenário, [quem] deve [o quê], por meio de [como], a fim de [para quê].' },
      { t: 'h', texto: 'Montando uma redação do começo ao fim' },
      { t: 'p', texto: '**Tema:** "Desafios para reduzir as mortes no trânsito brasileiro". **Pergunta:** o que dificulta a redução das mortes? **Planejamento no rascunho:**' },
      { t: 'tabela', cab: ['Parte', 'Anotação rápida'], linhas: [
        ['Tese', 'mortes altas por imprudência + pouca fiscalização'],
        ['Motivo 1 + exemplo', 'imprudência (velocidade, celular) + aumento das mortes de motociclistas'],
        ['Motivo 2 + exemplo', 'fiscalização fraca + poucos radares e blitze'],
        ['Proposta', 'órgãos de trânsito + mais fiscalização e campanhas + para salvar vidas'],
      ] },
      { t: 'modelo', titulo: 'A redação pronta', texto: 'O Código de Trânsito Brasileiro estabelece que o trânsito seguro é direito de todos. Entretanto, as mortes nas vias do país continuam altas, sobretudo devido à imprudência dos condutores e à fiscalização insuficiente.\n\nEm primeiro lugar, a imprudência ao volante contribui para esse problema. Isso acontece porque muitos motoristas excedem a velocidade e usam o celular ao dirigir, o que reduz o tempo de reação. Prova disso é o aumento das mortes de motociclistas entre 2023 e 2024, segundo o Ministério da Saúde. Desse modo, a falta de cuidado torna as ruas perigosas.\n\nAlém disso, a fiscalização não acompanha o crescimento da frota. Sem radares e blitze frequentes, muitos condutores acreditam que a infração não terá punição. Um exemplo disso é a cena comum de motos em alta velocidade entre os carros. Assim, o desrespeito às leis se torna rotina.\n\nPortanto, reduzir as mortes no trânsito exige ação do poder público. Para isso, os órgãos de trânsito devem ampliar a fiscalização e as campanhas educativas, por meio de radares e blitze, a fim de preservar vidas.' },
      { t: 'p', texto: 'Repare: **4 parágrafos**, a tese anuncia os 2 motivos, cada desenvolvimento tem tópico, explicação, exemplo e fechamento, e a conclusão tem quem, o quê, como e para quê. São cerca de 170 palavras: escrito à mão, dá entre 16 e 19 linhas, conforme a letra.' },
      { t: 'alerta', texto: '**Copie a estrutura, não as frases.** Na prova, o tema será outro. Se você decorar frases e elas não combinarem com o tema, o texto perde pontos.' },
      { t: 'exercicio', enunciado: 'Faça só o planejamento (sem escrever o texto) para o tema "Caminhos para combater o racismo na sociedade brasileira": tese, motivo 1 + exemplo, motivo 2 + exemplo e proposta.', resposta: 'Possível planejamento:\nTese: combate ao racismo depende de educação e de punição efetiva.\nMotivo 1 + exemplo: preconceito aprendido desde a infância + escola sem educação antirracista.\nMotivo 2 + exemplo: punição lenta + Lei 14.532/2023, que tornou a injúria racial crime de racismo.\nProposta: escolas e Estado + educação antirracista e aplicação da lei + para garantir a igualdade do art. 5º.', linhas: 6 },
    ],
    lembrar: ['Ler 5 min, planejar 10, rascunho 20 a 25, revisar 5, passar a limpo 15', 'Planeje antes de escrever: tese, 2 motivos com exemplo, proposta', 'Use o esqueleto de 4 parágrafos', 'Copie a estrutura, não as frases'],
    tarefa: { texto: '**Reescreva a sua redação da semana 1** (tema do trânsito), agora com o passo a passo e o esqueleto. Marque o tempo de cada etapa. Depois compare as duas correções: veja quanto você evoluiu.', proposta: 'transito' },
  },

  // ------------------------------------------------------------------ 8
  {
    n: 8,
    titulo: 'Revisão final e o dia da prova',
    chamada: 'O checklist antes de entregar, o simulado e o que fazer no dia.',
    minutos: 40,
    objetivo: 'Revisar a redação com um checklist, fazer um simulado cronometrado e chegar ao dia da prova com um plano.',
    aprender: ['o checklist de 10 itens antes de passar a limpo', 'como fazer o simulado', 'o que fazer nas últimas semanas', 'o plano para o dia da prova'],
    blocos: [
      { t: 'h', texto: 'O checklist antes de passar a limpo' },
      { t: 'p', texto: 'Leia o rascunho e responda **sim** a cada item. Se algum for **não**, corrija antes de passar para a folha definitiva.' },
      { t: 'lista', numerada: true, itens: [
        'O texto fala do tema **exato** (com o recorte)?',
        'A introdução tem contexto, tese e os 2 motivos?',
        'Cada desenvolvimento tem tópico, explicação, exemplo e fechamento?',
        'A conclusão retoma a tese e diz quem faz o quê, como e para quê?',
        'Tem conectivo no início de cada parágrafo (Entretanto, Em primeiro lugar, Além disso, Portanto)?',
        'Algum trecho foi copiado do texto motivador? (Se sim, reescreva com suas palavras.)',
        'Tem vírgula entre sujeito e verbo? "Haviam"? "Mais" no lugar de "mas"?',
        'Tem gíria, abreviação, "a gente" ou "eu acho"?',
        'O texto tem entre 15 e 20 linhas (melhor 17 ou 18)?',
        'Não tem nome, assinatura, título nem nada que identifique você?',
      ] },
      { t: 'dica', texto: '**Termine com 17 ou 18 linhas.** Se a letra crescer ao passar a limpo, você ainda fica abaixo da 20ª linha. Tudo o que passar da linha 20 não é lido.' },
      { t: 'h', texto: 'O simulado desta semana' },
      { t: 'p', texto: 'Faça a redação desta semana **como se fosse a prova**: tema da prova de 2024, cronômetro ligado, folha pautada, caneta azul ou preta, sem consultar nada. Siga o passo a passo da aula 7 e use este checklist.' },
      { t: 'h', texto: 'As últimas semanas antes da prova' },
      { t: 'tabela', cab: ['O que fazer', 'Por quê'], linhas: [
        ['Reescrever a redação com a pior nota', 'Corrigir o próprio erro ensina mais que escrever um texto novo'],
        ['Ler as redações-modelo da plataforma', 'Você vê a estrutura funcionando em temas diferentes'],
        ['Fazer 1 redação cronometrada por semana', 'Treina o tempo e a letra'],
        ['Revisar a "cola" de cada aula', 'Os pontos que você não pode esquecer'],
        ['Ler 1 notícia ou texto de opinião por dia', 'Dá ideias e exemplos para os argumentos'],
      ] },
      { t: 'h', texto: 'No dia da prova' },
      { t: 'lista', itens: [
        'Leve **duas canetas** esferográficas de corpo transparente, azul ou preta.',
        'Faça a redação depois de um primeiro bloco de questões objetivas, quando a cabeça já esquentou.',
        'Reserve cerca de **1 hora** para a redação e **nunca** deixe para os últimos 40 minutos.',
        'Se o tema parecer difícil, respire e volte à pergunta: o que o tema pede? Use os pares de argumentos coringa (aula 4).',
        'Passe a limpo com calma. Letra legível vale mais que pressa.',
        'Antes de entregar, confira de novo: nada de nome, nada de lápis, nada fora da folha definitiva.',
      ] },
      { t: 'alerta', texto: '**Lembre:** a redação só é corrigida se você ficar dentro do número de classificados da prova objetiva. Então não descuide das questões: a objetiva decide se a sua redação será lida, e a redação decide a sua posição.' },
      { t: 'exercicio', enunciado: 'Um candidato terminou o rascunho com 22 linhas. O que ele deve fazer?', itens: [
        'a) Passar tudo para a folha e escrever as 2 últimas linhas na margem.',
        'b) Cortar frases repetidas ou exemplos longos até ficar com 17 ou 18 linhas.',
        'c) Diminuir muito a letra para caber.',
      ], resposta: '**Letra b.** Escrever fora das linhas pode zerar e letra pequena demais pode ficar ilegível. O melhor é cortar o que repete ideias.' },
      { t: 'exercicio', enunciado: 'Marque C (certo) ou E (errado).', itens: [
        'Se eu errar uma palavra na folha definitiva, devo passar um traço simples sobre ela.',
        'Posso escrever "Como diz o texto motivador" para mostrar que li a proposta.',
        'A conclusão é o lugar certo para apresentar um argumento novo e forte.',
      ], resposta: '1. **C**.\n2. **E**: use a informação com suas palavras e cite a fonte real.\n3. **E**: argumento novo vai no desenvolvimento; a conclusão retoma a tese e propõe uma saída.' },
    ],
    lembrar: ['Revise com o checklist de 10 itens antes de passar a limpo', 'Termine com 17 ou 18 linhas', 'Na última fase, reescreva a pior redação', 'Duas canetas, 1 hora para a redação, nunca nos últimos 40 minutos', 'Você treinou: confie no esqueleto'],
    tarefa: { texto: '**Simulado:** faça a redação com o tema que caiu na prova de 2024, cronometrando cerca de 1 hora e usando o checklist. Envie para ver como você está chegando à prova.', proposta: 'turismo-sustentavel' },
  },
];

export const aulaRedacao = (n: number) => AULAS_REDACAO.find((a) => a.n === n) ?? null;
