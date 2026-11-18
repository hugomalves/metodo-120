import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { CartaoProduto } from '@/components/CartaoProduto';
import { CARREIRAS } from '@/lib/noticiasConcursos';
import type { Produto } from '@/lib/loja';
import styles from '../noticias.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ carreira: string }> }) {
  const { carreira } = await params;
  const c = CARREIRAS.find((x) => x.chave === carreira);
  return { title: c ? `Notícias e cursos · ${c.nome}` : 'Notícias' };
}

type Ed = { id: string; nome: string; data_prova: string | null };

export default async function PaginaCarreira({ params }: { params: Promise<{ carreira: string }> }) {
  const { carreira } = await params;
  const c = CARREIRAS.find((x) => x.chave === carreira);
  if (!c) notFound();
  let noticias: { id: string; titulo: string; fonte: string | null; url: string; publicada_em: string }[] = [];
  let produtos: Produto[] = []; let abertos: Ed[] = [];
  try {
    const supabase = await createClient();
    const [n, p, e] = await Promise.all([
      supabase.from('noticias_concursos').select('id, titulo, fonte, url, publicada_em').eq('carreira', c.chave).eq('oculta', false).order('publicada_em', { ascending: false }).limit(20),
      supabase.from('produtos').select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta, imagem_path, gratuito').eq('carreira', c.chave).eq('venda_aberta', true).not('slug', 'like', 'plano-%').order('ordem').order('nome'),
      supabase.from('editais').select('id, nome, data_prova').eq('carreira', c.chave).eq('situacao', 'aberto').eq('publicado', true).order('data_prova', { nullsFirst: false }),
    ]);
    noticias = n.data ?? []; produtos = (p.data ?? []) as Produto[]; abertos = (e.data ?? []) as Ed[];
  } catch { /* sem conexão */ }
  const idsAbertos = new Set(abertos.map((x) => x.id));
  const doEdital = produtos.filter((p) => p.edital_id && idsAbertos.has(p.edital_id));
  const gerais = produtos.filter((p) => !doEdital.includes(p)).sort((a, b) => Number(b.destaque) - Number(a.destaque));

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
                <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer">{n.titulo}<small>{n.fonte ?? 'Notícia'} · {new Date(n.publicada_em).toLocaleDateString('pt-BR')}</small></a>
              ))}
            </div>
          </section>
          <section aria-labelledby="of" className={styles.ofertas}>
            <h2 id="of" className={`display ${styles.sub}`}>Quer se preparar melhor?</h2>
            {abertos.length > 0 && (
              <p className={styles.aviso}><b>Edital aberto:</b> {abertos.map((e) => e.nome).join(' · ')}</p>
            )}
            {doEdital.length > 0 && (
              <div><h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: 16 }}>Curso para o edital aberto</h3><div className="loja-grade">{doEdital.map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}</div></div>
            )}
            {gerais.length > 0 && (
              <div><h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: 16 }}>{c.chave === 'federais' ? 'Cursos para as polícias federais' : 'Cursos extensivos'}</h3><div className="loja-grade">{gerais.map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}</div></div>
            )}
            {produtos.length === 0 && <p className="suave">Os cursos desta carreira serão publicados em breve. <Link href="/loja">Ver a loja</Link></p>}
          </section>
        </div>
      </main>
    </div>
  );
}
