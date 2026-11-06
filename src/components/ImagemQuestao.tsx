'use client';

import { useEffect, useRef, useState } from 'react';

// Os recortes das provas são gerados a 150 dpi. Exibidos 1:1 (ou esticados até a largura
// do cartão) o texto fica enorme. Aqui a imagem aparece numa escala próxima à do texto
// do site, nunca maior que a largura disponível, e um toque abre o original para ampliar.
const ESCALA = 0.64;

export function ImagemQuestao({ src, alt, escala = ESCALA, semLink = false }: { src: string; alt: string; escala?: number; semLink?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [largura, setLargura] = useState<number | null>(null);

  const medir = () => {
    const img = ref.current;
    // recortes de página inteira (tabelas, gráficos largos) têm letra menor na prova: ganham mais espaço
    if (img && img.naturalWidth) setLargura(Math.round(img.naturalWidth * (escala === ESCALA && img.naturalWidth > 800 ? 0.85 : escala)));
  };

  // se a imagem já veio do cache antes da hidratação, o onLoad não dispara
  useEffect(() => {
    if (ref.current?.complete) medir();
  }, [src]);

  const largura_css = largura ? `min(${largura}px, 100%)` : 'min(400px, 100%)';
  const imagem = (
    <img ref={ref} src={src} alt={alt} onLoad={medir}
      style={{ display: 'block', width: semLink ? largura_css : '100%', maxWidth: '100%', height: 'auto', borderRadius: 4, background: '#fff' }} />
  );
  if (semLink) return imagem;
  return (
    <a href={src} target="_blank" rel="noopener" title="Abrir a imagem em tamanho original"
      style={{ display: 'block', width: largura_css, maxWidth: '100%', cursor: 'zoom-in' }}>
      {imagem}
    </a>
  );
}
