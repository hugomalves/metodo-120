import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import styles from '../noticias/noticias.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Materiais grátis', description: 'PDFs gratuitos do Método 120 para você estudar agora.' };

type M = { id: string; titulo: string; descricao: string | null };

export default async function Materiais() {
  let lista: M[] = []; let logado = false;
  try {
    const supabase = await createClient();
    const [{ data: { user } }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('materiais_gratuitos').select('id, titulo, descricao').eq('publicado', true).order('ordem').order('criado_em', { ascending: false }),
    ]);
    logado = !!user; lista = (data ?? []) as M[];
  } catch { /* sem conexão */ }
  return (
    <div className={`tema-site ${styles.pagina}`}>
      <Cabecalho />
      <main className={styles.miolo}>
        <div className={styles.topo}>
          <span className="rotulo">Materiais grátis</span>
          <h1 className="display">Estude agora, sem pagar</h1>
          <p>PDFs gratuitos do Método 120. {logado ? 'Clique para baixar: o arquivo sai com o seu nome na marca d’água.' : 'Para baixar, crie a sua conta grátis: leva 1 minuto.'}</p>
        </div>
        {lista.length === 0 && <p className="suave">Os materiais serão publicados em breve.</p>}
        <div className={styles.grade}>
          {lista.map((m) => (
            <article key={m.id} className={`${styles.quadro} ${styles.corte}`} style={{ minHeight: 0 }}>
              <span className="rotulo">PDF grátis</span>
              <h2 className="display" style={{ margin: 0, fontSize: 24, color: '#fff' }}>{m.titulo}</h2>
              {m.descricao && <p className={styles.desc} style={{ fontSize: 15 }}>{m.descricao}</p>}
              <a href={`/api/gratis/${m.id}`} target={logado ? '_blank' : undefined} rel="noopener" className={styles.preparar}>{logado ? 'Baixar PDF →' : 'Criar conta e baixar →'}</a>
            </article>
          ))}
        </div>
        <p className="suave" style={{ fontSize: 14 }}>Quer o plano completo? <Link href="/loja">Veja os cursos</Link>.</p>
      </main>
    </div>
  );
}
