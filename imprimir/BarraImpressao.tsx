'use client';

import { useEffect } from 'react';
import s from './imprimir.module.css';

// Barra que só aparece na tela (some na impressão) e ajusta os recortes largos para ocupar as duas colunas
export function BarraImpressao({ voltar }: { voltar: string }) {
  useEffect(() => {
    const marcar = (img: HTMLImageElement) => { if (img.naturalWidth > 800) img.closest('[data-questao]')?.setAttribute('data-larga', 'sim'); };
    document.querySelectorAll<HTMLImageElement>('[data-questao] img').forEach((img) => {
      if (img.complete) marcar(img); else img.addEventListener('load', () => marcar(img), { once: true });
    });
  }, []);
  return (
    <div className={s.barra}>
      <a href={voltar} className={s.botaoLinha}>← Voltar para a lista</a>
      <span className={s.dica}>No destino da impressão, escolha <b>Salvar como PDF</b> para guardar o arquivo.</span>
      <button type="button" className={s.botao} onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
    </div>
  );
}
