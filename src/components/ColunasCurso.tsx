import { VIDEOS_CURSO, urlVideoCurso } from '@/lib/videos-curso';
import styles from './ColunasCurso.module.css';

// Três colunas lado a lado na página do curso, cada uma com um vídeo curto repetindo, sem som.
// Se nenhum vídeo foi enviado ainda, a seção não aparece.
export function ColunasCurso({ videos }: { videos: Record<string, string | null> }) {
  if (!VIDEOS_CURSO.some((v) => videos[v.chave])) return null;
  return (
    <section className={styles.secao} aria-labelledby="recebe">
      <h2 id="recebe" className="display">O que você recebe</h2>
      <div className={styles.colunas}>
        {VIDEOS_CURSO.map((v) => {
          const url = urlVideoCurso(videos[v.chave]);
          return (
            <div key={v.chave} className={styles.coluna}>
              <div className={styles.quadro}>
                {url ? (
                  <video src={url} autoPlay loop muted playsInline preload="metadata" disablePictureInPicture aria-hidden="true" />
                ) : (
                  <span className={styles.vazio}>{v.rotulo}</span>
                )}
              </div>
              <h3>{v.titulo}</h3>
              <p>{v.texto}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
