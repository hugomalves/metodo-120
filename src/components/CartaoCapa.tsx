import Link from 'next/link';
import type { ReactNode } from 'react';
import { Capa, type TipoCapa } from '@/components/Capa';

// Cartão com capa em cima e texto embaixo, tudo dentro do mesmo quadrado.
// A capa é a imagem enviada pelo professor (imagem) ou a capa automática da marca.
export function CartaoCapa({
  href, imagem, tipo, rotulo, destaque, icone, competencia, sobretitulo, titulo, texto, selo, children, rodape, compacto,
}: {
  href?: string; imagem?: string | null; tipo: TipoCapa; rotulo: string; destaque?: string; icone?: string; competencia?: number;
  sobretitulo?: string; titulo: string; texto?: ReactNode; selo?: ReactNode; children?: ReactNode; rodape?: ReactNode; compacto?: boolean;
}) {
  const capa = (
    <span className={`cc-capa${compacto ? ' cc-capa-baixa' : ''}`}>
      {imagem
        ? <img src={imagem} alt="" loading="lazy" />
        : <Capa tipo={tipo} rotulo={rotulo} destaque={destaque} icone={icone} competencia={competencia} titulo={titulo} baixa={compacto} />}
      {selo && <span className="cc-selo">{selo}</span>}
    </span>
  );
  return (
    <article className="cc">
      {href ? <Link href={href} className="cc-link-capa" tabIndex={-1} aria-hidden="true">{capa}</Link> : capa}
      <div className="cc-corpo">
        {sobretitulo && <span className="cc-sobre">{sobretitulo}</span>}
        <h3 className="cc-titulo">{href ? <Link href={href}>{titulo}</Link> : titulo}</h3>
        {texto && <p className="cc-texto">{texto}</p>}
        {children}
        {rodape && <div className="cc-rodape">{rodape}</div>}
      </div>
    </article>
  );
}

export function BarraProgresso({ pct, rotulo }: { pct: number; rotulo?: string }) {
  return (
    <span className="cc-progresso" role="img" aria-label={rotulo ?? `${pct}% concluído`}>
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  );
}
