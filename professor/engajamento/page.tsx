import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import styles from '../professor.module.css';

export const metadata = { title: 'Engajamento por turma · Painel do professor' };

type Linha = { turma_id: string | null; turma: string; produto: string | null; inicio: string | null; ativos: number; estudaram_semana: number; sem_estudar_7d: number };

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export default async function Engajamento() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('professor_engajamento_turmas');
  const linhas = (data ?? []) as Linha[];
  const total = linhas.reduce((t, l) => ({ ativos: t.ativos + l.ativos, sim: t.sim + l.estudaram_semana, nao: t.nao + l.sem_estudar_7d }), { ativos: 0, sim: 0, nao: 0 });

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Engajamento por turma' }]} />
      <h1 className={`display ${styles.titulo}`}>Engajamento por turma</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>
        Conta como estudo o dia em que o aluno conclui uma aula, envia um simulado ou resolve uma questão do banco. Janela: últimos 7 dias.
      </p>
      {error && <p className="erro" style={{ margin: 0 }}>Rode a atualização do banco (0005) no Supabase para ver esta página.</p>}

      <section aria-label="Curso inteiro" className={styles.numeros}>
        <div className={`cartao ${styles.numero}`}><small>Alunos com acesso</small><b>{total.ativos}</b></div>
        <div className={`cartao ${styles.numero}`}><small>Estudaram nos últimos 7 dias</small><b>{pct(total.sim, total.ativos)}%</b><span className="suave" style={{ fontSize: 14 }}>{total.sim} de {total.ativos} alunos</span></div>
        <div className={`cartao ${styles.numero}`} style={{ borderColor: total.nao ? 'var(--laranja)' : undefined }}>
          <small>Sem estudar há 7+ dias</small><b>{pct(total.nao, total.ativos)}%</b><span className="suave" style={{ fontSize: 14 }}>{total.nao} de {total.ativos} alunos</span>
        </div>
      </section>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="porturma">
        <h2 id="porturma" className="display">Por turma</h2>
        {linhas.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nenhum aluno com acesso ativo ainda.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Turma</th><th>Alunos</th><th>Estudaram (7 dias)</th><th>Sem estudar 7+ dias</th></tr></thead>
              <tbody>
                {linhas.map((l) => {
                  const p1 = pct(l.estudaram_semana, l.ativos);
                  const p2 = pct(l.sem_estudar_7d, l.ativos);
                  return (
                    <tr key={l.turma_id ?? 'sem'}>
                      <td>
                        <strong>{l.turma}</strong>
                        {l.inicio && <div className="suave" style={{ fontSize: 13 }}>{l.produto} · início {new Date(l.inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</div>}
                      </td>
                      <td>{l.ativos}</td>
                      <td style={{ minWidth: 200 }}>
                        <div className="linha-flex" style={{ flexWrap: 'nowrap', gap: 8 }}>
                          <span className={styles.barra} style={{ flex: 1 }}><span style={{ width: `${p1}%`, background: 'var(--ciano)' }} /></span>
                          <span className="mono" style={{ width: 92, textAlign: 'right' }}>{p1}% · {l.estudaram_semana}</span>
                        </div>
                      </td>
                      <td style={{ minWidth: 200 }}>
                        <div className="linha-flex" style={{ flexWrap: 'nowrap', gap: 8 }}>
                          <span className={styles.barra} style={{ flex: 1 }}><span style={{ width: `${p2}%`, background: 'var(--laranja)' }} /></span>
                          <span className="mono" style={{ width: 92, textAlign: 'right' }}>{p2}% · {l.sem_estudar_7d}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Link href="/professor/alunos?f=parados" className="btn btn-linha" style={{ alignSelf: 'flex-start' }}>Ver a lista de quem está sem estudar</Link>
      </section>
    </>
  );
}
