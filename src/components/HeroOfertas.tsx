'use client';

import { useEffect, useState, type ReactNode } from 'react';
import styles from './HeroOfertas.module.css';

export type SlideTopo = { id: string; rotulo: string; conteudo: ReactNode };

// Topo da página inicial. O slide do meio ocupa a largura toda do site (a principal é a do expert); os dos lados aparecem mais apagados nos espaços laterais.
// Passa sozinho a cada 5 s, da direita para a esquerda. O visitante escolhe (setas, bolinhas ou clicando num lado) e pode pausar.
export function HeroOfertas({ slides }: { slides: SlideTopo[] }) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [parou, setParou] = useState(false);
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => { setReduzido(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  useEffect(() => {
    if (n < 2 || pausado || parou || reduzido) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, pausado, parou, reduzido, i]);

  // -1 esquerda · 0 meio · 1 direita · 2 e -2 fora da tela (esperando a vez)
  const pos = (k: number) => { const d = (k - i + n) % n; return d === 0 ? 0 : d === 1 ? 1 : d === n - 1 ? -1 : d === 2 ? 2 : -2; };
  const ir = (k: number) => setI(((k % n) + n) % n);

  return (
    <div className={styles.palco} onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} onFocus={() => setPausado(true)} onBlur={() => setPausado(false)} role="region" aria-roledescription="carrossel" aria-label="Destaques">
      <div className={styles.pista}>
        {slides.map((s, k) => {
          const p = pos(k);
          return (
            <div key={s.id} className={styles.slide} data-pos={p} inert={p !== 0} aria-hidden={p !== 0}
              onClick={p === 1 || p === -1 ? () => ir(k) : undefined}>
              {s.conteudo}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <div className={styles.controles}>
          <button type="button" onClick={() => ir(i - 1)} aria-label="Anterior">←</button>
          <div className={styles.pontos}>{slides.map((s, k) => <button key={s.id} type="button" data-on={k === i ? 'sim' : undefined} onClick={() => ir(k)} aria-label={`Ir para ${s.rotulo}`} />)}</div>
          <button type="button" onClick={() => ir(i + 1)} aria-label="Próximo">→</button>
          <button type="button" className={styles.pausa} onClick={() => setParou((v) => !v)} aria-pressed={parou}>{parou ? '▶ Continuar' : '❚❚ Pausar'}</button>
        </div>
      )}
    </div>
  );
}
