import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { HABILIDADES, codigoValido } from '@/lib/habilidades';
import { alternarMaterial, excluirMaterial } from '../../actions';
import { FormMaterial } from './FormMaterial';
import styles from '../../professor.module.css';

export const metadata = { title: 'Materiais da habilidade · Painel do professor' };

type M = { id: string; tipo: string; titulo: string; video_url: string | null; pdf_path: string | null; gabarito_pdf_path: string | null; ordem: number; publicada: boolean };

export default async function MateriaisHabilidade({ params }: { params: Promise<{ cod: string }> }) {
  const cod = (await params).cod.toUpperCase();
  if (!codigoValido(cod)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from('materiais_habilidade')
    .select('id, tipo, titulo, video_url, pdf_path, gabarito_pdf_path, ordem, publicada').eq('habilidade', cod).order('tipo').order('ordem').order('criado_em');
  const mats = (data ?? []) as M[];

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Habilidades e listas', href: '/professor/habilidades' }, { rotulo: cod }]} />
      <h1 className={`display ${styles.titulo}`}>{cod}</h1>
      <p style={{ margin: 0, maxWidth: '72ch', color: 'var(--texto-2)' }}>{HABILIDADES[cod]}</p>

      <section className={`cartao ${styles.bloco}`} style={{ borderColor: 'var(--ciano)' }} aria-labelledby="novo">
        <h2 id="novo" className="display">Adicionar aula ou lista</h2>
        <FormMaterial habilidade={cod} />
      </section>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="mats">
        <h2 id="mats" className="display">Materiais da {cod}</h2>
        {mats.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nada cadastrado ainda.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Tipo</th><th>Título</th><th>Arquivos</th><th>Situação</th><th></th></tr></thead>
              <tbody>
                {mats.map((m) => (
                  <tr key={m.id}>
                    <td>{m.tipo === 'aula' ? 'Aula' : 'Lista'}</td>
                    <td style={{ fontWeight: 600 }}>{m.titulo}</td>
                    <td className="suave" style={{ fontSize: 14 }}>{[m.video_url && 'vídeo', m.pdf_path && 'PDF', m.gabarito_pdf_path && 'gabarito'].filter(Boolean).join(' · ') || '–'}</td>
                    <td><span className={`${styles.chip} ${m.publicada ? styles.chipOk : styles.chipNeutro}`}>{m.publicada ? 'Publicado' : 'Oculto'}</span></td>
                    <td>
                      <div className="linha-flex" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <form action={alternarMaterial}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="publicar" value={m.publicada ? 'nao' : 'sim'} />
                          <button className={`btn btn-linha ${styles.mini}`}>{m.publicada ? 'Ocultar' : 'Publicar'}</button>
                        </form>
                        <form action={excluirMaterial}>
                          <input type="hidden" name="id" value={m.id} />
                          <button className={`btn btn-linha ${styles.mini}`} style={{ color: 'var(--erro)' }}>Excluir</button>
                        </form>
                      </div>
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
