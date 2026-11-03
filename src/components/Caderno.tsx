import Link from 'next/link';
import type { QuestaoCompleta } from '@/lib/questao';
import { CartaoQuestao } from '@/components/CartaoQuestao';
import { SeletorPorPagina } from '@/components/SeletorPorPagina';

function junta(base: string, extra: Record<string, string | number>) {
  const [caminho, q] = base.split('?');
  const p = new URLSearchParams(q ?? '');
  Object.entries(extra).forEach(([k, v]) => p.set(k, String(v)));
  return `${caminho}?${p.toString()}`;
}

// números de página com reticências: 1 … 4 5 [6] 7 8 … 40
function faixa(atual: number, total: number): (number | '…')[] {
  const set = new Set([1, total, atual - 2, atual - 1, atual, atual + 1, atual + 2].filter((n) => n >= 1 && n <= total));
  const nums = Array.from(set).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…'); out.push(n); });
  return out;
}

export function Paginacao({ base, pagina, paginas, porPagina, total }: { base: string; pagina: number; paginas: number; porPagina: number; total: number }) {
  return (
    <div className="q-barra">
      <span className="suave" style={{ fontSize: 14 }}>
        {total === 0 ? 'Nenhuma questão' : porPagina === 1 ? `Questão ${pagina} de ${total}` : `Questões ${(pagina - 1) * porPagina + 1}–${Math.min(total, pagina * porPagina)} de ${total}`}
      </span>
      <SeletorPorPagina base={base} pagina={pagina} porPagina={porPagina} />
      {paginas > 1 && (
        <nav aria-label="Páginas" className="q-paginas">
          {pagina > 1 ? <Link href={junta(base, { p: pagina - 1, pp: porPagina })} className="q-pag" aria-label="Página anterior">‹</Link> : <span className="q-pag" aria-hidden="true" data-off>‹</span>}
          {faixa(pagina, paginas).map((n, i) => n === '…'
            ? <span key={`r${i}`} className="q-pag-reticencias">…</span>
            : <Link key={n} href={junta(base, { p: n, pp: porPagina })} className="q-pag" aria-current={n === pagina ? 'page' : undefined}>{n}</Link>)}
          {pagina < paginas ? <Link href={junta(base, { p: pagina + 1, pp: porPagina })} className="q-pag" aria-label="Próxima página">›</Link> : <span className="q-pag" aria-hidden="true" data-off>›</span>}
        </nav>
      )}
    </div>
  );
}

export function Caderno({ questoes, total, pagina, porPagina, base, lista }: { questoes: QuestaoCompleta[]; total: number; pagina: number; porPagina: number; base: string; lista?: string | null }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  return (
    <section className="q-caderno" aria-label="Questões">
      <Paginacao base={base} pagina={pagina} paginas={paginas} porPagina={porPagina} total={total} />
      {questoes.map((q, i) => (
        <CartaoQuestao key={q.id} q={q} numero={(pagina - 1) * porPagina + i + 1} total={total} id={`q-${q.id}`} lista={lista}
          mostrarTextoBase={!q.textoBase || questoes[i - 1]?.textoBase?.id !== q.textoBase.id} />
      ))}
      {questoes.length > 0 && paginas > 1 && (
        <div className="q-rodape-caderno">
          {pagina < paginas
            ? <Link href={junta(base, { p: pagina + 1, pp: porPagina })} className="btn btn-azul">{porPagina === 1 ? 'Próxima questão →' : 'Próxima página →'}</Link>
            : <span className="suave">Você chegou ao fim deste caderno.</span>}
        </div>
      )}
    </section>
  );
}
