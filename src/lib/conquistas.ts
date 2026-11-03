// Conquistas do aluno. Os emblemas são formas geométricas, iguais para todos (sem versão de menino ou menina),
// e ficam guardados para sempre: a maior sequência nunca se perde.

export type Conquistas = {
  sequencia_atual: number;
  maior_sequencia: number;
  dias_total: number;
  minutos_aula: number;
  minis: number;
  completos: number;
  questoes: number;
  pontos: number;
};

export const SEM_CONQUISTAS: Conquistas = {
  sequencia_atual: 0, maior_sequencia: 0, dias_total: 0, minutos_aula: 0, minis: 0, completos: 0, questoes: 0, pontos: 0,
};

export type Forma = 'triangulo' | 'quadrado' | 'pentagono' | 'hexagono' | 'estrela';

// Emblemas de dias seguidos de estudo
export const EMBLEMAS_SEQUENCIA: { dias: number; nome: string; forma: Forma; cor: string; frase: string }[] = [
  { dias: 10, nome: 'Ritmo', forma: 'triangulo', cor: '#3FC6FF', frase: '10 dias seguidos de estudo' },
  { dias: 30, nome: 'Constância', forma: 'quadrado', cor: '#1F6BFF', frase: '30 dias seguidos de estudo' },
  { dias: 60, nome: 'Disciplina', forma: 'pentagono', cor: '#7A6BFF', frase: '60 dias seguidos de estudo' },
  { dias: 100, nome: 'Centena', forma: 'hexagono', cor: '#FFD27A', frase: '100 dias seguidos de estudo' },
  { dias: 133, nome: 'Ultra', forma: 'estrela', cor: '#FF8A4C', frase: '133 dias seguidos: o curso inteiro sem parar' },
];

// Níveis por pontos de estudo (aulas + simulados + minissimulados + questões).
// Sobe 1 nível a cada 40 pontos, do nível 1 ao 99+; as faixas mudam nos níveis 10, 20, 30 e 99.
export const PONTOS_POR_NIVEL = 40;
export type FormaFaixa = 'escudo' | 'diamante' | 'estrela';
export type Faixa = { de: number; nome: string; cor: string; texto: string; forma: FormaFaixa };
export const FAIXAS: Faixa[] = [
  { de: 1, nome: 'Bronze', cor: '#C9824A', texto: '#2A1405', forma: 'escudo' },
  { de: 10, nome: 'Prata', cor: '#C7D0DD', texto: '#03102E', forma: 'escudo' },
  { de: 20, nome: 'Ouro', cor: '#FFD27A', texto: '#03102E', forma: 'escudo' },
  { de: 30, nome: 'Diamante', cor: '#3FC6FF', texto: '#03102E', forma: 'diamante' },
  { de: 99, nome: 'Ultra Pro Max', cor: '#FF8A4C', texto: '#03102E', forma: 'estrela' },
];

export const REGRA_PONTOS = '1 ponto por minuto de aula concluída, 20 por minissimulado, 50 por simulado completo e 2 por questão do banco (só a primeira vez de cada um conta). A cada 40 pontos, você sobe um nível.';

export function faixaDoNivel(nivel: number): Faixa {
  let f = FAIXAS[0];
  FAIXAS.forEach((x) => { if (nivel >= x.de) f = x; });
  return f;
}

export function nivelPorPontos(pontos: number) {
  const nivel = Math.min(99, Math.floor(Math.max(0, pontos) / PONTOS_POR_NIVEL) + 1);
  const faixa = faixaDoNivel(nivel);
  const proximaFaixa = FAIXAS.find((x) => x.de > nivel) ?? null;
  const noNivel = Math.max(0, pontos) % PONTOS_POR_NIVEL;
  const maximo = nivel >= 99;
  return {
    nivel,
    rotulo: maximo ? '99+' : String(nivel),
    faixa,
    proximaFaixa,
    maximo,
    pct: maximo ? 100 : Math.round((100 * noNivel) / PONTOS_POR_NIVEL),
    faltam: maximo ? 0 : PONTOS_POR_NIVEL - noNivel,
  };
}

export function proximoEmblema(maior: number) {
  return EMBLEMAS_SEQUENCIA.find((e) => maior < e.dias) ?? null;
}
