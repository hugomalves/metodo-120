import Link from 'next/link';
import { MARCA } from '@/lib/marca';

// Logo do Método 120 em texto (nítido em qualquer tamanho): MÉTODO pequeno, 120 grande, o 0 em azul e a seta subindo
export function Logo120({ tamanho = 44, slogan = false, linha = false }: { tamanho?: number; slogan?: boolean; linha?: boolean }) {
  return (
    <span className={`logo120${linha ? ' logo120-linha' : ''}`} style={{ fontSize: tamanho }} aria-label={`${MARCA.nome}. ${MARCA.slogan}`} role="img">
      <span className="logo120-metodo" aria-hidden="true">MÉTODO</span>
      <span className="logo120-num" aria-hidden="true">
        12<i>0</i>
        <svg className="logo120-seta" viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="seta120" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#0B5CFF" stopOpacity="0" />
              <stop offset="0.35" stopColor="#0B5CFF" />
              <stop offset="1" stopColor="#38A9FF" />
            </linearGradient>
          </defs>
          {/* faixa que nasce fina embaixo do 12, atravessa o 0 e engrossa até a ponta da seta */}
          <path d="M0 58 C 38 57, 72 44, 99 19 L 94 13 L 116 5 L 110 27 L 105 22 C 78 50, 40 61, 0 58 Z" fill="url(#seta120)" />
        </svg>
      </span>
      {slogan && <span className="logo120-slogan" aria-hidden="true">ESTUDE CERTO. EVOLUA. <b>APROVE.</b></span>}
    </span>
  );
}

export function Marca({ href = '/', tamanho = 40 }: { href?: string; tamanho?: number }) {
  return (
    <Link href={href} className="marca" aria-label={`${MARCA.nome}, página inicial`}>
      <Logo120 tamanho={tamanho} />
    </Link>
  );
}
