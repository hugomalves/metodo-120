import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { CARREIRAS } from '@/lib/noticiasConcursos';
import { Ofertas } from '../Ofertas';
import styles from '../noticias.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ carreira: string }> }) {
  const { carreira } = await params;
  const c = CARREIRAS.find((x) => x.chave === carreira);
  return { title: c ? `Notícias e cursos · ${c.nome}` : 'Notícias' };
}

export default async function PaginaCarreira({ params }: { params: Promise<{ carreira: string }> }) {
  const { carreira } = await params;
  const c = CARREIRAS.find((x) => x.chave === carreira);
  if (!c) notFound();
  let noticias: { id: string; titulo: string; resumo: string | null; fonte: string | null; publicada_em: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('noticias_concursos').select('id, titulo, resumo, fonte, publicada_em').eq('carreira', c.chave).eq('oculta', false).order('publicada_em', { ascending: false }).limit(20);
    noticias = data ?? [];
  } catch { /* sem conexão */ }
  return (
    <div className={`tema-site ${styles.pagina}`}>
      <Cabecalho />
      <main className={styles.miolo}>
        <div className={styles.topo}>
          <Link href="/noticias" className={styles.voltar}>← Todas as carreiras</Link>
          <span className="rotulo">Notícias e cursos</span>
          <h1 className="display">{c.nome}</h1>
          <p>{c.descricao}</p>
        </div>
        <div className={styles.cols}>
          <section aria-labelledby="not">
            <h2 id="not" className={`display ${styles.sub}`}>Últimas notícias</h2>
            <div className={styles.lista}>
              {noticias.length === 0 && <p className="suave">Ainda não há notícias desta carreira.</p>}
              {noticias.map((n) => (
                <Link key={n.id} href={`/noticias/n/${n.id}`}>{n.titulo}{n.resumo && <span style={{ fontWeight: 400, color: '#a7afbd', fontSize: 14 }}>{n.resumo}</span>}<small>Fonte: {n.fonte ?? 'imprensa'} · {new Date(n.publicada_em).toLocaleDateString('pt-BR')}</small></Link>
              ))}
            </div>
          </section>
          <Ofertas carreira={c.chave} />
        </div>
      </main>
    </div>
  );
}
