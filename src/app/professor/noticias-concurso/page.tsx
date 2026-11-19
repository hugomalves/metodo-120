import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { CARREIRAS } from '@/lib/noticiasConcursos';
import { buscarNoticiasAgora, ocultarNoticiaConcurso, excluirNoticiaConcurso, adicionarNoticiaConcurso, escreverResumosAgora, salvarTextoNoticia, excluirImagemNoticia } from './acoes';
import { FormImagem } from './FormImagem';
import { urlImagemNoticia } from '@/lib/noticiasImagens';
import styles from '../professor.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notícias de concurso · Painel do professor' };

type N = { resumo: string | null; texto: string | null; id: string; carreira: string; titulo: string; fonte: string | null; url: string; publicada_em: string; oculta: boolean; origem: string };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { r } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('noticias_concursos').select('id, carreira, titulo, fonte, url, publicada_em, oculta, origem, resumo, texto').order('publicada_em', { ascending: false }).limit(150);
  const lista = (data ?? []) as N[];
  const { data: imgs } = await supabase.from('noticias_imagens').select('id, rotulo, palavras, carreira, imagem_path').order('criada_em', { ascending: false });
  const imagens = (imgs ?? []) as { id: string; rotulo: string; palavras: string[]; carreira: string | null; imagem_path: string }[];
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Notícias de concurso' }]} />
      <h1 className={`display ${styles.titulo}`}>Notícias de concurso</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>
        Aparecem na aba <b>Notícias</b> do site. A busca automática roda a cada 2 dias (Google Notícias); você pode rodar agora, esconder o que não serve ou acrescentar uma notícia à mão.
      </p>
      {r && <p className="cartao" style={{ padding: 12 }}>{r}</p>}
      <section className={`cartao ${styles.bloco}`}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <form action={buscarNoticiasAgora}><button className="btn btn-primario">Buscar notícias agora</button></form>
          <form action={escreverResumosAgora}><button className="btn btn-linha">Escrever resumos que faltam (IA)</button></form>
        </div>
      </section>
      <section className={`cartao ${styles.bloco}`} aria-labelledby="imgs">
        <h2 id="imgs" className="display">Imagens das notícias</h2>
        <p className="suave" style={{ margin: 0 }}>Cada notícia usa a imagem do assunto cuja palavra aparece no título (a palavra mais longa vence). Sem palavra que bata, usa a imagem padrão do quadrado.</p>
        <FormImagem />
        {imagens.map((im) => (
          <div key={im.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--borda, #e5e7eb)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlImagemNoticia(im.imagem_path) ?? ''} alt="" style={{ width: 96, height: 56, objectFit: 'cover' }} />
            <b>{im.rotulo}</b>
            <span className="suave" style={{ flex: 1 }}>{im.palavras.length ? im.palavras.join(', ') : `Padrão do quadrado: ${CARREIRAS.find((c) => c.chave === im.carreira)?.nome ?? ''}`}</span>
            <form action={excluirImagemNoticia}><input type="hidden" name="id" value={im.id} /><button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Excluir</button></form>
          </div>
        ))}
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
          <details style={{ flexBasis: '100%' }}>
            <summary style={{ cursor: 'pointer' }}>{n.resumo ? 'Editar o texto' : 'Escrever o texto (falta)'}</summary>
            <form action={salvarTextoNoticia} style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
              <input type="hidden" name="id" value={n.id} />
              <label>Texto curto (aparece no quadrado, até 220 caracteres)<input name="resumo" maxLength={220} defaultValue={n.resumo ?? ''} style={{ width: '100%' }} /></label>
              <label>Texto da página &quot;Saiba mais&quot; (escreva com as suas palavras)<textarea name="texto" rows={4} maxLength={1200} defaultValue={n.texto ?? ''} style={{ width: '100%' }} /></label>
              <div><button className="btn btn-linha">Salvar texto</button></div>
            </form>
          </details>
        </div>
      ))}
    </>
  );
}
