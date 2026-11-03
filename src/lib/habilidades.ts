// Matriz de Referência de Matemática do ENEM (competências e habilidades)
export const HABILIDADES: Record<string, string> = {
  H1: 'Reconhecer, no contexto social, diferentes significados e representações dos números e operações.',
  H2: 'Identificar padrões numéricos ou princípios de contagem.',
  H3: 'Resolver situação-problema envolvendo conhecimentos numéricos.',
  H4: 'Avaliar a razoabilidade de um resultado numérico na construção de argumentos sobre afirmações quantitativas.',
  H5: 'Avaliar propostas de intervenção na realidade utilizando conhecimentos numéricos.',
  H6: 'Interpretar a localização e a movimentação de pessoas/objetos no espaço tridimensional e sua representação no espaço bidimensional.',
  H7: 'Identificar características de figuras planas ou espaciais.',
  H8: 'Resolver situação-problema que envolva conhecimentos geométricos de espaço e forma.',
  H9: 'Utilizar conhecimentos geométricos de espaço e forma na seleção de argumentos propostos como solução de problemas do cotidiano.',
  H10: 'Identificar relações entre grandezas e unidades de medida.',
  H11: 'Utilizar a noção de escalas na leitura de representação de situação do cotidiano.',
  H12: 'Resolver situação-problema que envolva medidas de grandezas.',
  H13: 'Avaliar o resultado de uma medição na construção de um argumento consistente.',
  H14: 'Avaliar proposta de intervenção na realidade utilizando conhecimentos geométricos relacionados a grandezas e medidas.',
  H15: 'Identificar a relação de dependência entre grandezas.',
  H16: 'Resolver situação-problema envolvendo a variação de grandezas, direta ou inversamente proporcionais.',
  H17: 'Analisar informações envolvendo a variação de grandezas como recurso para a construção de argumentação.',
  H18: 'Avaliar propostas de intervenção na realidade envolvendo variação de grandezas.',
  H19: 'Identificar representações algébricas que expressem a relação entre grandezas.',
  H20: 'Interpretar gráfico cartesiano que represente relações entre grandezas.',
  H21: 'Resolver situação-problema cuja modelagem envolva conhecimentos algébricos.',
  H22: 'Utilizar conhecimentos algébricos/geométricos como recurso para a construção de argumentação.',
  H23: 'Avaliar propostas de intervenção na realidade utilizando conhecimentos algébricos.',
  H24: 'Utilizar informações expressas em gráficos ou tabelas para fazer inferências.',
  H25: 'Resolver problema com dados apresentados em tabelas ou gráficos.',
  H26: 'Analisar informações expressas em gráficos ou tabelas como recurso para a construção de argumentos.',
  H27: 'Calcular medidas de tendência central ou de dispersão de um conjunto de dados expressos em uma tabela de frequências de dados agrupados (não em classes) ou em gráficos.',
  H28: 'Resolver situação-problema que envolva conhecimentos de estatística e probabilidade.',
  H29: 'Utilizar conhecimentos de estatística e probabilidade como recurso para a construção de argumentação.',
  H30: 'Avaliar propostas de intervenção na realidade utilizando conhecimentos de estatística e probabilidade.',
};

export type Nivel = { rotulo: string; cor: string; texto: string };

// Nível de aprendizagem pela porcentagem de acertos
export function nivelDe(pct: number): Nivel {
  if (pct >= 80) return { rotulo: 'Dominada', cor: '#3FC6FF', texto: '#03102E' };
  if (pct >= 60) return { rotulo: 'Boa', cor: '#1F6BFF', texto: '#FFFFFF' };
  if (pct >= 40) return { rotulo: 'Em desenvolvimento', cor: '#FFD27A', texto: '#03102E' };
  return { rotulo: 'Precisa revisar', cor: '#FF8A4C', texto: '#03102E' };
}

export const codigoValido = (cod: string) => /^H([1-9]|[12]\d|30)$/.test(cod);

// As 7 competências de Matemática da Matriz do ENEM e suas habilidades
export const COMPETENCIAS: { numero: number; nome: string; habilidades: string[] }[] = [
  { numero: 1, nome: 'Números e operações', habilidades: ['H1', 'H2', 'H3', 'H4', 'H5'] },
  { numero: 2, nome: 'Geometria: espaço e forma', habilidades: ['H6', 'H7', 'H8', 'H9'] },
  { numero: 3, nome: 'Grandezas e medidas', habilidades: ['H10', 'H11', 'H12', 'H13', 'H14'] },
  { numero: 4, nome: 'Variação de grandezas e proporcionalidade', habilidades: ['H15', 'H16', 'H17', 'H18'] },
  { numero: 5, nome: 'Álgebra e funções', habilidades: ['H19', 'H20', 'H21', 'H22', 'H23'] },
  { numero: 6, nome: 'Gráficos e tabelas', habilidades: ['H24', 'H25', 'H26'] },
  { numero: 7, nome: 'Estatística e probabilidade', habilidades: ['H27', 'H28', 'H29', 'H30'] },
];

export const competenciaDe = (cod: string) => COMPETENCIAS.find((c) => c.habilidades.includes(cod));
