import Link from 'next/link';
import type { Produto } from '@/lib/loja';

// Cartão de um produto da loja: o cartão inteiro abre a página do curso;
// o botão leva direto para a compra (ou "Acessar", se o aluno já tem)
export function CartaoProduto({ p, meu, acessar }: { p: Produto; meu: boolean; acessar?: string }) {
  const detalhe = meu ? acessar ?? '/aluno' : `/curso/${p.slug}`;
  return (
    <article className="produto" data-destaque={p.destaque ? 'sim' : undefined} data-meu={meu ? 'sim' : undefined}>
      {(p.selo || meu) && <span className="produto-selo">{meu ? 'Você já tem' : p.selo}</span>}
      <h3 className="display"><Link href={detalhe} className="produto-link">{p.nome}</Link></h3>
      {p.descricao && <p>{p.descricao}</p>}
      {p.beneficios.length > 0 && <ul>{p.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>}
      <div className="produto-rodape">
        {meu ? (
          <Link href={acessar ?? '/aluno'} className="btn btn-azul">Acessar</Link>
        ) : (
          <>
            {p.preco ? <b className="produto-preco">{p.preco}</b> : <span className="suave">Em breve</span>}
            {p.checkout_url
              ? <a href={p.checkout_url} className="btn btn-vermelho" target="_blank" rel="noopener">Quero este</a>
              : <Link href={detalhe} className="btn btn-linha">Ver detalhes</Link>}
          </>
        )}
      </div>
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
