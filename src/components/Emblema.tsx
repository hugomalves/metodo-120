import type { Faixa, Forma } from '@/lib/conquistas';

function poligono(lados: number, r: number) {
  return Array.from({ length: lados }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / lados;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function estrela(r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI * i) / 5;
    const raio = i % 2 === 0 ? r : r * 0.5;
    return `${(50 + raio * Math.cos(a)).toFixed(1)},${(50 + raio * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

const PONTOS: Record<Forma, string> = {
  triangulo: poligono(3, 44),
  quadrado: poligono(4, 42),
  pentagono: poligono(5, 42),
  hexagono: poligono(6, 42),
  estrela: estrela(46),
};

// Emblema de sequência: forma geométrica com o número de dias no centro
export function Emblema({ forma, cor, texto, ganho, tamanho = 72 }: { forma: Forma; cor: string; texto: string; ganho: boolean; tamanho?: number }) {
  const y = forma === 'triangulo' ? 62 : 55;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true">
      <polygon
        points={PONTOS[forma]}
        fill={ganho ? cor : 'transparent'}
        stroke={ganho ? '#ffffff' : '#2a4785'}
        strokeWidth={ganho ? 3 : 2.5}
        strokeDasharray={ganho ? undefined : '6 5'}
        strokeLinejoin="round"
      />
      <text x="50" y={y} textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontWeight="800"
        fontSize={texto.length > 2 ? 20 : 24} fill={ganho ? '#03102E' : '#6f84b3'}>{texto}</text>
    </svg>
  );
}

// Medalha do nível de estudo: forma e cor da faixa (Bronze, Prata, Ouro, Diamante, Ultra Pro Max) com o número do nível
export function MedalhaNivel({ faixa, rotulo, tamanho = 56, apagada = false }: { faixa: Faixa; rotulo: string; tamanho?: number; apagada?: boolean }) {
  const pontos =
    faixa.forma === 'diamante' ? '50,4 94,50 50,96 6,50' :
    faixa.forma === 'estrela' ? estrela(48) : '';
  const id = `brilho-${faixa.forma}-${faixa.de}`;
  const fundo = faixa.forma === 'estrela' ? `url(#${id})` : faixa.cor;
  const fonte = rotulo.length > 2 ? 22 : 28;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" aria-hidden="true" style={{ opacity: apagada ? 0.35 : 1 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD27A" /><stop offset="0.5" stopColor="#FF8A4C" /><stop offset="1" stopColor="#7A6BFF" />
        </linearGradient>
      </defs>
      {faixa.forma === 'escudo' ? (
        <path d="M50 5 L89 17 V47 C89 71 72 88 50 96 C28 88 11 71 11 47 V17 Z" fill={fundo} stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <polygon points={pontos} fill={fundo} stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
      )}
      <text x="50" y={faixa.forma === 'escudo' ? 59 : 59} textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontWeight="800"
        fontSize={fonte} fill={faixa.texto}>{rotulo}</text>
    </svg>
  );
}
