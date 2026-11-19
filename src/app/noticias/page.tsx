import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { CARREIRAS, imagemDaNoticia } from '@/lib/noticiasConcursos';
import { carregarImagensAssunto, urlImagemNoticia } from '@/lib/noticiasImagens';
import { Carrossel, type Manchete } from './Carrossel';
import styles from './noticias.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notícias de concurso', description: 'As últimas notícias de concursos das polícias e guardas, atualizadas a cada 2 dias.' };

export default async function Noticias() {
  const porCarreira: Record<string, Manchete[]> = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('noticias_concursos').select('id, carreira, titulo, resumo, fonte, imagem_path, publicada_em').eq('oculta', false).order('publicada_em', { ascending: false }).limit(200);
    const imagens = await carregarImagensAssunto(supabase);
    for (const n of (data ?? []) as { id: string; carreira: string; titulo: string; resumo: string | null; fonte: string | null; imagem_path: string | null; publicada_em: string }[]) {
      (porCarreira[n.carreira] ??= []).length < 8 && porCarreira[n.carreira].push({ id: n.id, titulo: n.titulo, resumo: n.resumo, fonte: n.fonte, data: n.publicada_em, imagem: urlImagemNoticia(imagemDaNoticia(n, imagens)) });
    }
  } catch { /* sem conexão: quadrados vazios */ }
  return (
    <div className={`tema-site ${styles.pagina}`}>
      <Cabecalho />
      <main className={styles.miolo}>
        <div className={styles.topo}>
          <span className="rotulo">Notícias de concurso</span>
          <h1 className="display">O que está acontecendo nos concursos</h1>
          <p>Escolha a sua carreira. As manchetes são atualizadas a cada 2 dias; clique em “Saiba mais” para entender a notícia e ver os cursos para se preparar.</p>
        </div>
        <div className={styles.grade}>
          {CARREIRAS.map((c) => <Carrossel key={c.chave} chave={c.chave} nome={c.nome} descricao={c.descricao} itens={porCarreira[c.chave] ?? []} />)}
        </div>
      </main>
    </div>
  );
}
