import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { salvarVideosCurso } from '../actions';
import { FormAcao } from '../FormAcao';
import { VIDEOS_CURSO, carregarVideosCurso, urlVideoCurso } from '@/lib/videos-curso';
import { CampoVideoCurso } from './CampoVideoCurso';
import styles from '../professor.module.css';

export const metadata = { title: 'Vídeos da página do curso · Painel do professor' };

export default async function VideosCurso() {
  const supabase = await createClient();
  const videos = await carregarVideosCurso(supabase);
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Vídeos da página do curso' }]} />
      <h1 className={`display ${styles.titulo}`}>Vídeos da página do curso</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        Três vídeos curtos, sem som, que ficam repetindo lado a lado na página de todos os cursos (seção "O que você recebe").
        São os mesmos para todos os cursos. Enquanto nenhum vídeo for enviado, a seção não aparece.
      </p>
      <section className={`cartao ${styles.bloco}`} style={{ borderColor: 'var(--azul)' }}>
        <FormAcao key={JSON.stringify(videos)} acao={salvarVideosCurso} botao="Salvar vídeos">
          {VIDEOS_CURSO.map((v) => (
            <CampoVideoCurso key={v.chave} chave={v.chave} titulo={v.titulo} ajuda={v.ajuda} url={urlVideoCurso(videos[v.chave])} />
          ))}
        </FormAcao>
      </section>
    </>
  );
}
