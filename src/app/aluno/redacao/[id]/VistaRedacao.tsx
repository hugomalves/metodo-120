import Link from 'next/link';
import { ArquivoRedacao } from '@/components/ArquivoRedacao';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CRITERIOS, NOTA_MAXIMA, dataBR, estimarLinhas, faixaNota, propostaPorSlug } from '@/lib/redacao';
import { AbasRedacao } from '../AbasRedacao';
import { apagarRedacao } from '../acoes';
import s from '../redacao.module.css';

export type R = {
  id: string; tema: string; proposta: string | null; texto: string | null; arquivo_path: string | null; status: string;
  c1: number | null; c2: number | null; c3: number | null; c4: number | null; nota: number | null; zerada: boolean; motivo_zero: string | null;
  pontos_fortes: string | null; pontos_melhorar: string | null; comentarios: Record<string, string>; enviada_em: string; corrigida_em: string | null;
};

// Uma redação do aluno: o texto (ou o arquivo) e a correção nos 4 critérios
export function VistaRedacao({ r, arquivoUrl, enviada }: { r: R; arquivoUrl: string | null; enviada: boolean }) {
  const corrigida = r.status === 'corrigida';
  const faixa = faixaNota(r.nota);
  const proposta = propostaPorSlug(r.proposta);

  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Minhas correções', href: '/aluno/redacao/minhas' }, { rotulo: 'Redação' }]} />
      <AbasRedacao ativa="minhas" />
      {enviada && !corrigida && <p className="ok" role="status">Redação enviada! O professor vai corrigir e a nota aparece nesta tela.</p>}
      <div className={s.cabeca}>
        <span className="rotulo">{corrigida ? `Corrigida em ${dataBR(r.corrigida_em ?? r.enviada_em)}` : 'Em correção pelo professor'}</span>
        <h1 className="display">{r.tema}</h1>
        {proposta && <p><Link href={`/aluno/redacao/propostas/${proposta.slug}`}>Rever a proposta e o texto motivador</Link></p>}
      </div>
      <div className={s.duas}>
        <article className={s.texto} aria-label="Sua redação">
          {r.arquivo_path ? <ArquivoRedacao url={arquivoUrl} caminho={r.arquivo_path} /> : (r.texto ?? '').split(/\n+/).filter((p) => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
          {r.texto && <p className="suave" style={{ textIndent: 0, fontSize: 13.5, marginTop: 16 }}>≈ {estimarLinhas(r.texto)} linhas na folha · enviada em {dataBR(r.enviada_em)}</p>}
          {!corrigida && (
            <form action={apagarRedacao} style={{ marginTop: 16 }}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btn-linha">Excluir esta redação</button>
              <span className="suave" style={{ fontSize: 13, display: 'block', marginTop: 6 }}>Excluir não devolve o envio deste mês.</span>
            </form>
          )}
        </article>
        <aside className={s.critCorr} aria-label="Correção">
          {!corrigida ? <div className={s.painel}><h3>Aguardando correção</h3><p className="suave">Quando o professor terminar, a nota de cada critério e os comentários aparecem aqui.</p></div> : (
            <>
              <div className={s.notaFinal} data-tom={faixa?.tom}>
                <b>{r.nota}</b>
                <div><small>Nota final · de {NOTA_MAXIMA}</small><span>{r.zerada ? 'Redação zerada' : faixa?.rotulo}</span></div>
              </div>
              {r.zerada && <div className={s.zerada}><b>Motivo:</b> {r.motivo_zero || 'não informado'}. Na prova, isso elimina o candidato. Leia o comentário do professor abaixo.</div>}
              {CRITERIOS.map((c) => (
                <div key={c.n} className={s.critItem}>
                  <div className={s.critTopo}><span>{c.n}. {c.nome}</span><b>{r[`c${c.n}` as 'c1'] ?? 0}<small className="suave" style={{ fontSize: 13 }}>/10</small></b></div>
                  <div className={s.trilho}><div className={s.enchido} style={{ width: `${((r[`c${c.n}` as 'c1'] ?? 0) / 10) * 100}%` }} /></div>
                  <p>{r.comentarios?.['c' + c.n] || c.dica}</p>
                </div>
              ))}
              {r.pontos_fortes && <div className={s.forte}><h3>Pontos fortes</h3><p>{r.pontos_fortes}</p></div>}
              {r.pontos_melhorar && <div className={s.melhorar}><h3>Para subir a nota</h3><p>{r.pontos_melhorar}</p></div>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
