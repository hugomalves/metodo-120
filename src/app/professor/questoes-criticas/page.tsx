import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { NIVEIS } from '@/lib/assuntos';
import { agrupar, type QuestaoCritica } from '@/lib/criticas';
import styles from '../professor.module.css';

export const metadata = { title: 'Questões que mais derrubam · Painel do professor' };

type PorAssunto = { assunto: string | null; habilidade: string | null; questoes: number; respostas: number; pct_erro: number };

const select = { minHeight: 44, padding: '0 12px', borderRadius: 4, border: '1.5px solid var(--linha-forte)', background: 'var(--faixa)', color: 'var(--texto)', font: 'inherit' };

export default async function QuestoesCriticas({ searchParams }: { searchParams: Promise<{ turma?: string; sim?: string }> }) {
  const { turma, sim } = await searchParams;
  const supabase = await createClient();
  const [{ data: qRaw, error }, { data: aRaw }, { data: turmas }, { data: sims }] = await Promise.all([
    supabase.rpc('professor_questoes_criticas', { p_turma: turma || null, p_simulado: sim || null, p_limite: 20 }),
    supabase.rpc('professor_erros_por_assunto', { p_turma: turma || null }),
    supabase.from('turmas').select('id, nome').order('inicio', { ascending: false }),
    supabase.from('simulados').select('id, codigo').order('criado_em', { ascending: false }),
  ]);
  const questoes = (qRaw ?? []) as QuestaoCritica[];
  const grupos = agrupar(questoes);
  const porAssunto = ((aRaw ?? []) as PorAssunto[]).slice(0, 15);
  const semClassificar = questoes.filter((q) => !q.assunto).length;

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Questões que mais derrubam' }]} />
      <h1 className={`display ${styles.titulo}`}>Questões que mais derrubam</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        As 20 questões com mais erros, agrupadas por assunto e habilidade, para montar a pauta da correção ao vivo e atacar o problema da turma. Conta só o primeiro envio de cada aluno.
      </p>
      {error && <p className="erro" style={{ margin: 0 }}>Rode a atualização do banco (0005) no Supabase para ver esta página.</p>}

      <form method="get" className="linha-flex cartao" style={{ padding: 14 }} aria-label="Filtros">
        <label htmlFor="ft" className="suave" style={{ fontSize: 14 }}>Turma</label>
        <select id="ft" name="turma" defaultValue={turma ?? ''} style={select}>
          <option value="">Todas</option>
          {((turmas ?? []) as { id: string; nome: string }[]).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <label htmlFor="fs" className="suave" style={{ fontSize: 14 }}>Simulado</label>
        <select id="fs" name="sim" defaultValue={sim ?? ''} style={select}>
          <option value="">Todos</option>
          {((sims ?? []) as { id: string; codigo: string }[]).map((s) => <option key={s.id} value={s.id}>{s.codigo}</option>)}
        </select>
        <button className={`btn btn-azul ${styles.mini}`}>Ver</button>
      </form>

      {semClassificar > 0 && (
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          {semClassificar} das questões abaixo ainda não têm assunto. Classifique em <Link href="/professor/simulados">Simulados e gabaritos → Classificar</Link> para o agrupamento ficar completo.
        </p>
      )}

      <section className={`cartao ${styles.bloco}`} aria-labelledby="top">
        <h2 id="top" className="display">Top 20, agrupadas</h2>
        {questoes.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Quando os alunos enviarem os cartões-resposta, o ranking aparece aqui.</p>
        ) : (
          grupos.map((g) => (
            <div key={g.chave} style={{ borderTop: '1px solid var(--linha)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
                <strong className="display" style={{ fontSize: 17 }}>
                  {g.assunto ?? 'Sem assunto'}{g.habilidade ? ` · ${g.habilidade}` : ''}
                </strong>
                <span className="mono suave" style={{ fontSize: 14 }}>{g.questoes.length} {g.questoes.length === 1 ? 'questão' : 'questões'} · média {g.media}% de erro</span>
              </div>
              <div className="linha-flex" style={{ gap: 8 }}>
                {g.questoes.map((q) => (
                  <span key={`${q.simulado_id}-${q.questao}`} className={styles.chip}
                    style={{ background: Number(q.pct_erro) >= 60 ? 'var(--erro-fundo)' : 'var(--cartao-2)', color: Number(q.pct_erro) >= 60 ? 'var(--erro)' : 'var(--texto-2)', fontWeight: 600 }}
                    title={`Respostas: ${q.respostas}. Certa: ${q.certa}. Mais marcada errada: ${q.mais_marcada ?? '–'}`}>
                    {q.codigo} · Q{q.questao} · {Number(q.pct_erro)}%{q.nivel ? ` · ${NIVEIS[q.nivel]}` : ''}{q.mais_marcada ? ` · marcaram ${q.mais_marcada} (certa ${q.certa})` : ''}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="assuntos">
        <h2 id="assuntos" className="display">Onde a turma mais erra (todas as questões classificadas)</h2>
        {porAssunto.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Classifique as questões dos simulados por assunto e habilidade para ver este quadro.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Assunto</th><th>Habilidade</th><th>Questões</th><th>Respostas</th><th>Erro</th></tr></thead>
              <tbody>
                {porAssunto.map((a, i) => {
                  const e = Number(a.pct_erro);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{a.assunto ?? 'Sem assunto'}</td>
                      <td className="mono">{a.habilidade ?? '–'}</td>
                      <td>{a.questoes}</td>
                      <td>{a.respostas}</td>
                      <td style={{ minWidth: 170 }}>
                        <div className="linha-flex" style={{ flexWrap: 'nowrap', gap: 8 }}>
                          <span className={styles.barra} style={{ flex: 1 }}><span style={{ width: `${e}%`, background: e >= 60 ? 'var(--laranja)' : 'var(--azul)' }} /></span>
                          <span className="mono" style={{ width: 52, textAlign: 'right' }}>{e}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
