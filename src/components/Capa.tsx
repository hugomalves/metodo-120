// Capas automáticas no padrão da marca (desenhadas em SVG, sem arquivo de imagem).
// Usadas nos cartões quando o professor não enviou uma capa própria.

export type TipoCapa = 'modulo' | 'mini' | 'completo' | 'diagnostico' | 'habilidade' | 'lista' | 'banco' | 'stats' | 'trilha' | 'duvidas';

const CORES: Record<TipoCapa, [string, string, string]> = {
  // [início do degradê, fim do degradê, cor de destaque]
  modulo: ['#0B5CFF', '#071A3D', '#5E9BFF'],
  mini: ['#147DFF', '#0D2348', '#8FC1FF'],
  completo: ['#0B5CFF', '#0A1440', '#9DB9FF'],
  diagnostico: ['#7c3aed', '#2e1065', '#c4b5fd'],
  habilidade: ['#147DFF', '#071A3D', '#7DB6FF'],
  lista: ['#0B5CFF', '#0D2348', '#6EE7B7'],
  banco: ['#0B5CFF', '#071A3D', '#93C5FD'],
  stats: ['#0f766e', '#062f2c', '#5eead4'],
  trilha: ['#0B5CFF', '#071A3D', '#FFFFFF'],
  duvidas: ['#ea580c', '#5a1d06', '#fdba74'],
};

// cores das 7 competências (habilidades)
const COMPETENCIA: Record<number, [string, string, string]> = {
  1: ['#2563eb', '#0b1f4d', '#93c5fd'],
  2: ['#0891b2', '#083344', '#67e8f9'],
  3: ['#0d9488', '#042f2e', '#5eead4'],
  4: ['#7c3aed', '#2e1065', '#c4b5fd'],
  5: ['#db2777', '#500724', '#f9a8d4'],
  6: ['#ea580c', '#431407', '#fdba74'],
  7: ['#4f46e5', '#1e1b4b', '#a5b4fc'],
};

