import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { alternarSimulado } from '../actions';
import { FormSimulado } from './FormSimulado';
import { TrocarCapa } from '../TrocarCapa';
import { Capa } from '@/components/Capa';
import { destaqueSimulado, linksCapas } from '@/lib/capas';
import styles from '../professor.module.css';

export const metadata = { title: 'Simulados · Painel do professor' };

type Sim = { id: string; codigo: string; tipo: string; n_questoes: number; liberado: boolean; tem_gabarito: boolean; envios: number; media: number | null };
const TIPO: Record<string, string> = { mini: 'Minissimulado', completo: 'Completo', diagnostico: 'Diagnóstico' };

export default async function Simulados() {
  const supabase = await createClient();
  const [{ data }, { data: gabs }, { data: extras }] = await Promise.all([
    supabase.rpc('professor_resumo_simulados'),
    supabase.from('gabaritos').select('simulado_id, assuntos'),
    supabase.from('simulados').select('*'),
  ]);
  const infos = new Map(((extras ?? []) as { id: string; semana: number | null; capa_path?: string | null }[]).map((x) => [x.id, x]));
  const capas = await linksCapas(supabase, Array.from(infos.values()).map((x) => x.capa_path));
  const sims = (data as Sim[] | null) ?? [];
  const classificadas = new Map(((gabs ?? []) as { simulado_id: string; assuntos: string[] | null }[]).map((g) => [g.simulado_id, (g.assuntos ?? []).filter(Boolean).length]));

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Simulados e gabaritos' }]} />
      <h1 className={`display ${styles.titulo}`}>Simulados e gabaritos</h1>

      <section aria-labelledby="novo" className={`cartao ${styles.bloco}`} style={{ borderColor: 'var(--ciano)' }}>
        <h2 id="novo" className="display">Novo simulado</h2>
        <FormSimulado />
      </section>

      <section aria-labelledby="lista" className={`cartao ${styles.bloco}`}>
        <h2 id="lista" className="display">Simulados cadastrados</h2>
        {sims.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nenhum simulado ainda.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Código</th><th>Tipo</th><th>Questões</th><th>Gabarito</th><th>Classificação</th><th>Envios</th><th>Média</th><th>Para os alunos</th></tr></thead>
              <tbody>
                {sims.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{s.codigo}</td>
                    <td>{TIPO[s.tipo] ?? s.tipo}</td>
                    <td>{s.n_questoes}</td>
                    <td><span className={`${styles.chip} ${s.tem_gabarito ? styles.chipOk : styles.chipAlerta}`}>{s.tem_gabarito ? 'Cadastrado' : 'Falta'}</span></td>
                    <td>
                      {s.tem_gabarito ? (
                        <Link href={`/professor/simulados/${s.id}`} className={`btn btn-linha ${styles.mini}`}>
                          Classificar · {classificadas.get(s.id) ?? 0}/{s.n_questoes}
                        </Link>
                      ) : '–'}
                    </td>
                    <td>{s.envios}</td>
                    <td>{s.media === null ? '–' : `${String(s.media).replace('.', ',')} / ${s.n_questoes}`}</td>
                    <td>
                      <form action={alternarSimulado} className="linha-flex" style={{ flexWrap: 'nowrap', gap: 8 }}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="liberar" value={s.liberado ? 'nao' : 'sim'} />
                        <span className={`${styles.chip} ${s.liberado ? styles.chipOk : styles.chipNeutro}`}>{s.liberado ? 'Liberado' : 'Oculto'}</span>
                        <button className={`btn btn-linha ${styles.mini}`}>{s.liberado ? 'Ocultar' : 'Liberar'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {sims.length > 0 && (
        <section aria-labelledby="capas" className={`cartao ${styles.bloco}`}>
          <h2 id="capas" className="display">Capas dos simulados</h2>
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>Sem capa enviada, o aluno vê a capa automática da marca.</p>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {sims.map((x) => {
              const info = infos.get(x.id);
              const caminho = info?.capa_path ?? null;
              const tipo = x.tipo === 'completo' ? 'completo' : x.tipo === 'diagnostico' ? 'diagnostico' : 'mini';
              return (
                <div key={x.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong className="mono" style={{ fontSize: 14 }}>{x.codigo}</strong>
                  <TrocarCapa alvo="simulados" id={x.id} temCapa={!!caminho}>
                    {caminho && capas.get(caminho)
                      ? <img src={capas.get(caminho)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <Capa tipo={tipo} rotulo={TIPO[x.tipo] ?? x.tipo} destaque={destaqueSimulado(x.codigo, info?.semana)} />}
                  </TrocarCapa>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
