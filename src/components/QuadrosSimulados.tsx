import type { QuadroSimulado } from '@/lib/loja';
import { Cadeado } from '@/components/CartaoProduto';

export function QuadrosSimulados({ itens }: { itens: QuadroSimulado[] }) {
  return (
    <div className="quadros">
      {itens.map((x) => (
        <a key={x.id} href={x.href} className="quadro" data-bloqueado={x.pode ? undefined : 'sim'} {...(x.externo ? { target: '_blank', rel: 'noopener' } : {})}>
          <span className="quadro-selo">{x.selo}</span>
          <b>{x.titulo}</b>
          <span>{x.n} questões{x.preco ? ` · libere por ${x.preco}` : ''}</span>
          {!x.pode && <span className="quadro-cadeado"><Cadeado /></span>}
          <span className="quadro-num" aria-hidden="true">{x.num}</span>
        </a>
      ))}
    </div>
  );
}
