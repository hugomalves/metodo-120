import Link from 'next/link';
import { urlImagemProduto, type Produto } from '@/lib/loja';

const TIPO: Record<string, string> = { curso: 'Curso em PDF', simulados: 'Simulados', mentoria: 'Mentoria', banco: 'Banco de questões' };

// Sem imagem cadastrada: quadrado com o nome da carreira (o que vem depois do último "·" no nome do produto)
function textoDaCapa(p: Produto) {
  const partes = p.nome.split('·').map((x) => x.trim()).filter(Boolean);
  return { grande: partes[partes.length - 1] ?? p.nome, pequeno: TIPO[p.tipo] ?? '' };
}

// Cartão de um produto da loja: imagem quadrada e título embaixo; ao passar o mouse, desce a descrição e a lista do que está incluído (o mesmo texto da página do curso).
// O cartão inteiro abre a página do curso (preço e botão de compra ficam lá); no celular a descrição fica sempre visível.
export function CartaoProduto({ p, meu, acessar }: { p: Produto; meu: boolean; acessar?: string }) {
  const detalhe = meu ? acessar ?? '/aluno' : `/curso/${p.slug}`;
  const imagem = urlImagemProduto(p.imagem_path);
  const capa = textoDaCapa(p);
  return (
    <article className="produto" data-destaque={p.destaque ? 'sim' : undefined} data-meu={meu ? 'sim' : undefined}>
      <div className="produto-capa">
        {imagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagem} alt="" loading="lazy" />
        ) : (
          <div className="produto-capa-vazia"><b className="display">{capa.grande}</b><span>{capa.pequeno}</span></div>
        )}
        {(p.selo || meu) && <span className="produto-selo">{meu ? 'Você já tem' : p.selo}</span>}
      </div>
      <h3 className="display"><Link href={detalhe} className="produto-link">{p.nome}</Link></h3>
      {(p.descricao || p.beneficios.length > 0) && (
        <Link href={detalhe} className="produto-desc" tabIndex={-1} aria-hidden="true">
          {p.descricao && <p>{p.descricao}</p>}
          {p.beneficios.length > 0 && <ul>{p.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>}
        </Link>
      )}
    </article>
  );
}

// quadrado com cadeado (simulado, minissimulado ou aula ainda não comprados)
export function Cadeado() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