// Ícones de traço (viewBox 24×24)
export const ICONES_CAPA: Record<string, string> = {
  numeros: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',
  fracao: 'M12 3v18M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12h8',
  porcentagem: 'M19 5L5 19M7 9a2 2 0 1 0 0-4a2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4a2 2 0 0 0 0 4',
  razao: 'M3 7h18v10H3zM7 7v4M11 7v6M15 7v4M19 7v6',
  grandezas: 'M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z',
  financeira: 'M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3s2.2 2.8 5 3.5s5 1.6 5 3.5s-2.2 3-5 3s-5-1.1-5-3',
  graficos: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  estatistica: 'M3 20h18M5 20V14M9 20V9M13 20V6M17 20v-9M4 13l5-5 4 3 6-6',
  probabilidade: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  combinatoria: 'M12 4v4M12 8l-6 5M12 8l6 5M6 13v3M18 13v3M6 16l-2 4M6 16l2 4M18 16l-2 4M18 16l2 4',
  sequencia: 'M4 18h.01M9 14h.01M14 10h.01M19 6h.01M4 18l15-12',
  funcao: 'M3 20h18M4 3v18M5 18c4-1 6-12 15-14',
  equacao: 'M4 9h6M4 15h6M14 7l6 10M20 7l-6 10',
  plana: 'M12 3l9 16H3zM12 19a4 4 0 0 0-3.5-6',
  espacial: 'M12 2l9 5v10l-9 5-9-5V7zM12 22V12M21 7l-9 5-9-5',
  trigonometria: 'M3 20h18L3 4zM3 14a6 6 0 0 1 5 6',
  analitica: 'M3 12h18M12 3v18M16 7h.01M16 7l-8 10',
  simetria: 'M12 3v18M4 7l6 5-6 5zM20 7l-6 5 6 5z',
  logica: 'M8 4h8v4a2 2 0 1 1 0 4v4H8v-4a2 2 0 1 0 0-4z',
  conjuntos: 'M9 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0M5 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0',
  // tipos de material
  mini: 'M7 3h7l5 5v13H7zM14 3v5h5M10 14l2 2 4-4',
  completo: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h4',
  diagnostico: 'M12 21a9 9 0 1 1 0-18a9 9 0 0 1 0 18zM12 7v5l3 2',
  habilidade: 'M12 21a9 9 0 1 1 0-18a9 9 0 0 1 0 18zM12 16a4 4 0 1 1 0-8a4 4 0 0 1 0 8zM12 12h.01',
  lista: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  banco: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  stats: 'M4 20V11M10 20V5M16 20v-6M21 20H3',
  trilha: 'M5 19c3-6 11-2 14-9M5 19h.01M19 10h.01M12 13h.01M4 5l2 2 3-3',
  duvidas: 'M4 5h16v11H9l-5 4zM10 8.6a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.3M12 13.6h.01',
  livro: 'M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2zM4 5v17M20 5v17',
  globo: 'M12 21a9 9 0 1 1 0-18a9 9 0 0 1 0 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
  atomo: 'M12 12h.01M12 3c2 0 3.6 4 3.6 9S14 21 12 21s-3.6-4-3.6-9S10 3 12 3zM4.2 7.5c1-1.7 5.3-1.1 9.6 1.4s7 6 6 7.6-5.3 1.1-9.6-1.4-7-6-6-7.6zM19.8 7.5c1 1.7-1.7 5.1-6 7.6s-8.6 3.1-9.6 1.4 1.7-5.1 6-7.6 8.6-3.1 9.6-1.4z',
  relogio: 'M12 21a9 9 0 1 1 0-18a9 9 0 0 1 0 18zM12 7v5l3 2',
  fone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  grupo: 'M9 11a3 3 0 1 0 0-6a3 3 0 1 0 0 6M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-5-5.9',
  balanca: 'M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0zM12 3l-1.5 2h3z',
  computador: 'M3 4h18v12H3zM8 20h8M12 16v4',
  escudo: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4',
  historia: 'M4 20h16M6 20V9M10 20V9M14 20V9M18 20V9M3 9l9-5 9 5z',
  idioma: 'M4 5h10M9 3v2M6 5c0 4 3 7 7 8M12 5c0 4-3 7-7 9M13 21l4-9 4 9M14.5 18h5',
  carro: 'M5 16l1.5-5h11l1.5 5M4 16h16v3H4zM7 19v2M17 19v2M7 13.5h.01M17 13.5h.01',
};

// Ícone pela disciplina do concurso
export function iconePorDisciplina(nome: string): string {
  const t = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/direito|legisla|estatuto|etica|constitu|penal|humanos/.test(t)) return 'balanca';
  if (/portugu|redac|interpreta|literat/.test(t)) return 'livro';
  if (/inform|computa|tecnolog/.test(t)) return 'computador';
  if (/logic|raciocin/.test(t)) return 'logica';
  if (/estatist/.test(t)) return 'estatistica';
  if (/matemat|financ/.test(t)) return 'numeros';
  if (/histor|geograf|atualidad|realidade/.test(t)) return 'historia';
  if (/ingles|espanhol|lingua estrangeira/.test(t)) return 'idioma';
  if (/transito/.test(t)) return 'carro';
  if (/fisic|quimic|biolog/.test(t)) return 'atomo';
  return 'escudo';
}

