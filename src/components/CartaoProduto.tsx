import Link from 'next/link';
import type { Produto } from '@/lib/loja';

// Cartão de um produto da loja: o que tem, preço e botão de compra (ou "Acessar", se já comprou)
export function CartaoProduto({ p, meu, acessar }: { p: Produto; meu: boolean; acessar?: string }) {
  const externo = !!p.checkout_url;
  return (
    <article className="produto" data-destaque={p.destaque ? 'sim' : undefined} data-meu={meu ? 'sim' : undefined}>
      {(p.selo || meu) && <span className="produto-selo">{meu ? 'Você já tem' : p.selo}</span>}
      <h3 className="display">{p.nome}</h3>
      {p.descricao && <p>{p.descricao}</p>}
      {p.beneficios.length > 0 && <ul>{p.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>}
      <div className="produto-rodape">
        {meu ? (
          <Link href={acessar ?? '/aluno'} className="btn btn-azul">Acessar</Link>
        ) : (
          <>
            {p.preco && <b className="produto-preco">{p.preco}</b>}
            <a href={p.checkout_url ?? '#'} className="btn btn-vermelho" {...(externo ? { target: '_blank', rel: 'noopener' } : {})}
              aria-disabled={!externo}>{externo ? 'Quero este' : 'Em breve'}</a>
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
