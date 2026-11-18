'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './noticias.module.css';

export type Manchete = { id: string; titulo: string; fonte: string | null; url: string; data: string };

// Quadrado de uma carreira: as manchetes giram sozinhas (a cada 5 s; pausa ao passar o mouse)
export function Carrossel({ chave, nome, descricao, itens }: { chave: string; nome: string; descricao: string; itens: Manchete[] }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  useEffect(() => {
    if (pausa || itens.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % itens.length), 5000);
    return () => clearInterval(t);
  }, [pausa, itens.length]);
  const n = itens[i];
  return (
    <article className={`${styles.quadro} ${styles.corte}`} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <span className="rotulo">{nome}</span>
      <p className={styles.desc}>{descricao}</p>
      <div className={styles.manchete} aria-live="polite">
        {n ? (
          <>
            <a href={n.url} target="_blank" rel="noopener noreferrer" className={styles.titulo} key={n.id}>{n.titulo}</a>
            <small>{n.fonte ?? 'Notícia'} · {new Date(n.data).toLocaleDateString('pt-BR')}</small>
          </>
        ) : <span className="suave">As notícias aparecem aqui assim que a busca rodar.</span>}
      </div>
      {itens.length > 1 && (
        <div className={styles.pontos} aria-hidden="true">{itens.slice(0, 8).map((m, k) => <i key={m.id} data-on={k === i % 8 ? 'sim' : undefined} />)}</div>
      )}
      <Link href={`/noticias/${chave}`} className={styles.preparar}>Quer se preparar melhor? Ver cursos →</Link>
    </article>
  );
}
