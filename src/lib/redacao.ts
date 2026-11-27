// =====================================================================
// Redação no modelo da AOCP (PM PE · Soldado)
// Texto dissertativo-argumentativo de 15 a 20 linhas, 4 critérios de 0 a 10 (total 40).
// Este arquivo não usa nada do servidor: serve para as páginas e para o navegador.
// =====================================================================

export const NOTA_MAXIMA = 40;
export const NOTA_MINIMA = 12;          // abaixo disso o candidato é eliminado
export const LINHAS_MIN = 15;
export const LINHAS_MAX = 20;
export const PALAVRAS_POR_LINHA = 10;   // média de uma linha escrita à mão na folha de redação

export const CRITERIOS = [
  { n: 1, nome: 'Tema e argumentação', dica: 'Atendimento e desenvolvimento do tema, informatividade e argumentação' },
  { n: 2, nome: 'Coesão e coerência', dica: 'Ligação dentro dos parágrafos e entre eles, com ideias sem contradição' },
  { n: 3, nome: 'Estrutura', dica: 'Texto dissertativo-argumentativo com introdução, desenvolvimento e conclusão em parágrafos' },
  { n: 4, nome: 'Gramática', dica: 'Pontuação, grafia, concordância, regência e colocação' },
] as const;
export type ChaveCriterio = 'c1' | 'c2' | 'c3' | 'c4';

// O que zera a redação no edital (as 2 últimas só valem para a folha escrita à mão)
export const MOTIVOS_ZERO = [
  'Fuga ao tema',
  'Não é dissertativo-argumentativo',
  'Desestruturação acentuada',
  'Atentado ao pudor',
  'Identificação do candidato (nome, assinatura ou sinal)',
  'Em branco, ilegível ou com espaçamento excessivo',
  'Escrita a lápis ou com tinta de cor não permitida',
] as const;

export const COMANDO =
  'A partir da leitura do texto motivador e com base nos seus conhecimentos, redija um texto dissertativo-argumentativo, de 15 a 20 linhas, sobre o tema proposto. Apresente argumentos que sustentem o seu ponto de vista.';

// ---------- Propostas ----------
export type Fonte = { rotulo: string; url: string };
export type Proposta = {
  slug: string;
  tema: string;
  origem: 'treino' | 'curso' | 'prova';
  resumo: string;                          // uma linha para o cartão
  texto?: string;                          // o texto motivador (com nossas palavras)
  fontes?: Fonte[];
  pdfs?: { proposta: string; revisao: string; modelo: string };   // PDFs do Reta Final (só para quem tem o curso)
};

