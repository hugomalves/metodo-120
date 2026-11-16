'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Cronômetro de estudo do topo da área do aluno. Continua contando se você trocar de página
// (fica guardado no navegador). "Registrar" abre o quadro Registrar estudo já com o tempo.
type Estado = { inicio: number | null; acumulado: number };
const CHAVE = 'm120-cronometro';
const ler = (): Estado => {
  try {
    const x = JSON.parse(localStorage.getItem(CHAVE) ?? '');
    if (x && typeof x.acumulado === 'number') return { inicio: typeof x.inicio === 'number' ? x.inicio : null, acumulado: x.acumulado };
  } catch { /* sem armazenamento: começa do zero */ }
  return { inicio: null, acumulado: 0 };
};
const gravar = (e: Estado) => { try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch { /* ignora */ } };
const fmt = (ms: number) => {
  const t = Math.floor(ms / 1000);
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

const Svg = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

export function Cronometro() {
  const router = useRouter();
  const [e, setE] = useState<Estado>({ inicio: null, acumulado: 0 });
  const [agora, setAgora] = useState(0);

  useEffect(() => { setE(ler()); setAgora(Date.now()); }, []);
  useEffect(() => {
    if (e.inicio == null) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [e.inicio]);

  const total = e.acumulado + (e.inicio != null ? Math.max(0, agora - e.inicio) : 0);
  const mudar = (x: Estado) => { setE(x); gravar(x); setAgora(Date.now()); };
  const rodando = e.inicio != null;

  return (
    <div className="crono" data-rodando={rodando ? 'sim' : 'nao'} role="group" aria-label="Cronômetro de estudo">
      <button type="button" onClick={() => mudar(rodando ? { inicio: null, acumulado: total } : { inicio: Date.now(), acumulado: e.acumulado })}
        aria-label={rodando ? 'Pausar' : 'Começar'} title={rodando ? 'Pausar' : 'Começar a estudar'}>
        <Svg d={rodando ? 'M8 5v14M16 5v14' : 'M7 4l13 8-13 8z'} />
      </button>
      <span className="crono-tempo" aria-live="off">{fmt(total)}</span>
      <button type="button" onClick={() => mudar({ inicio: null, acumulado: 0 })} disabled={!total} aria-label="Zerar" title="Zerar">
        <Svg d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" />
      </button>
      <button type="button" className="crono-registrar" disabled={total < 60000}
        title={total < 60000 ? 'Estude pelo menos 1 minuto para registrar' : 'Registrar este tempo no cronograma'}
        onClick={() => {
          const minutos = Math.round(total / 60000);
          mudar({ inicio: null, acumulado: 0 });
          router.push(`/aluno/cronograma?registrar=${minutos}`);
        }}>
        <Svg d="M5 12l5 5L20 7" /><span>Registrar</span>
      </button>
    </div>
  );
}
