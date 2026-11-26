import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { NIVEIS } from '@/lib/assuntos';
import { carregarQuestoes, porPagina as lerPorPagina, respostasDasListas } from '@/lib/questao';
import { Caderno } from '@/components/Caderno';
import { AbasBanco } from '../../AbasBanco';
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
      <div className="so-desk"><Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Meus cadernos', href: '/aluno/questoes/cadernos' }, { rotulo: lista.titulo }]} /></div>
      <div className="so-desk"><AbasBanco ativa="cadernos" /></div>

      {/* celular: topo compacto, como num app */}
      <header className="mq-topo so-mob">
        <Link href="/aluno/questoes/cadernos" className="mq-voltar" aria-label="Voltar aos cadernos">‹</Link>
        <div className="mq-topo-texto">
          <span className="mq-rotulo">{questoes[0]?.disciplina ?? 'Caderno'}</span>
          <h1>Foco: {lista.titulo}</h1>
          <span className="mq-sub">{feitas} de {questoes.length} respondidas{feitas ? ` · ${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}` : ''}</span>
        </div>
      </header>

      <div className={`${s.cabeca} so-desk`}>
        <span className="rotulo">Caderno</span>
        <h1 className={`display ${s.titulo}`} style={{ fontSize: 'clamp(22px, 2.8vw, 30px)' }}>{lista.titulo}</h1>
      </div>

      <section className="cartao-gradiente so-desk" style={{ padding: 22, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', borderRadius: 4 }}>
        <div><span className="rotulo">Feitas</span><b className="display" style={{ display: 'block', fontSize: 34 }}>{feitas}/{questoes.length}</b></div>
        <div><span className="rotulo">Acertos</span><b className="display" style={{ display: 'block', fontSize: 34 }}>{acertos}</b></div>
        {liquida !== null && (
          <div title="Como no Cebraspe: cada item errado anula um certo">
            <span className="rotulo">Nota líquida (C/E)</span><b className="display" style={{ display: 'block', fontSize: 34 }}>{liquida}</b>
          </div>
        )}
        <div className="linha-flex" style={{ flex: '1 1 240px', minWidth: 0, gap: 10 }}>
          {proxima ? (
            <a href="#caderno" className="btn btn-ciano btn-grande">{feitas ? 'Continuar o caderno' : 'Começar o caderno'}</a>
          ) : (
            <span style={{ color: 'var(--texto-2)' }}>
              Caderno concluído: {Math.round((100 * acertos) / Math.max(1, questoes.length))}% de acertos.
            </span>
          )}
          <a href={`/imprimir/lista/${lista.id}`} target="_blank" rel="noopener" className="btn btn-azul">Imprimir em PDF</a>
        </div>
      </section>

      <section className="mq-nums-caixa" aria-labelledby="q">
        <h2 id="q" className="display so-desk" style={{ margin: 0, fontSize: 19 }}>Questões do caderno</h2>
        <div className="mq-nums">
          {questoes.map((q, i) => {
            const r = respostas.get(q.id);
            const atual = pp === 1 && i === pagina - 1;
            return (
              <Link key={q.id} href={`/aluno/questoes/lista/${lista.id}?p=${Math.floor(i / pp) + 1}&pp=${pp}#caderno`} className="mq-num"
                data-estado={r === true ? 'certa' : r === false ? 'errada' : 'pendente'} aria-current={atual ? 'step' : undefined}
                aria-label={`Questão ${i + 1}: ${r === true ? 'acertou' : r === false ? 'errou' : 'a fazer'}`}>
                {i + 1}
              </Link>
            );
          })}
        </div>
        <span className="suave so-desk" style={{ fontSize: 13 }}>Verde: acertou · vermelho: errou · cinza: a fazer</span>
      </section>

      <div id="caderno" className="mq-caderno">
        <Caderno questoes={daPagina} total={questoes.length} pagina={pagina} porPagina={pp} base={`/aluno/questoes/lista/${lista.id}`} lista={lista.id} />
      </div>

      {(pronta || sp.resultado === '1') && feitas > 0 && (
        <section className="cartao" id="resultado" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, scrollMarginTop: 80 }} aria-labelledby="res">
          <h2 id="res" className="display" style={{ margin: 0, fontSize: 19 }}>{pronta ? 'Resultado por disciplina e assunto' : `Resultado parcial · ${feitas} de ${questoes.length} feitas`}</h2>
          <p style={{ margin: 0 }}><b>{acertos}</b> de <b>{feitas}</b> certas ({Math.round((100 * acertos) / Math.max(1, feitas))}%)</p>
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
          <Link href="/aluno/questoes/filtrar" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Criar outro caderno</Link>
        </section>
      )}

      {/* celular: barra fixa embaixo */}
      <nav className="mq-barra so-mob" aria-label="Navegar no caderno">
        {pagina > 1
          ? <Link href={`/aluno/questoes/lista/${lista.id}?p=${pagina - 1}&pp=${pp}#caderno`} className="mq-bt">Anterior</Link>
          : <span className="mq-bt" data-off>Anterior</span>}
        {pagina < paginas
          ? <Link href={`/aluno/questoes/lista/${lista.id}?p=${pagina + 1}&pp=${pp}#caderno`} className="mq-bt">Próxima</Link>
          : <span className="mq-bt" data-off>Próxima</span>}
        <Link href={`/aluno/questoes/lista/${lista.id}?p=${pagina}&pp=${pp}&resultado=1#resultado`} className="mq-bt mq-bt-fim">{pronta ? 'Ver resultado' : 'Finalizar'}</Link>
      </nav>
    </>
  );
}
