import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { NIVEIS, TIPOS } from '@/lib/assuntos';
import { alternarQuestao, excluirProva, publicarProva } from '../actions';
import { FormQuestao } from './FormQuestao';
import styles from '../professor.module.css';

export const metadata = { title: 'Banco de questões · Painel do professor' };

type Prova = { prova: string; banca: string | null; orgao: string | null; cargo: string | null; ano: number | null; tipo: string; total: number; revisadas: number; publicadas: number; com_resolucao: number };
type Q = {
  id: string; codigo: string; tipo: string; banca: string | null; orgao: string | null; ano: number | null; disciplina: string; assunto: string | null; nivel: string | null;
  revisada: boolean; publicada: boolean; respondidas: number; acertadas: number; enunciado: string;
  questoes_gabarito: { comentario: string | null } | { comentario: string | null }[] | null;
};

const select = { minHeight: 40, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--linha-forte)', background: 'var(--faixa)', color: 'var(--texto)', font: 'inherit' };

function nomeProva(p: Prova) {
  if (p.prova === 'AUTORAIS') return 'Questões autorais';
  if (p.prova === 'SEM-PROVA') return 'Questões sem código de prova';
  return [p.banca, [p.orgao, p.ano].filter(Boolean).join(' '), p.cargo].filter(Boolean).join(' · ') || p.prova;
}

