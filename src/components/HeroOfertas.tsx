'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './HeroOfertas.module.css';

export type Oferta = {
  id: string; selo: string; titulo: string; preco: string | null; beneficios: string[];
  href: string | null; botao: string; imagem: string | null; emBreve?: boolean;
};

// Topo da página inicial: ofertas passando da direita para a esquerda. A do meio é a principal; as dos lados aparecem mais apagadas.
// Passa sozinha a cada 5 s; o visitante pode escolher (setas, bolinhas ou clicando numa lateral) e pausar.
export function HeroOfertas({ ofertas }: { ofertas: Oferta[] }) {
  const n = ofertas.length;
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reduzido, setReduzido] = useState(false);
  const [parou, setParou] = useState(false); // o visitante apertou "pausar"

  useEffect(() => { setReduzido(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  useEffect(() => {
    if (n < 2 || pausado || parou || reduzido) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, pausado, parou, reduzido, i]);

  // posição de cada oferta em relação à do meio: -1 esquerda, 0 meio, 1 direita, 2 (fora, à direita, esperando a vez)
  const posicao = (k: number) => { const d = (k - i + n) % n; return d === n - 1 ? -1 : d > 1 ? 2 : d; };
  const ir = (k: number) => setI(((k % n) + n) % n);

  return (
    <div className={styles.palco} onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)} onFocus={() => setPausado(true)} onBlur={() => setPausado(false)} role="region" aria-roledescription="carrossel" aria-label="Ofertas">
      <div className={styles.pista}>
        {ofertas.map((o, k) => {
          const p = posicao(k);
          return (
            <article key={o.id} className={styles.cartao} data-pos={p} data-breve={o.emBreve ? 'sim' : undefined}
              aria-hidden={p !== 0} onClick={() => p !== 0 && ir(k)}>
              <div className={styles.foto} style={o.imagem ? { backgroundImage: `url(${o.imagem})` } : undefined}>
                {!o.imagem && <span>{o.emBreve ? 'Em breve' : 'Foto em breve'}</span>}
              </div>
              <div className={styles.corpo}>
                <span className={styles.selo}>{o.selo}</span>
                <h2 className={`display ${styles.titulo}`}>{o.titulo}</h2>
                {o.preco && <p className={styles.preco}>{o.preco}</p>}
                {o.beneficios.length > 0 && <ul className={styles.lista}>{o.beneficios.slice(0, 5).map((b) => <li key={b}>{b}</li>)}</ul>}
                {o.href && !o.emBreve
                  ? <Link href={o.href} className={`btn-claro grande ${styles.botao}`} tabIndex={p === 0 ? 0 : -1}><span>{o.botao}</span><i>→</i></Link>
                  : <span className={styles.breve}>{o.botao}</span>}
              </div>
            </article>
          );
        })}
      </div>
      {n > 1 && (
        <div className={styles.controles}>
          <button type="button" onClick={() => ir(i - 1)} aria-label="Oferta anterior">←</button>
          <div className={styles.pontos}>{ofertas.map((o, k) => <button key={o.id} type="button" data-on={k === i ? 'sim' : undefined} onClick={() => ir(k)} aria-label={`Ir para ${o.titulo}`} />)}</div>
          <button type="button" onClick={() => ir(i + 1)} aria-label="Próxima oferta">→</button>
          <button type="button" className={styles.pausa} onClick={() => setParou((v) => !v)} aria-pressed={parou}>{parou ? '▶ Continuar' : '❚❚ Pausar'}</button>
        </div>
      )}
    </div>
  );
}
