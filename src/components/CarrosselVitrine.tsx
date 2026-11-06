'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo120 } from '@/components/Marca';
import styles from './CarrosselVitrine.module.css';

export type SlideNoticia = { id: string; rotulo: string | null; titulo: string; resumo: string | null; link: string | null; botao: string | null; imagem: string | null };

// Destaque principal da vitrine: apresentação do Método 120 + notícias que passam sozinhas
export function CarrosselVitrine({ noticias, fotoExpert, nomeExpert, ctaHref, ctaTexto }: {
  noticias: SlideNoticia[]; fotoExpert: string; nomeExpert: string; ctaHref: string; ctaTexto: string;
}) {
  const total = noticias.length + 1;
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [mouse, setMouse] = useState(false);

  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPausado(true); }, []);
  useEffect(() => {
    if (pausado || mouse || total < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % total), 7000);
    return () => clearTimeout(t);
  }, [i, pausado, mouse, total]);

  const ir = (n: number) => setI(((n % total) + total) % total);
  const parado = pausado || mouse;

  return (
    <section className={`tema-escuro ${styles.carrossel}`} aria-roledescription="carrossel" aria-label="Destaques do Método 120"
      onMouseEnter={() => setMouse(true)} onMouseLeave={() => setMouse(false)} onFocus={() => setMouse(true)} onBlur={() => setMouse(false)}>
      <div className={styles.palco}>
        {/* slide 1: apresentação */}
        <div className={styles.slide} data-ativo={i === 0 ? 'sim' : undefined} aria-hidden={i !== 0} role="group" aria-roledescription="slide" aria-label={`1 de ${total}`}>
          <div className={styles.texto}>
            <Logo120 tamanho={78} slogan />
            <h1 className="display">Carreiras policiais com plano de estudo feito para o seu edital</h1>
            <p>Cerca de 2 horas por dia: teoria, questões da banca e revisão, na ordem certa até o dia da prova.</p>
            <div className="linha-flex">
              <Link href={ctaHref} className="btn btn-azul btn-grande" tabIndex={i === 0 ? 0 : -1}>{ctaTexto}</Link>
              <a href="#editais" className="btn btn-linha btn-grande" tabIndex={i === 0 ? 0 : -1}>Ver editais</a>
            </div>
          </div>
          <div className={styles.foto}><img src={fotoExpert} alt={nomeExpert} width={900} height={900} /></div>
        </div>

        {noticias.map((n, k) => {
          const ativo = i === k + 1;
          const externo = n.link?.startsWith('http');
          return (
            <div key={n.id} className={styles.slide} data-ativo={ativo ? 'sim' : undefined} aria-hidden={!ativo} role="group" aria-roledescription="slide" aria-label={`${k + 2} de ${total}`}>
              <div className={styles.texto}>
                {n.rotulo && <span className={styles.etiqueta}>{n.rotulo}</span>}
                <h2 className="display">{n.titulo}</h2>
                {n.resumo && <p>{n.resumo}</p>}
                {n.link && (
                  <a href={n.link} className="btn btn-azul btn-grande" tabIndex={ativo ? 0 : -1} {...(externo ? { target: '_blank', rel: 'noopener' } : {})}>
                    {n.botao || 'Saiba mais'}
                  </a>
                )}
              </div>
              <div className={styles.foto} data-tipo={n.imagem ? 'noticia' : 'expert'}>
                <img src={n.imagem ?? fotoExpert} alt="" loading="lazy" />
              </div>
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className={styles.controles}>
          <button type="button" onClick={() => ir(i - 1)} aria-label="Destaque anterior" className={styles.seta}>‹</button>
          <div className={styles.pontos} role="tablist" aria-label="Escolher destaque">
            {Array.from({ length: total }, (_, k) => (
              <button key={k} type="button" role="tab" aria-selected={i === k} aria-label={`Destaque ${k + 1}`} onClick={() => ir(k)}
                className={styles.ponto} data-ativo={i === k ? 'sim' : undefined}>
                {i === k && !parado && <span key={i} className={styles.progresso} />}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => ir(i + 1)} aria-label="Próximo destaque" className={styles.seta}>›</button>
          <button type="button" onClick={() => setPausado((p) => !p)} className={styles.pausa} aria-label={pausado ? 'Continuar a passar sozinho' : 'Pausar'}>
            {pausado ? '▶' : '❚❚'}
          </button>
        </div>
      )}
    </section>
  );
}
