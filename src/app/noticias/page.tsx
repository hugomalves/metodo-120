import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { CARREIRAS } from '@/lib/noticiasConcursos';
import { Carrossel, type Manchete } from './Carrossel';
import styles from './noticias.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notícias de concurso', description: 'As últimas notícias de concursos das polícias e guardas, atualizadas a cada 2 dias.' };

export default async function Noticias() {
  const porCarreira: Record<string, Manchete[]> = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('noticias_concursos').select('id, carreira, titulo, fonte, url, publicada_em').eq('oculta', false).order('publicada_em', { ascending: false }).limit(200);
    for (const n of (data ?? []) as { id: string; carreira: string; titulo: string; fonte: string | null; url: string; publicada_em: string }[]) {
      (porCarreira[n.carreira] ??= []).length < 8 && porCarreira[n.carreira].push({ id: n.id, titulo: n.titulo, fonte: n.fonte, url: n.url, data: n.publicada_em });
    }
  } catch { /* sem conexão: quadrados vazios */ }
  return (
    <div className={`tema-site ${styles.pagina}`}>
      <Cabecalho />
      <main className={styles.miolo}>
        <div className={styles.topo}>
          <span className="rotulo">Notícias de concurso</span>
          <h1 className="display">O que está acontecendo nos concursos</h1>
          <p>Escolha a sua carreira. As manchetes são atualizadas a cada 2 dias; ao clicar no quadrado, você vê as últimas notícias e os cursos para se preparar.</p>
        </div>
        <div className={styles.grade}>
          {CARREIRAS.map((c) => <Carrossel key={c.chave} chave={c.chave} nome={c.nome} descricao={c.descricao} itens={porCarreira[c.chave] ?? []} />)}
        </div>
      </main>
    </div>
  );
}
