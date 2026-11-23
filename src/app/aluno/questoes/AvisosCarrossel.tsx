'use client';

import { useEffect, useState } from 'react';
import s from './banco.module.css';

export type Aviso = { id: string; titulo: string; texto: string | null; link_url: string | null; link_texto: string | null };

// Quadro de avisos: um aviso por vez, passa sozinho a cada 7 s (para quando o aluno usa as setas)
export function AvisosCarrossel({ avisos }: { avisos: Aviso[] }) {
  const [i, setI] = useState(0);
  const [parado, setParado] = useState(false);
  const n = avisos.length;
  useEffect(() => {
    if (n < 2 || parado) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, parado]);
  const a = avisos[i % n];
  const ir = (x: number) => { setParado(true); setI((x + n) % n); };
  return (
    <div className={s.aviso} role="group" aria-roledescription="aviso" aria-label={`Aviso ${(i % n) + 1} de ${n}`}>
      {n > 1 && <button type="button" className={`${s.seta} ${s.setaEsq}`} onClick={() => ir(i - 1)} aria-label="Aviso anterior">‹</button>}
      <div className={s.avisoConteudo} aria-live="polite">
        <span className={s.avisoRotulo}>Avisos</span>
        <b>{a.titulo}</b>
        {a.texto && <p>{a.texto}</p>}
        {a.link_url && <a href={a.link_url} className={s.avisoLink}>{a.link_texto || 'Saiba mais'}</a>}
      </div>
      {n > 1 && <button type="button" className={`${s.seta} ${s.setaDir}`} onClick={() => ir(i + 1)} aria-label="Próximo aviso">›</button>}
      {n > 1 && (
        <div className={s.pontos}>
          {avisos.map((x, k) => <button key={x.id} type="button" aria-label={`Ir para o aviso ${k + 1}`} aria-current={k === i % n || undefined} onClick={() => ir(k)} />)}
        </div>
      )}
    </div>
  );
}
