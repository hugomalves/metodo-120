import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { CARREIRAS } from '@/lib/noticiasConcursos';
import { buscarNoticiasAgora, ocultarNoticiaConcurso, excluirNoticiaConcurso, adicionarNoticiaConcurso } from './acoes';
import styles from '../professor.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notícias de concurso · Painel do professor' };

type N = { id: string; carreira: string; titulo: string; fonte: string | null; url: string; publicada_em: string; oculta: boolean; origem: string };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('noticias_concursos').select('id, carreira, titulo, fonte, url, publicada_em, oculta, origem').order('publicada_em', { ascending: false }).limit(150);
  const lista = (data ?? []) as N[];
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Notícias de concurso' }]} />
      <h1 className={`display ${styles.titulo}`}>Notícias de concurso</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>
        Aparecem na aba <b>Notícias</b> do site. A busca automática roda a cada 2 dias (Google Notícias); você pode rodar agora, esconder o que não serve ou acrescentar uma notícia à mão.
      </p>
      {r && <p className="cartao" style={{ padding: 12 }}>{r}</p>}
      <section className={`cartao ${styles.bloco}`}>
        <form action={buscarNoticiasAgora}><button className="btn btn-primario">Buscar notícias agora</button></form>
      </section>
      <section className={`cartao ${styles.bloco}`} aria-labelledby="add">
        <h2 id="add" className="display">Acrescentar notícia</h2>
        <form action={adicionarNoticiaConcurso} className={styles.campos}>
          <div className="campo"><label htmlFor="nc">Carreira</label><select id="nc" name="carreira">{CARREIRAS.map((c) => <option key={c.chave} value={c.chave}>{c.nome}</option>)}</select></div>
          <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor="nt">Título</label><input id="nt" name="titulo" required maxLength={200} /></div>
          <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor="nu">Link (https://…)</label><input id="nu" name="url" required type="url" /></div>
          <div className="campo"><label htmlFor="nf">Fonte</label><input id="nf" name="fonte" maxLength={60} /></div>
          <div><button className="btn btn-primario">Acrescentar</button></div>
        </form>
      </section>
      {lista.map((n) => (
        <div key={n.id} className="cartao" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', opacity: n.oculta ? 0.5 : 1 }}>
          <span className={`${styles.chip} ${styles.chipNeutro}`}>{CARREIRAS.find((c) => c.chave === n.carreira)?.curto ?? n.carreira}</span>
          <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 240 }}>{n.titulo}</a>
          <span className="suave">{n.fonte ?? ''} · {new Date(n.publicada_em).toLocaleDateString('pt-BR')}{n.origem === 'manual' ? ' · manual' : ''}</span>
          <form action={ocultarNoticiaConcurso}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="oculta" value={n.oculta ? '' : 'sim'} /><button className="btn btn-linha">{n.oculta ? 'Mostrar' : 'Esconder'}</button></form>
          <form action={excluirNoticiaConcurso}><input type="hidden" name="id" value={n.id} /><button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Excluir</button></form>
        </div>
      ))}
    </>
  );
}