export default async function Banco({ searchParams }: { searchParams: Promise<{ q?: string; d?: string; t?: string; prova?: string; rev?: string }> }) {
  const { q, d, t, prova, rev } = await searchParams;
  const supabase = await createClient();
  let consulta = supabase.from('questoes')
    .select('id, codigo, tipo, banca, orgao, ano, disciplina, assunto, nivel, revisada, publicada, respondidas, acertadas, enunciado, questoes_gabarito(comentario)')
    .order('ano', { ascending: false, nullsFirst: false }).order('prova', { nullsFirst: false }).order('numero_prova', { nullsFirst: false })
    .order('criado_em', { ascending: false }).limit(300);
  if (d) consulta = consulta.eq('disciplina', d);
  if (t) consulta = consulta.eq('tipo', t);
  if (rev === 'nao') consulta = consulta.eq('revisada', false);
  if (rev === 'sim') consulta = consulta.eq('revisada', true);
  if (prova === 'AUTORAIS') consulta = consulta.is('prova', null).eq('origem', 'autoral');
  else if (prova === 'SEM-PROVA') consulta = consulta.is('prova', null).eq('origem', 'prova');
  else if (prova) consulta = consulta.eq('prova', prova);
  if (q) { const b = q.replace(/[%,()]/g, ''); consulta = consulta.or(`codigo.ilike.%${b}%,enunciado.ilike.%${b}%,assunto.ilike.%${b}%`); }

  const [{ data }, { data: provasRaw }, { data: discs }, { data: assuntos }] = await Promise.all([
    consulta, supabase.rpc('professor_provas_banco'),
    supabase.from('disciplinas').select('nome').order('ordem').order('nome'),
    supabase.from('assuntos').select('disciplina, nome').order('nome'),
  ]);
  const provas = (provasRaw ?? []) as Prova[];
  const lista = (data ?? []) as unknown as Q[];
  const disciplinas = ((discs ?? []) as { nome: string }[]).map((x) => x.nome);
  const comentario = (x: Q) => {
    const g = Array.isArray(x.questoes_gabarito) ? x.questoes_gabarito[0] : x.questoes_gabarito;
    return !!g?.comentario;
  };

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Banco de questões' }]} />
      <h1 className={`display ${styles.titulo}`}>Banco de questões</h1>

      <div className="linha-flex">
        <Link href="/professor/banco/importar" className="btn btn-azul">Importar pacote de uma prova</Link>
        <Link href="/professor/banco?rev=nao" className="btn btn-linha">Questões a revisar</Link>
      </div>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="provas">
        <h2 id="provas" className="display">Provas no banco</h2>
        {provas.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nenhuma questão ainda. Importe o pacote de uma prova para começar.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Prova</th><th>Tipo</th><th>Questões</th><th>Revisadas</th><th>Com resolução</th><th>Publicadas</th><th></th></tr></thead>
              <tbody>
                {provas.map((p) => (
                  <tr key={p.prova}>
                    <td style={{ fontWeight: 700 }}>
                      <Link href={`/professor/banco?prova=${encodeURIComponent(p.prova)}`}>{nomeProva(p)}</Link>
                      <div className="mono suave" style={{ fontSize: 12, fontWeight: 400 }}>{p.prova}</div>
                    </td>
                    <td>{TIPOS[p.tipo] ?? p.tipo}</td>
                    <td>{p.total}</td>
                    <td><span className={`${styles.chip} ${p.revisadas === p.total ? styles.chipOk : styles.chipAlerta}`}>{p.revisadas} de {p.total}</span></td>
                    <td>{p.com_resolucao}</td>
                    <td>{p.publicadas}</td>
                    <td>
                      <div className="linha-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        {p.revisadas < p.total && <Link href={`/professor/banco?prova=${encodeURIComponent(p.prova)}&rev=nao`} className={`btn btn-linha ${styles.mini}`}>Revisar</Link>}
                        <form action={publicarProva}>
                          <input type="hidden" name="prova" value={p.prova} />
                          <input type="hidden" name="publicar" value={p.publicadas === p.total ? 'nao' : 'sim'} />
                          <button className={`btn ${p.publicadas === p.total ? 'btn-linha' : 'btn-azul'} ${styles.mini}`}>{p.publicadas === p.total ? 'Ocultar a prova' : 'Publicar a prova'}</button>
                        </form>
                        <details>
                          <summary className={`btn btn-linha ${styles.mini}`} style={{ listStyle: 'none', color: 'var(--erro)' }}>Excluir</summary>
                          <form action={excluirProva} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, minWidth: 220 }}>
                            <input type="hidden" name="prova" value={p.prova} />
                            <label className={styles.check} style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'normal' }}>
                              <input type="checkbox" name="confirmo" required /> Apagar as {p.total} questões e as respostas dos alunos a elas
                            </label>
                            <button className={`btn btn-perigo ${styles.mini}`}>Excluir a prova</button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className={`cartao ${styles.bloco}`}>
        <summary className="display" style={{ cursor: 'pointer', fontSize: 19, fontWeight: 800 }}>Nova questão (digitada)</summary>
        <div style={{ paddingTop: 12 }}><FormQuestao disciplinas={disciplinas} assuntos={(assuntos ?? []) as { disciplina: string; nome: string }[]} /></div>
      </details>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="lista">
        <h2 id="lista" className="display">Questões cadastradas</h2>
        <form method="get" className="linha-flex" aria-label="Filtros">
          <input name="q" defaultValue={q ?? ''} placeholder="Buscar por código, assunto ou texto" style={{ ...select, flex: '1 1 240px' }} aria-label="Buscar" />
          <select name="d" defaultValue={d ?? ''} style={select} aria-label="Disciplina">
            <option value="">Todas as disciplinas</option>
            {disciplinas.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <select name="t" defaultValue={t ?? ''} style={select} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {prova && <input type="hidden" name="prova" value={prova} />}
          <select name="rev" defaultValue={rev ?? ''} style={select} aria-label="Revisão">
            <option value="">Revisadas ou não</option>
            <option value="nao">A revisar</option>
            <option value="sim">Já revisadas</option>
          </select>
          <button className={`btn btn-azul ${styles.mini}`}>Filtrar</button>
        </form>
        {lista.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nenhuma questão ainda.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Código</th><th>Classificação</th><th>Revisão</th><th>Resolução</th><th>Acertos</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {lista.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <Link href={`/professor/banco/${x.id}`} className="mono" style={{ fontWeight: 700 }}>{x.codigo}</Link>
                      <div className="suave" style={{ fontSize: 13, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.enunciado}</div>
                    </td>
                    <td className="suave" style={{ fontSize: 14 }}>{[x.disciplina, x.assunto, x.tipo === 'certo_errado' ? 'C/E' : null, x.nivel ? NIVEIS[x.nivel] : null].filter(Boolean).join(' · ')}</td>
                    <td><span className={`${styles.chip} ${x.revisada ? styles.chipOk : styles.chipAlerta}`}>{x.revisada ? 'Revisada' : 'A revisar'}</span></td>
                    <td><span className={`${styles.chip} ${comentario(x) ? styles.chipOk : styles.chipNeutro}`}>{comentario(x) ? 'Comentada' : 'Sem comentário'}</span></td>
                    <td className="mono">{x.respondidas ? `${Math.round((100 * x.acertadas) / x.respondidas)}% de ${x.respondidas}` : '–'}</td>
                    <td><span className={`${styles.chip} ${x.publicada ? styles.chipOk : styles.chipNeutro}`}>{x.publicada ? 'Publicada' : 'Rascunho'}</span></td>
                    <td>
                      <form action={alternarQuestao}>
                        <input type="hidden" name="id" value={x.id} />
                        <input type="hidden" name="publicar" value={x.publicada ? 'nao' : 'sim'} />
                        <button className={`btn btn-linha ${styles.mini}`}>{x.publicada ? 'Despublicar' : 'Publicar'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
