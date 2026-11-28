import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { NOTA_MAXIMA, PROPOSTAS, faixaNota } from '@/lib/redacao';
import { AbasRedacao } from '../AbasRedacao';
import s from '../redacao.module.css';

export const metadata = { title: 'Redações-modelo' };
export const dynamic = 'force-dynamic';

type M = { id: string; tema: string; nota: number | null; texto: string; comentario: string | null };

export default async function Modelos() {
  const { supabase } = await exigirCurso();
  const { data } = await supabase.from('redacoes_exemplares').select('id, tema, nota, texto, comentario').eq('publicada', true).order('ordem').order('criado_em', { ascending: false });
  const lista = (data ?? []) as M[];
  const doCurso = PROPOSTAS.filter((p) => p.pdfs);
  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Redações-modelo' }]} />
      <AbasRedacao ativa="modelos" />
      <div className={s.cabeca}>
        <h1 className="display">Redações-modelo</h1>
        <p>Textos de nota alta, com o comentário do professor. Leia prestando atenção na tese, nos argumentos e nos conectivos.</p>
      </div>
      {lista.length === 0 ? <div className={s.vazio}>As redações-modelo comentadas pelo professor vão aparecer aqui.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lista.map((m) => (
            <details key={m.id} className={s.modelo}>
              <summary><b>{m.tema}</b>{m.nota != null && <span className={s.selo} data-tom={faixaNota(m.nota)?.tom}><b>{m.nota}</b><small>de {NOTA_MAXIMA}</small></span>}</summary>
              <div className={s.modeloCorpo}>
                <div className={s.texto}>{m.texto.split(/\n+/).filter((p) => p.trim()).map((p, i) => <p key={i}>{p}</p>)}</div>
                {m.comentario && <div className={s.forte}><h3>Comentário do professor</h3><p>{m.comentario}</p></div>}
              </div>
            </details>
          ))}
        </div>
      )}
      <section className={s.secao} aria-labelledby="curso-t">
        <h2 id="curso-t">Redações-modelo em PDF do Reta Final</h2>
        <div className={s.cartoes}>
          {doCurso.map((p) => (
            <a key={p.slug} href={`/api/curso-pdf/${p.pdfs!.modelo}`} target="_blank" rel="noopener" className={s.cartaoProp}>
              <span className={s.origem} data-o="curso">PDF do curso</span>
              <b>{p.tema}</b>
              <em>Abrir a redação-modelo comentada →</em>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
