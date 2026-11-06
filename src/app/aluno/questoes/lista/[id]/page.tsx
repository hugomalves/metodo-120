import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { NIVEIS } from '@/lib/assuntos';
import { carregarQuestoes, porPagina as lerPorPagina, respostasDasListas } from '@/lib/questao';
import { Caderno } from '@/components/Caderno';
import s from '../../../aluno.module.css';

type Lista = { id: string; titulo: string; questoes: string[]; filtros: Record<string, unknown> };
type Q = { id: string; codigo: string; disciplina: string; assunto: string | null; nivel: string | null; tipo: string };

export default async function ListaPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const pp = lerPorPagina(sp.pp, (await cookies()).get('gq_pp')?.value);
  const { supabase, perfil, acesso } = await acessoAtual();
  const { data } = await supabase.from('listas_questoes').select('id, titulo, questoes, filtros').eq('id', id).eq('aluno_id', perfil.id).maybeSingle();
  const lista = data as Lista | null;
  if (!lista) notFound();

  const [{ data: qs }, dasListas] = await Promise.all([
    supabase.from('questoes').select('id, codigo, disciplina, assunto, nivel, tipo').in('id', lista.questoes),
    respostasDasListas(supabase, perfil.id, [lista]),
  ]);
  const porId = new Map(((qs ?? []) as Q[]).map((q) => [q.id, q]));
  const questoes = lista.questoes.map((qid) => porId.get(qid)).filter((q): q is Q => !!q);
  const respostas = dasListas.get(lista.id) ?? new Map<string, boolean>();
  const feitas = questoes.filter((q) => respostas.has(q.id)).length;
  const acertos = questoes.filter((q) => respostas.get(q.id) === true).length;
  const proxima = questoes.find((q) => !respostas.has(q.id));
  const pronta = !proxima && questoes.length > 0;

  // desempenho por assunto (quando a lista termina)
  const porAssunto = new Map<string, { n: number; ok: number }>();
  questoes.forEach((q) => {
    if (!respostas.has(q.id)) return;
    const k = q.assunto ? `${q.disciplina} · ${q.assunto}` : q.disciplina;
    const v = porAssunto.get(k) ?? { n: 0, ok: 0 };
    v.n += 1; if (respostas.get(q.id)) v.ok += 1;
    porAssunto.set(k, v);
  });
  const erradas = questoes.filter((q) => respostas.get(q.id) === false);
  // no certo/errado vale a nota líquida da prova: cada erro anula um acerto
  const itensCE = questoes.filter((q) => q.tipo === 'certo_errado' && respostas.has(q.id));
  const liquida = itensCE.length ? itensCE.filter((q) => respostas.get(q.id)).length - itensCE.filter((q) => !respostas.get(q.id)).length : null;
  const paginas = Math.max(1, Math.ceil(questoes.length / pp));
  const primeiraAFazer = questoes.findIndex((q) => !respostas.has(q.id));
  const paginaPadrao = primeiraAFazer >= 0 ? Math.floor(primeiraAFazer / pp) + 1 : 1;
  const pagina = Math.min(paginas, Math.max(1, parseInt(sp.p ?? String(paginaPadrao), 10) || 1));
  const daPagina = await carregarQuestoes(supabase, perfil.id, questoes.slice((pagina - 1) * pp, pagina * pp).map((q) => q.id), lista.id);

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Listas', href: '/aluno/questoes/listas' }, { rotulo: lista.titulo }]} />
      <div className={s.cabeca}>
        <span className="rotulo">Lista sob medida</span>
        <h1 className={`display ${s.titulo}`} style={{ fontSize: 'clamp(22px, 2.8vw, 30px)' }}>{lista.titulo}</h1>
      </div>

      <section className="cartao-gradiente" style={{ padding: 22, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', borderRadius: 4 }}>
        <div><span className="rotulo">Feitas</span><b className="display" style={{ display: 'block', fontSize: 34 }}>{feitas}/{questoes.length}</b></div>
        <div><span className="rotulo">Acertos</span><b className="display" style={{ display: 'block', fontSize: 34 }}>{acertos}</b></div>
        {liquida !== null && (
          <div title="Como no Cebraspe: cada item errado anula um certo">
            <span className="rotulo">Nota líquida (C/E)</span><b className="display" style={{ display: 'block', fontSize: 34 }}>{liquida}</b>
          </div>
        )}
        <div className="linha-flex" style={{ flex: '1 1 240px', minWidth: 0, gap: 10 }}>
          {proxima ? (
            <a href="#caderno" className="btn btn-ciano btn-grande">{feitas ? 'Continuar a lista' : 'Começar a lista'}</a>
          ) : (
            <span style={{ color: 'var(--texto-2)' }}>
              Lista concluída: {Math.round((100 * acertos) / Math.max(1, questoes.length))}% de acertos.
            </span>
          )}
          {acesso.completo && <a href={`/imprimir/lista/${lista.id}`} target="_blank" rel="noopener" className="btn btn-linha">Imprimir a lista (PDF)</a>}
        </div>
      </section>

      <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="q">
        <h2 id="q" className="display" style={{ margin: 0, fontSize: 19 }}>Questões da lista</h2>
        <div className="linha-flex" style={{ gap: 8 }}>
          {questoes.map((q, i) => {
            const r = respostas.get(q.id);
            const cor = r === true ? { background: '#16a34a', color: '#fff' } : r === false ? { background: 'var(--erro)', color: '#fff' } : { background: 'var(--cartao-2)', color: 'var(--texto)' };
            return (
              <Link key={q.id} href={`/aluno/questoes/lista/${lista.id}?p=${Math.floor(i / pp) + 1}&pp=${pp}#caderno`} className="mono"
                aria-label={`Questão ${i + 1}: ${r === true ? 'acertou' : r === false ? 'errou' : 'a fazer'}`}
                style={{ ...cor, width: 44, height: 44, borderRadius: 4, display: 'grid', placeItems: 'center', textDecoration: 'none', fontWeight: 700, border: '1px solid var(--linha-forte)' }}>
                {i + 1}
              </Link>
            );
          })}
        </div>
        <span className="suave" style={{ fontSize: 13 }}>Verde: acertou · vermelho: errou · cinza: a fazer</span>
      </section>

      <div id="caderno">
        <Caderno questoes={daPagina} total={questoes.length} pagina={pagina} porPagina={pp} base={`/aluno/questoes/lista/${lista.id}`} lista={lista.id} />
      </div>

      {pronta && (
        <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="res">
          <h2 id="res" className="display" style={{ margin: 0, fontSize: 19 }}>Resultado por disciplina e assunto</h2>
          {Array.from(porAssunto.entries()).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).map(([k, v]) => {
            const pct = Math.round((100 * v.ok) / v.n);
            return (
              <div key={k} className="linha-flex" style={{ flexWrap: 'nowrap', gap: 12 }}>
                <span style={{ flex: '0 1 240px', minWidth: 0 }}>{k}</span>
                <span className={s.trilho} style={{ flex: 1 }}><span style={{ width: `${pct}%`, background: pct >= 60 ? 'var(--ciano)' : 'var(--laranja)' }} /></span>
                <span className="mono" style={{ width: 70, textAlign: 'right' }}>{v.ok}/{v.n}</span>
              </div>
            );
          })}
          {erradas.length > 0 && (
            <p style={{ margin: '6px 0 0' }}>
              Reveja as que você errou: {erradas.map((q, i) => (
                <span key={q.id}>{i > 0 && ', '}<Link href={`/aluno/questoes/${q.id}?lista=${lista.id}`}>{q.codigo}</Link>{q.nivel ? ` (${NIVEIS[q.nivel].toLowerCase()})` : ''}</span>
              ))}
            </p>
          )}
          <Link href="/aluno/questoes/listas" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Montar outra lista</Link>
        </section>
      )}
    </>
  );
}
