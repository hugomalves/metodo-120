import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { excluirNoticia } from '../actions';
import { FormNoticia, type Noticia } from './FormNoticia';
import styles from '../professor.module.css';

export const metadata = { title: 'Notícias da vitrine · Painel do professor' };

export default async function Noticias() {
  const supabase = await createClient();
  const { data } = await supabase.from('noticias').select('*').order('ordem').order('publicada_em', { ascending: false });
  const noticias = ((data ?? []) as Noticia[]).map((n) => ({
    ...n, imagem: n.imagem_path ? supabase.storage.from('vitrine').getPublicUrl(n.imagem_path).data.publicUrl : null,
  }));
  const publicadas = noticias.filter((n) => n.publicada).length;

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Notícias da vitrine' }]} />
      <h1 className={`display ${styles.titulo}`}>Notícias da vitrine</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>
        As notícias publicadas passam no destaque principal da página inicial, na ordem do campo "Ordem" (menor primeiro).
        O ideal são 5 ou 6. Sem imagem, a notícia aparece com a foto do expert. {publicadas ? `Hoje passam ${publicadas}.` : 'Nenhuma publicada: a vitrine mostra a apresentação do Método 120.'}
      </p>

      <section className={`cartao ${styles.bloco}`} aria-labelledby="nova" style={{ borderColor: 'var(--azul)' }}>
        <h2 id="nova" className="display">Nova notícia</h2>
        <FormNoticia />
      </section>

      {noticias.map((n) => (
        <details key={n.id} className={`cartao ${styles.bloco}`}>
          <summary style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`${styles.chip} ${n.publicada ? styles.chipOk : styles.chipNeutro}`}>{n.publicada ? 'Publicada' : 'Rascunho'}</span>
            <b>{n.ordem}. {n.titulo}</b>
            {n.rotulo && <span className="suave">· {n.rotulo}</span>}
          </summary>
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormNoticia key={JSON.stringify(n)} n={n} />
            <form action={excluirNoticia}>
              <input type="hidden" name="id" value={n.id} />
              <button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Excluir esta notícia</button>
            </form>
          </div>
        </details>
      ))}
    </>
  );
}
