import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CartaoProduto } from '@/components/CartaoProduto';
import { CARREIRAS } from '@/lib/noticiasConcursos';
import type { Produto } from '@/lib/loja';
import styles from './noticias.module.css';

// "Quer se preparar melhor?": o curso do edital aberto e os extensivos da carreira (usado na página da carreira e no "Saiba mais")
export async function Ofertas({ carreira }: { carreira: string }) {
  const c = CARREIRAS.find((x) => x.chave === carreira);
  let produtos: Produto[] = []; let abertos: { id: string; nome: string }[] = [];
  try {
    const supabase = await createClient();
    const [p, e] = await Promise.all([
      supabase.from('produtos').select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta, imagem_path, gratuito').eq('carreira', carreira).eq('venda_aberta', true).not('slug', 'like', 'plano-%').order('ordem').order('nome'),
      supabase.from('editais').select('id, nome').eq('carreira', carreira).eq('situacao', 'aberto').eq('publicado', true),
    ]);
    produtos = (p.data ?? []) as Produto[]; abertos = (e.data ?? []) as { id: string; nome: string }[];
  } catch { /* sem conexão */ }
  const ids = new Set(abertos.map((x) => x.id));
  const doEdital = produtos.filter((p) => p.edital_id && ids.has(p.edital_id));
  const gerais = produtos.filter((p) => !doEdital.includes(p)).sort((a, b) => Number(b.destaque) - Number(a.destaque));
  return (
    <section aria-label="Cursos" className={styles.ofertas}>
      <h2 className={`display ${styles.sub}`}>Quer se preparar melhor?</h2>
      {abertos.length > 0 && <p className={styles.aviso}><b>Edital aberto:</b> {abertos.map((e) => e.nome).join(' · ')}</p>}
      {doEdital.length > 0 && <div><h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: 16 }}>Curso para o edital aberto</h3><div className="loja-grade">{doEdital.map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}</div></div>}
      {gerais.length > 0 && <div><h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: 16 }}>{carreira === 'federais' ? 'Cursos para as polícias federais' : 'Cursos extensivos'}</h3><div className="loja-grade">{gerais.map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}</div></div>}
      {produtos.length === 0 && <p className="suave">Os cursos {c ? `de ${c.nome} ` : ''}serão publicados em breve. <Link href="/loja">Ver a loja</Link></p>}
    </section>
  );
}
