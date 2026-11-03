import Link from 'next/link';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { BANCAS } from '@/lib/assuntos';
import { salvarEdital } from '../actions';
import { FormAcao } from '../FormAcao';
import styles from '../professor.module.css';

type Disc = { disciplina: string; questoes: number; bloco: string | null; peso: number; ordem: number };
export type Edital = {
  id: string; slug: string; nome: string; orgao: string; cargo: string; banca: string | null; esfera: string; escolaridade: string | null;
  situacao: string; data_prova: string | null; tipo_prova: string; n_alternativas: number; corte_bloco: number | null; corte_total: number | null;
  sem_zerar: boolean; duracao_min: number | null; observacoes: string | null; publicado: boolean; edital_disciplinas: Disc[];
};

const SITUACAO: Record<string, string> = { previsto: 'Previsto', aberto: 'Aberto', encerrado: 'Encerrado' };
const pct = (v: number | null) => (v ? String(Math.round(v * 100)) : '');

// Tela de editais (lista + formulário); recebe os dados já carregados
export function EditaisTela({ editais, id, novo }: { editais: Edital[]; id?: string; novo?: string }) {
  const atual = editais.find((e) => e.id === id);
  const mostrarForm = !!atual || novo === '1';
  const e = atual;
  const discsTexto = e ? [...e.edital_disciplinas].sort((a, b) => a.ordem - b.ordem)
    .map((d) => [d.disciplina, d.questoes, d.bloco ?? '', Number(d.peso) !== 1 ? String(d.peso).replace('.', ',') : ''].join('; ').replace(/(; )+$/, '')).join('\n') : '';

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Editais' }]} />
      <h1 className={`display ${styles.titulo}`}>Editais</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>
        Cada edital define as disciplinas, quantas questões caem de cada uma, a data da prova e a regra de corte.
        É dele que saem o plano de estudo diário, os simulados no formato da prova e o filtro do banco de questões.
      </p>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="lista">
        <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
          <h2 id="lista" className="display">Editais cadastrados</h2>
          <Link href="/professor/editais?novo=1" className="btn btn-azul">Novo edital</Link>
        </div>
        {editais.length === 0 ? <p className="suave" style={{ margin: 0 }}>Nenhum edital ainda.</p> : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Edital</th><th>Banca</th><th>Prova</th><th>Questões</th><th>Situação</th><th>Na vitrine</th><th></th></tr></thead>
              <tbody>
                {editais.map((x) => (
                  <tr key={x.id}>
                    <td style={{ fontWeight: 700 }}>{x.nome}</td>
                    <td>{x.banca ?? '–'}</td>
                    <td>{x.data_prova ? new Date(x.data_prova + 'T12:00:00').toLocaleDateString('pt-BR') : '–'}</td>
                    <td>{x.edital_disciplinas.reduce((t, d) => t + d.questoes, 0)} em {x.edital_disciplinas.length} disciplinas</td>
                    <td>{SITUACAO[x.situacao]}</td>
                    <td><span className={`${styles.chip} ${x.publicado ? styles.chipOk : styles.chipNeutro}`}>{x.publicado ? 'Publicado' : 'Rascunho'}</span></td>
                    <td><Link href={`/professor/editais?id=${x.id}`} className={`btn btn-linha ${styles.mini}`}>Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mostrarForm && (
        <section className={`cartao ${styles.bloco}`} aria-labelledby="form" style={{ borderColor: 'var(--azul)' }}>
          <h2 id="form" className="display">{e ? `Editar · ${e.nome}` : 'Novo edital'}</h2>
          <FormAcao key={e ? JSON.stringify(e) : 'novo'} acao={salvarEdital} botao={e ? 'Salvar alterações' : 'Criar edital'}>
            {e && <input type="hidden" name="id" value={e.id} />}
            <datalist id="bancas-ed">{BANCAS.map((b) => <option key={b} value={b} />)}</datalist>
            <div className={styles.campos}>
              <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor="enome">Nome que o aluno vê</label><input id="enome" name="nome" required defaultValue={e?.nome} placeholder="GM Natal 2026 · Agente" /></div>
              <div className="campo"><label htmlFor="eorg">Órgão</label><input id="eorg" name="orgao" required defaultValue={e?.orgao} placeholder="GM Natal" /></div>
              <div className="campo"><label htmlFor="ecar">Cargo</label><input id="ecar" name="cargo" required defaultValue={e?.cargo} placeholder="Agente" /></div>
              <div className="campo"><label htmlFor="eban">Banca</label><input id="eban" name="banca" list="bancas-ed" defaultValue={e?.banca ?? ''} /></div>
              <div className="campo"><label htmlFor="edata">Data da prova</label><input id="edata" name="data_prova" type="date" defaultValue={e?.data_prova ?? ''} /></div>
              <div className="campo">
                <label htmlFor="esit">Situação</label>
                <select id="esit" name="situacao" defaultValue={e?.situacao ?? 'previsto'}><option value="previsto">Previsto</option><option value="aberto">Aberto</option><option value="encerrado">Encerrado</option></select>
              </div>
              <div className="campo">
                <label htmlFor="eesf">Esfera</label>
                <select id="eesf" name="esfera" defaultValue={e?.esfera ?? 'municipal'}><option value="municipal">Municipal</option><option value="estadual">Estadual</option><option value="federal">Federal</option></select>
              </div>
              <div className="campo">
                <label htmlFor="eesc">Escolaridade</label>
                <select id="eesc" name="escolaridade" defaultValue={e?.escolaridade ?? 'medio'}><option value="fundamental">Fundamental</option><option value="medio">Médio</option><option value="superior">Superior</option></select>
              </div>
              <div className="campo">
                <label htmlFor="ealt">Alternativas</label>
                <select id="ealt" name="n_alternativas" defaultValue={String(e?.n_alternativas ?? 5)}><option value="5">A a E</option><option value="4">A a D</option></select>
              </div>
              <input type="hidden" name="tipo_prova" value={e?.tipo_prova ?? 'multipla'} />
            </div>

            <div className="campo">
              <label htmlFor="ediscs">Disciplinas, uma por linha: nome; questões; bloco</label>
              <textarea id="ediscs" name="disciplinas" rows={8} required defaultValue={discsTexto} className="mono" style={{ fontSize: 14 }}
                placeholder={'Língua Portuguesa; 15; Conhecimentos gerais\nRaciocínio Lógico; 10; Conhecimentos gerais\nEstatuto Geral das Guardas Municipais; 10; Conhecimentos específicos\nDireito Constitucional; 10; Conhecimentos específicos'} />
              <span className="suave" style={{ fontSize: 13 }}>O bloco é opcional (use quando o edital exige mínimo por bloco). A ordem das linhas é a ordem da prova.</span>
            </div>

            <div className={styles.campos}>
              <div className="campo"><label htmlFor="ecb">Mínimo por bloco (%)</label><input id="ecb" name="corte_bloco" inputMode="decimal" defaultValue={pct(e?.corte_bloco ?? null)} placeholder="30" /></div>
              <div className="campo"><label htmlFor="ect">Mínimo no total (%)</label><input id="ect" name="corte_total" inputMode="decimal" defaultValue={pct(e?.corte_total ?? null)} placeholder="50" /></div>
              <div className="campo"><label htmlFor="edur">Tempo da prova (min)</label><input id="edur" name="duracao_min" type="number" min={10} max={600} defaultValue={e?.duracao_min ?? ''} placeholder="240" /></div>
            </div>
            <label className={styles.check}><input type="checkbox" name="sem_zerar" defaultChecked={e?.sem_zerar ?? false} /> Eliminado se zerar alguma disciplina</label>
            <div className="campo"><label htmlFor="eobs">Observações (aparecem para o aluno)</label><textarea id="eobs" name="observacoes" rows={2} defaultValue={e?.observacoes ?? ''} /></div>
            <label className={styles.check}><input type="checkbox" name="publicado" defaultChecked={e?.publicado ?? false} /> Publicado (aparece na vitrine e para os alunos)</label>
          </FormAcao>
        </section>
      )}
    </>
  );
}