export const PROPOSTAS: Proposta[] = [
  {
    slug: 'transito', origem: 'treino',
    tema: 'Desafios para reduzir as mortes no trânsito brasileiro',
    resumo: 'Mortes voltaram a subir e 4 em cada 10 vítimas estavam em motos.',
    texto: 'O Brasil voltou a registrar alta nas mortes no trânsito. Segundo o Sistema de Informações sobre Mortalidade, do Ministério da Saúde, o país passou de 34.881 mortes em 2023 para 37.150 em 2024, um aumento de 6,5%. Entre os ocupantes de motocicletas, o crescimento foi ainda maior: de 13.477 para 15.459 mortes, alta de 14,7%. Hoje, cerca de 4 em cada 10 vítimas fatais estavam em motos.',
    fontes: [{ rotulo: 'Portal do Trânsito, com dados do Ministério da Saúde', url: 'https://www.portaldotransito.com.br/noticias/mobilidade-e-tecnologia/eventos/dia-mundial-em-memoria-das-vitimas-do-transito-4-em-cada-10-pessoas-que-morreram-no-brasil-estavam-em-motos/amp/' }],
  },
  {
    slug: 'apostas-online', origem: 'treino',
    tema: 'Os impactos das apostas online na vida financeira das famílias brasileiras',
    resumo: 'R$ 20,8 bilhões enviados às bets em um único mês, segundo o Banco Central.',
    texto: 'Um estudo do Banco Central estimou que cerca de 24 milhões de pessoas fizeram ao menos uma transferência via Pix para empresas de apostas em agosto de 2024, somando R$ 20,8 bilhões no mês. Entre os beneficiários do Bolsa Família, cerca de 5 milhões apostaram e enviaram R$ 3 bilhões às bets. Desses apostadores, 70% eram chefes de família, responsáveis por receber o benefício.',
    fontes: [
      { rotulo: 'O Povo / Agência Brasil', url: 'https://www.opovo.com.br/noticias/economia/2024/09/24/beneficiarios-do-bolsa-familia-gastaram-rs-3-bi-em-bets-em-agosto.html' },
      { rotulo: 'Money Times', url: 'https://www.moneytimes.com.br/r-208-bilhoes-foram-gastos-em-jogos-de-aposta-mostra-o-banco-central-mtm/' },
    ],
  },
  {
    slug: 'envelhecimento', origem: 'treino',
    tema: 'O envelhecimento da população e os desafios para garantir os direitos da pessoa idosa',
    resumo: 'Os idosos já são 10,9% da população, segundo o Censo 2022.',
    texto: 'O Censo 2022 do IBGE contou 22.169.101 pessoas com 65 anos ou mais no Brasil, o que corresponde a 10,9% da população. Em 2010, eram 14,1 milhões, ou 7,4%: um crescimento de 57,4% em 12 anos. O índice de envelhecimento chegou a 55,2, ou seja, há 55 idosos para cada 100 crianças de até 14 anos. Em 2010, essa relação era de 30,7.',
    fontes: [{ rotulo: 'Agência de Notícias IBGE', url: 'https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-denoticias/noticias/38186-' }],
  },
  {
    slug: 'racismo', origem: 'treino',
    tema: 'Caminhos para combater o racismo na sociedade brasileira',
    resumo: 'Desde 2023, injúria racial é crime de racismo, com pena de 2 a 5 anos.',
    texto: 'Desde janeiro de 2023, a Lei 14.532 passou a tratar a injúria racial como crime de racismo, inserindo-a na Lei 7.716/1989. A pena, que era de 1 a 3 anos de reclusão, subiu para 2 a 5 anos, além de multa. A injúria racial também passou a ser inafiançável e imprescritível, e o Ministério Público não depende mais da representação da vítima para agir.',
    fontes: [
      { rotulo: 'Planalto · Lei 14.532/2023', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14532.htm' },
      { rotulo: 'Migalhas', url: 'https://www.migalhas.com.br/quentes/379878/lula-sanciona-lei-que-equipara-crime-de-injuria-racial-ao-racismo' },
    ],
  },
  {
    slug: 'cameras-corporais', origem: 'treino',
    tema: 'O uso de câmeras corporais pelas polícias e a relação com a sociedade',
    resumo: 'Portaria do MJSP lista 16 situações em que a gravação é obrigatória.',
    texto: 'Em maio de 2024, o Ministério da Justiça e Segurança Pública publicou a Portaria 648, com diretrizes nacionais para o uso de câmeras corporais pelos órgãos de segurança pública. A norma lista 16 situações em que a gravação é obrigatória, como atendimento de ocorrências, abordagens e patrulhamento ostensivo, e recomenda, de preferência, o acionamento automático. Estados que seguem as diretrizes podem receber recursos federais para comprar os equipamentos.',
    fontes: [
      { rotulo: 'Alma Preta', url: 'https://almapreta.com.br/sessao/politica/ministro-da-justica-cria-diretrizes-para-uso-de-cameras-corporais-estados-podem-escolher-aderir-ou-ignorar/' },
      { rotulo: 'SBT News', url: 'https://sbtnews.sbt.com.br/noticia/policia/cameras-corporais-em-policiais-ministerio-da-justica-define-normas-e-situacoes-que-devem-ser-gravadas' },
    ],
  },
  {
    slug: 'celular-escolas', origem: 'treino',
    tema: 'Os efeitos do uso do celular por estudantes na aprendizagem',
    resumo: 'Lei de 2025 proíbe o celular na aula, no recreio e nos intervalos.',
    texto: 'A Lei 15.100, sancionada em 13 de janeiro de 2025, proíbe que estudantes da educação básica usem celulares e outros aparelhos eletrônicos pessoais durante a aula, o recreio e os intervalos, em escolas públicas e particulares. Em sala, o aparelho só pode ser usado para fins pedagógicos, com orientação do professor. Defensores da lei afirmam que cada notificação tira a atenção do aluno e que o uso no recreio reduz a convivência entre os colegas.',
    fontes: [
      { rotulo: 'Senado · Lei 15.100/2025', url: 'https://legis.senado.leg.br/norma/40157066/publicacao/40157347' },
      { rotulo: 'Agência Câmara', url: 'https://www.camara.leg.br/noticias/1126717-sancionada-lei-que-proibe-o-uso-de-celular-em-escolas/' },
    ],
  },
  {
    slug: 'turismo-sustentavel', origem: 'prova',
    tema: 'Desafios para a promoção do turismo sustentável no Brasil',
    resumo: 'O tema que caiu na prova de Soldado PM PE 2024 (AOCP).',
    texto: 'Turismo sustentável não é um tipo de viagem, mas uma forma de organizar a atividade turística: atender ao mesmo tempo às necessidades dos visitantes e das comunidades que os recebem, protegendo a natureza e a cultura locais para as próximas gerações. Quando o turismo é predatório, pode esgotar recursos naturais e descaracterizar a cultura dos destinos.',
    fontes: [
      { rotulo: 'Proposta da prova PM PE 2024 (textos do Ministério do Turismo, ICMBio e Embratur)', url: 'https://projetoagathaedu.com.br/textos-motivadores/carreiras-policiais-pm/27-desafios-para-a-promocao-do-turismo-sustentavel-no-brasil.php' },
    ],
  },
  {
    slug: 'violencia-contra-mulher', origem: 'curso',
    tema: 'Os desafios para o enfrentamento da violência contra a mulher no Brasil',
    resumo: 'Proposta 1 do Reta Final, com folha de redação e redação-modelo.',
    pdfs: { proposta: 'RD-PROP1-B1', revisao: 'RD-PROP1-B2', modelo: 'RD-PROP1-B3' },
  },
  {
    slug: 'golpes-virtuais', origem: 'curso',
    tema: 'Os golpes virtuais no Brasil e os caminhos para enfrentá-los',
    resumo: 'Proposta 2 do Reta Final, com folha de redação e redação-modelo.',
    pdfs: { proposta: 'RD-PROP2-B1', revisao: 'RD-PROP2-B2', modelo: 'RD-PROP2-B3' },
  },
  {
    slug: 'educacao-criminalidade-jovens', origem: 'curso',
    tema: 'A importância da educação na prevenção da criminalidade entre os jovens',
    resumo: 'Proposta 3 do Reta Final, com folha de redação e redação-modelo.',
    pdfs: { proposta: 'RD-PROP3-B1', revisao: 'RD-PROP3-B2', modelo: 'RD-PROP3-B3' },
  },
  {
    slug: 'saude-mental-seguranca', origem: 'curso',
    tema: 'A saúde mental dos profissionais de segurança pública como questão de interesse coletivo',
    resumo: 'Proposta 4 do Reta Final, com folha de redação e redação-modelo.',
    pdfs: { proposta: 'RD-PROP4-B1', revisao: 'RD-PROP4-B2', modelo: 'RD-PROP4-B3' },
  },
];

export const ORIGEM_ROTULO: Record<Proposta['origem'], string> = { treino: 'Tema de treino', curso: 'Reta Final PM PE', prova: 'Caiu na prova 2024' };

export const propostaPorSlug = (slug: string | null | undefined) => PROPOSTAS.find((p) => p.slug === slug) ?? null;
const normal = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const propostaPorTema = (tema: string) => PROPOSTAS.find((p) => normal(p.tema) === normal(tema)) ?? null;

// ---------- Contagens ----------
export const contarPalavras = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
export const estimarLinhas = (t: string) => {
  const paragrafos = t.split(/\n+/).filter((p) => p.trim());
  // cada parágrafo começa numa linha nova: soma as linhas de cada um
  return paragrafos.reduce((n, p) => n + Math.max(1, Math.ceil(contarPalavras(p) / PALAVRAS_POR_LINHA)), 0);
};
export function situacaoLinhas(linhas: number): 'curta' | 'ok' | 'longa' {
  if (linhas < LINHAS_MIN) return 'curta';
  if (linhas > LINHAS_MAX) return 'longa';
  return 'ok';
}

// faixa de desempenho da nota (0 a 40)
export function faixaNota(nota: number | null | undefined): { rotulo: string; tom: 'ruim' | 'medio' | 'bom' | 'otimo' } | null {
  if (nota == null) return null;
  if (nota < NOTA_MINIMA) return { rotulo: 'Abaixo do mínimo (12)', tom: 'ruim' };
  if (nota < 24) return { rotulo: 'Passou do mínimo', tom: 'medio' };
  if (nota < 32) return { rotulo: 'Boa nota', tom: 'bom' };
  return { rotulo: 'Nota alta', tom: 'otimo' };
}

export const dataBR = (d: string) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

// bloco do cronograma que traz a folha de uma proposta do curso (ex.: RD-PROP1-B1) → a proposta, para enviar a redação
export const propostaDoBloco = (codigo: string | null | undefined) => (codigo ? PROPOSTAS.find((p) => p.pdfs?.proposta === codigo) ?? null : null);
