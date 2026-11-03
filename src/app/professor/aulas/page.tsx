import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { alternarAula, salvarModulo } from '../actions';
import { FormAcao } from '../FormAcao';
import { FormAula } from './FormAula';
import { TrocarCapa } from '../TrocarCapa';
import { Capa, iconePorTitulo } from '@/components/Capa';
import { doisDigitos, linksCapas } from '@/lib/capas';
import styles from '../professor.module.css';

export const metadata = { title: 'Aulas · Painel do professor' };

type Aula = { id: string; numero: number; tipo: string; titulo: string; video_url: string | null; pdf_path: string | null; habilidades: string[]; trilha: string; publicada: boolean };
type Modulo = { id: string; numero: number; titulo: string; extra: boolean; disciplina: string | null; capa_path?: string | null; aulas: Aula[] };


export default async function Aulas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('modulos')
    .select('*, aulas(id, numero, tipo, titulo, video_url, pdf_path, habilidades, trilha, publicada)')
    .order('numero')
    .order('numero', { referencedTable: 'aulas' });
  const modulos = (data as Modulo[] | null) ?? [];
  const { data: discs } = await supabase.from('disciplinas').select('nome').order('ordem').order('nome');
  const disciplinas = ((discs ?? []) as { nome: string }[]).map((d) => d.nome);
  const capas = await linksCapas(supabase, modulos.map((m) => m.capa_path));
  const proximo = (modulos.at(-1)?.numero ?? 0) + 1;

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Aulas' }]} />
      <h1 className={`display ${styles.titulo}`}>Aulas</h1>

      <section aria-labelledby="nova" className={`cartao ${styles.bloco}`} style={{ borderColor: 'var(--ciano)' }}>
        <h2 id="nova" className="display">Nova aula ou editar aula</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          Se já existir uma aula com o mesmo módulo e número, ela é atualizada.
        </p>
        <FormAula modulos={modulos.map((m) => ({ id: m.id, rotulo: `${m.disciplina ? `${m.disciplina} · ` : ''}Módulo ${m.numero} · ${m.titulo}` }))} />
      </section>

      {modulos.map((m) => {
        const publicadas = m.aulas.filter((a) => a.publicada).length;
        return (
          <section key={m.id} className={`cartao ${styles.bloco}`}>
            <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
              <h2 className="display">{m.disciplina ? <span className="suave" style={{ fontWeight: 600 }}>{m.disciplina} · </span> : null}Módulo {m.numero} · {m.titulo}</h2>
              <span className="mono suave" style={{ fontSize: 13 }}>{publicadas} de {m.aulas.length} publicadas</span>
            </div>
            <TrocarCapa alvo="modulos" id={m.id} temCapa={!!m.capa_path}>
              {m.capa_path && capas.get(m.capa_path)
                ? <img src={capas.get(m.capa_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <Capa tipo="modulo" rotulo={`Módulo ${doisDigitos(m.numero)}`} destaque={doisDigitos(m.numero)} icone={iconePorTitulo(m.titulo)} titulo={m.titulo} />}
            </TrocarCapa>
            {m.aulas.length === 0 ? (
              <p className="suave" style={{ margin: 0 }}>Nenhuma aula cadastrada ainda.</p>
            ) : (
              <div className={styles.tabelaCaixa}>
                <table className={styles.tabela}>
                  <thead><tr><th>Aula</th><th>Título</th><th>Detalhes</th><th>Situação</th><th></th></tr></thead>
                  <tbody>
                    {m.aulas.map((a) => (
                      <tr key={a.id}>
                        <td className="mono">{a.tipo === 'revisao' ? `R${a.numero}` : `A${a.numero}`}</td>
                        <td style={{ fontWeight: 600 }}>{a.titulo}</td>
                        <td className="suave" style={{ fontSize: 14 }}>
                          {[a.video_url ? 'vídeo' : 'sem vídeo', a.pdf_path ? 'PDF' : 'sem PDF'].join(' · ')}
                        </td>
                        <td><span className={`${styles.chip} ${a.publicada ? styles.chipOk : styles.chipNeutro}`}>{a.publicada ? 'Publicada' : 'Rascunho'}</span></td>
                        <td>
                          <form action={alternarAula}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="publicar" value={a.publicada ? 'nao' : 'sim'} />
                            <button className={`btn btn-linha ${styles.mini}`}>{a.publicada ? 'Despublicar' : 'Publicar'}</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      <section aria-labelledby="mod" className={`cartao ${styles.bloco}`}>
        <h2 id="mod" className="display">Novo módulo</h2>
        <FormAcao acao={salvarModulo} botao="Salvar módulo">
          <div className={styles.campos}>
            <div className="campo"><label htmlFor="mnum">Número</label><input id="mnum" name="numero" type="number" min={1} defaultValue={proximo} required /></div>
            <div className="campo"><label htmlFor="mdisc">Disciplina</label><input id="mdisc" name="disciplina" list="mdiscs" required placeholder="Língua Portuguesa" /></div>
            <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor="mtit">Título</label><input id="mtit" name="titulo" type="text" required placeholder="Ex.: Concordância e regência" /></div>
          </div>
          <datalist id="mdiscs">{disciplinas.map((d) => <option key={d} value={d} />)}</datalist>
          <span className="suave" style={{ fontSize: 13.5 }}>Um módulo reúne as aulas de um assunto da disciplina. A mesma aula serve para todos os editais que têm essa disciplina.</span>
        </FormAcao>
      </section>
    </>
  );
}
