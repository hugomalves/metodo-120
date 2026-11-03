'use client';

import { useEffect, useState } from 'react';
import styles from './Carrossel.module.css';

export type Destaque = {
  tag: string;
  kicker: string;
  curto: string;
  titulo: string;
  texto: string;
  cta: string;
  href: string;
  preco: string;
  grande: string;
  fundo: string;
};

export function Carrossel({ itens }: { itens: Destaque[] }) {
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mouse, setMouse] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPausado(true);
  }, []);

  useEffect(() => {
    if (pausado || mouse || itens.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % itens.length), 6000);
    return () => clearInterval(t);
  }, [pausado, mouse, itens.length]);

  if (!itens.length) return null;
  const d = itens[i];

  return (
    <section
      aria-labelledby="mais"
      className={styles.secao}
      onMouseEnter={() => setMouse(true)}
      onMouseLeave={() => setMouse(false)}
    >
      <div className={styles.cabeca}>
        <h2 id="mais" className="display" style={{ margin: 0, fontSize: 26 }}>
          Mais do Gabarito em 15
        </h2>
        <div className={styles.controles}>
          <span className="mono suave" style={{ fontSize: 13 }}>
            {i + 1} / {itens.length}
          </span>
          <button className={styles.redondo} aria-label="Anterior" onClick={() => setI((i + itens.length - 1) % itens.length)}>
            ‹
          </button>
          <button className="btn btn-linha" onClick={() => setPausado(!pausado)}>
            {pausado ? 'Retomar' : 'Pausar'}
          </button>
          <button className={styles.redondo} aria-label="Próximo" onClick={() => setI((i + 1) % itens.length)}>
            ›
          </button>
        </div>
      </div>

      <div className={styles.pontos} role="tablist" aria-label="Escolher destaque">
        {itens.map((x, j) => (
          <button
            key={x.curto}
            role="tab"
            aria-selected={j === i}
            aria-label={`Mostrar: ${x.curto}`}
            onClick={() => setI(j)}
            className={styles.ponto}
          >
            <span style={{ background: j === i ? 'var(--ciano)' : 'var(--linha-forte)' }} />
          </button>
        ))}
      </div>

      <article className={`cartao-gradiente ${styles.slide}`} style={{ background: d.fundo }}>
        <div className={styles.texto}>
          <span className="rotulo">
            {d.tag} · {d.kicker}
          </span>
          <h3 className="display" style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 38px)', lineHeight: 1.08 }}>
            {d.titulo}
          </h3>
          <p style={{ margin: 0, fontSize: 17, color: 'var(--texto-2)', maxWidth: '52ch' }}>{d.texto}</p>
          <div className="linha-flex">
            <a href={d.href} className="btn btn-ciano">
              {d.cta}
            </a>
            <span className="mono" style={{ fontSize: 14 }}>
              {d.preco}
            </span>
          </div>
        </div>
        <div className={styles.relogio} aria-hidden="true">
          <div>
            <span className="display">{d.grande}</span>
          </div>
        </div>
      </article>

      <div className="grade" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        {itens.map((x, j) => (
          <button
            key={x.curto}
            onClick={() => setI(j)}
            className={styles.mini}
            style={{ borderColor: j === i ? 'var(--ciano)' : 'var(--linha)' }}
          >
            <span className="rotulo" style={{ fontSize: 11 }}>
              {x.tag}
            </span>
            <span className="display" style={{ fontSize: 17, fontWeight: 700 }}>
              {x.curto}
            </span>
            <span className="suave" style={{ fontSize: 14 }}>
              {x.preco}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