// Escolhe o ícone pelo assunto do título (ex.: "Frações e números decimais" → fração)
export function iconePorTitulo(titulo: string): string {
  const t = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const regras: [RegExp, string][] = [
    [/porcent|juro|desconto|acrescimo/, 'porcentagem'],
    [/financ|dinheiro|parcela/, 'financeira'],
    [/fra(c|ç)|decima/, 'fracao'],
    [/razao|propor|escala|regra de tres/, 'razao'],
    [/grandeza|medida|unidade|conversa/, 'grandezas'],
    [/estatist|media|mediana|moda|desvio|dispers/, 'estatistica'],
    [/grafic|tabela|leitura/, 'graficos'],
    [/probab/, 'probabilidade'],
    [/combinat|contagem|arranjo|permuta/, 'combinatoria'],
    [/sequen|progress|\bpa\b|\bpg\b/, 'sequencia'],
    [/trigon|seno|cosseno/, 'trigonometria'],
    [/analitica|cartesian|reta|coordenad/, 'analitica'],
    [/espacial|volume|solido|prisma|cilindro|cone|esfera|piramide/, 'espacial'],
    [/plana|area|perimetro|triangulo|poligono|circun|pitagoras|semelhan|tales|angulo/, 'plana'],
    [/simetria|transforma|vista|projec|planifica/, 'simetria'],
    [/funcao|funcoes|exponencial|logarit|afim|quadratica/, 'funcao'],
    [/equac|inequa|sistema|algebr|expressa|fatora/, 'equacao'],
    [/conjunto/, 'conjuntos'],
    [/logica|raciocin/, 'logica'],
    [/numer|operac|fundamento|potenc|raiz|divisib|mmc|mdc/, 'numeros'],
  ];
  return regras.find(([r]) => r.test(t))?.[1] ?? 'numeros';
}

export function Capa({ tipo, rotulo, destaque, icone, competencia, titulo, baixa }: {
  tipo: TipoCapa; rotulo: string; destaque?: string; icone?: string; competencia?: number; titulo?: string; baixa?: boolean;
}) {
  const H = baixa ? 140 : 180;
  const cy = H / 2 + 2;
  const [c1, c2, c3] = (tipo === 'habilidade' && competencia && COMPETENCIA[competencia]) || CORES[tipo];
  const id = `g${tipo}${(destaque ?? rotulo).replace(/\W/g, '')}${competencia ?? ''}`;
  const d = ICONES_CAPA[icone ?? tipo] ?? ICONES_CAPA.numeros;
  const grande = destaque ?? '';
  const tamanho = (grande.length <= 2 ? 92 : grande.length <= 3 ? 68 : 52) * (baixa ? 0.85 : 1);
  return (
    <svg viewBox={`0 0 320 ${H}`} role="img" aria-label={titulo ?? `${rotulo} ${grande}`} preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={`${id}l`} cx="0.85" cy="0.15" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}p`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height={H} fill={`url(#${id}f)`} />
      <rect width="320" height={H} fill={`url(#${id}p)`} />
      <rect width="320" height={H} fill={`url(#${id}l)`} />
      {/* anel de relógio (marca "15") */}
      <g transform={`translate(250 ${cy}) scale(${baixa ? 0.8 : 1})`} fill="none" stroke="#fff">
        <circle r="66" strokeOpacity="0.14" strokeWidth="10" />
        <path d="M0 -66 A66 66 0 0 1 66 0" stroke={c3} strokeOpacity="0.9" strokeWidth="10" strokeLinecap="round" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="0" y1="-48" x2="0" y2={i % 3 === 0 ? -40 : -44} strokeOpacity="0.35" strokeWidth="2" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      {grande && (
        <text x="250" y={cy + tamanho * 0.35} textAnchor="middle" fill="#fff" fontFamily="Montserrat, Arial, sans-serif"
          fontWeight="800" fontSize={tamanho} letterSpacing="-2">{grande}</text>
      )}
      {/* ícone do assunto */}
      <rect x="22" y="22" width="52" height="52" rx="14" fill="#fff" fillOpacity="0.14" stroke="#fff" strokeOpacity="0.25" />
      <g transform="translate(32 32) scale(1.333)" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </g>
      <text x="24" y={H - 32} fill={c3} fontFamily="Montserrat, Arial, sans-serif" fontWeight="700" fontSize="13" letterSpacing="2.4">
        {rotulo.toUpperCase()}
      </text>
      <rect x="24" y={H - 23} width="34" height="4" rx="2" fill={c3} />
    </svg>
  );
}
