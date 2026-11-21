'use client';

import { useState } from 'react';
import s from './banco.module.css';

export type Aviso = { id: string; titulo: string; texto: string | null; link_url: string | null; link_texto: string | null };

// Quadro de avisos: um aviso por vez, com setas
export function AvisosCarrossel({ avisos }: { avisos: Aviso[] }) {
  const [i, setI] = useState(0);
  const a = avisos[i % avisos.length];
  return (
    <>
      <div className={s.aviso} role="group" aria-roledescription="aviso" aria-label={`Aviso ${(i % avisos.length) + 1} de ${avisos.length}`}>
        <b>{a.titulo}</b>
        {a.texto && <p>{a.texto}</p>}
        {a.link_url && <a href={a.link_url} className={s.avisoLink}>{a.link_texto || 'Saiba mais'}</a>}
      </div>
      {avisos.length > 1 && (
        <div className={s.setasAviso}>
          <button type="button" onClick={() => setI((x) => (x + avisos.length - 1) % avisos.length)} aria-label="Aviso anterior">‹</button>
          <button type="button" onClick={() => setI((x) => (x + 1) % avisos.length)} aria-label="Próximo aviso">›</button>
        </div>
      )}
    </>
  );
}
