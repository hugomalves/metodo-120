import Link from 'next/link';
import { NIVEIS } from '@/lib/assuntos';
import type { QuestaoCompleta } from '@/lib/questao';
import { TextoRico } from '@/components/TextoRico';
import { ImagemQuestao } from '@/components/ImagemQuestao';
import { ResponderQuestao, type Alternativa } from '@/app/aluno/questoes/[id]/ResponderQuestao';

// "Cebraspe · PRF 2021 · Policial Rodoviário Federal · Item 15"
export function origemQuestao(q: Pick<QuestaoCompleta, 'origem' | 'tipo' | 'banca' | 'orgao' | 'cargo' | 'ano' | 'numero_prova'>) {
  if (q.origem === 'autoral') return 'Questão autoral' + (q.banca ? ` · estilo ${q.banca}` : '');
  const prova = [q.orgao, q.ano].filter(Boolean).join(' ');
  const num = q.numero_prova ? `${q.tipo === 'certo_errado' ? 'Item' : 'Questão'} ${q.numero_prova}` : null;
  return [q.banca, prova, q.cargo, num].filter(Boolean).join(' · ');
}

export function alternativasDe(q: QuestaoCompleta): Alternativa[] {
  if (q.tipo === 'certo_errado') return [{ letra: 'C', texto: 'Certo' }, { letra: 'E', texto: 'Errado' }];
  const emTexto = q.formato !== 'imagem' || !q.imagem;
  const letras = emTexto && !q.alt_e.trim() ? (['A', 'B', 'C', 'D'] as const) : (['A', 'B', 'C', 'D', 'E'] as const);
  return letras.map((L) => ({ letra: L, texto: emTexto ? q[`alt_${L.toLowerCase()}` as 'alt_a'] ?? '' : '' }));
}

export function TextoBaseCaixa({ q }: { q: QuestaoCompleta }) {
  if (!q.textoBase) return null;
  return (
    <details className="q-texto-base">
      <summary>
        <span className="q-texto-base-rotulo">Texto de apoio</span>
        <span className="q-texto-base-dica">Clique para ler</span>
      </summary>
      <div className="q-texto-base-corpo"><TextoRico texto={q.textoBase.texto} figuras={q.textoBase.figuras} /></div>
    </details>
  );
}

// Uma questão completa: cabeçalho, texto-base, enunciado (ou recorte da prova), alternativas e correção
export function CartaoQuestao({ q, numero, total, id, lista, mostrarTextoBase = true }: {
  q: QuestaoCompleta; numero?: number; total?: number; id?: string; lista?: string | null; mostrarTextoBase?: boolean;
}) {
  const emTexto = q.formato !== 'imagem' || !q.imagem;
  const certoErrado = q.tipo === 'certo_errado';
  const meta = [q.disciplina, q.assunto, q.nivel ? NIVEIS[q.nivel] : null, certoErrado ? 'Certo ou errado' : null].filter(Boolean).join(' · ');

  return (
    <article className="q-cartao" id={id} data-tipo={q.tipo}>
      <header className="q-cabeca">
        <div style={{ minWidth: 0 }}>
          {numero && total ? <span className="q-num">{certoErrado ? 'Item' : 'Questão'} {numero} de {total}</span> : null}
          <span className="q-origem">{origemQuestao(q)}</span>
          {meta && <span className="q-meta">{meta}</span>}
        </div>
        <div className="q-acoes">
          {emTexto && q.imagem && (
            <a href={q.imagem} target="_blank" rel="noopener" className="q-acao" title="Ver como aparece no caderno da prova">Ver na prova</a>
          )}
          <Link href={`/aluno/duvidas?ctx=${encodeURIComponent(`Banco · ${q.codigo}`)}`} className="q-acao q-acao-destaque">Perguntar ao professor</Link>
        </div>
      </header>
      <div className="q-corpo">
        {mostrarTextoBase && <TextoBaseCaixa q={q} />}
        {!mostrarTextoBase && q.textoBase && <span className="q-texto-base-mesmo">Mesmo texto do item anterior.</span>}
        {emTexto ? (
          <TextoRico texto={q.enunciado} figuras={q.figuras} />
        ) : (
          <div className="q-imagem-prova">
            <ImagemQuestao src={q.imagem!} alt={`Questão ${q.codigo}, como aparece no caderno da prova`} />
            <span className="suave" style={{ fontSize: 12.5, display: 'block', marginTop: 6 }}>Toque na imagem para ampliar.</span>
          </div>
        )}
        <ResponderQuestao key={`${q.id}-${lista ?? ''}`} questaoId={q.id} alternativas={alternativasDe(q)} certoErrado={certoErrado}
          inicial={q.resolucao} figuras={q.figuras} taxa={{ respondidas: q.respondidas, acertadas: q.acertadas }} lista={lista} historico={q.historico} />
      </div>
    </article>
  );
}
