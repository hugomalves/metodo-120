import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { CARREIRAS, imagemDaNoticia } from '@/lib/noticiasConcursos';
import { carregarImagensAssunto, urlImagemNoticia } from '@/lib/noticiasImagens';
import { Ofertas } from '../../Ofertas';
import styles from '../../noticias.module.css';

export const dynamic = 'force-dynamic';

type N = { id: string; carreira: string; titulo: string; resumo: string | null; texto: string | null; fonte: string | null; url: string; imagem_path: string | null; publicada_em: string };

async function carregar(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('noticias_concursos').select('id, carreira, titulo, resumo, texto, fonte, url, imagem_path, publicada_em').eq('id', id).eq('oculta', false).maybeSingle();
  if (!data) return null;
  const n = data as N;
  return { n, imagem: urlImagemNoticia(imagemDaNoticia(n, await carregarImagensAssunto(supabase))) };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const r = await carregar((await params).id);
  return { title: r ? r.n.titulo : 'Notícia', description: r?.n.resumo ?? undefined };
}

export default async function Noticia({ params }: { params: Promise<{ id: string }> }) {
  const r = await carregar((await params).id);
  if (!r) notFound();
  const { n, imagem } = r;
  const c = CARREIRAS.find((x) => x.chave === n.carreira);
  return (
    <div className={`tema-site ${styles.pagina}`}>
      <Cabecalho />
      <main className={styles.miolo}>
        <div className={styles.topo}>
          <Link href={`/noticias/${n.carreira}`} className={styles.voltar}>← {c?.nome ?? 'Notícias'}</Link>
        </div>
        <div className={styles.cols}>
          <article className={styles.corpo}>
            <div className={`${styles.foto} ${styles.fotoGrande}`} style={imagem ? { backgroundImage: `url(${imagem})` } : undefined}>
              <h1 className={styles.titulo} style={{ margin: 0, fontSize: 'clamp(24px, 3.2vw, 36px)' }}>{n.titulo}</h1>
            </div>
            <small className={styles.fonte}>Fonte: {n.fonte ?? 'imprensa'} · {new Date(n.publicada_em).toLocaleDateString('pt-BR')}</small>
            {n.resumo && <p style={{ fontWeight: 600, color: '#fff' }}>{n.resumo}</p>}
            {n.texto && <p>{n.texto}</p>}
            {!n.resumo && !n.texto && <p>Notícia publicada por {n.fonte ?? 'veículo de imprensa'}. Acompanhe o edital e comece a estudar agora: quem se prepara antes do edital sai na frente.</p>}
            <a href={n.url} target="_blank" rel="noopener noreferrer nofollow" className={styles.original}>Ler a matéria original em {n.fonte ?? 'site de origem'}</a>
          </article>
          <Ofertas carreira={n.carreira} />
        </div>
      </main>
    </div>
  );
}
