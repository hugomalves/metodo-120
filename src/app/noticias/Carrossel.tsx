'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './noticias.module.css';

export type Manchete = { id: string; titulo: string; resumo: string | null; fonte: string | null; data: string; imagem: string | null };

// Quadrado de uma carreira: imagem, título em cima e texto curto embaixo. As notícias giram sozinhas (a cada 6 s; pausa ao passar o mouse).
export function Carrossel({ chave, nome, descricao, itens }: { chave: string; nome: string; descricao: string; itens: Manchete[] }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  useEffect(() => {
    if (pausa || itens.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % itens.length), 6000);
    return () => clearInterval(t);
  }, [pausa, itens.length]);
  const n = itens[i];
  return (
    <article className={`${styles.quadro} ${styles.corte}`} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <div className={styles.cabecaQuadro}><span className="rotulo">{nome}</span><p className={styles.desc}>{descricao}</p></div>
      {n ? (
        <div className={styles.cartaoNoticia} key={n.id}>
          <Link href={`/noticias/n/${n.id}`} className={styles.foto} style={n.imagem ? { backgroundImage: `url(${n.imagem})` } : undefined} aria-label={n.titulo}>
            <span className={styles.titulo}>{n.titulo}</span>
          </Link>
          {n.resumo && <p className={styles.resumo}>{n.resumo}</p>}
          <small className={styles.fonte}>Fonte: {n.fonte ?? 'imprensa'} · {new Date(n.data).toLocaleDateString('pt-BR')}</small>
          <Link href={`/noticias/n/${n.id}`} className={styles.saibaMais}>Saiba mais →</Link>
        </div>
      ) : <p className="suave" style={{ flex: 1 }}>As notícias aparecem aqui assim que a busca rodar.</p>}
      {itens.length > 1 && <div className={styles.pontos} aria-hidden="true">{itens.slice(0, 8).map((m, k) => <i key={m.id} data-on={k === i % 8 ? 'sim' : undefined} />)}</div>}
      <Link href={`/noticias/${chave}`} className={styles.preparar}>Quer se preparar melhor? Ver cursos →</Link>
    </article>
  );
}
