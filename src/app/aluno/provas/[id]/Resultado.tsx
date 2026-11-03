import Link from 'next/link';
import type { ReactNode } from 'react';
import type { QuestaoCompleta } from '@/lib/questao';
import { alternativasDe, origemQuestao, TextoBaseCaixa } from '@/components/CartaoQuestao';
import { TextoAlternativa, TextoRico } from '@/components/TextoRico';
import s from '../../aluno.module.css';

export type Resultado = {
  acertos: number; total: number; em_branco: number; erros: number; minimo_total: number; ok_total: boolean; classificado: boolean; tem_regra: boolean;
  regra_zerar: boolean; zeradas: string[];
  blocos: { bloco: string; acertos: number; total: number; minimo: number; ok: boolean }[];
  disciplinas: { disciplina: string; bloco: string; acertos: number; total: number }[];
};
export type Gabarito = { questao_id: string; resposta: string; comentario: string | null; video_url: string | null };

// Resultado do simulado: placar, regra de corte do edital, desempenho por bloco e disciplina, correção comentada
export function ResultadoProva({ titulo, respostas, r, questoes, gabarito, caminho }: {
  titulo: string; respostas: string; r: Resultado; questoes: QuestaoCompleta[]; gabarito: Map<string, Gabarito>; caminho?: ReactNode;
}) {
  const prova = { titulo, respostas };
  const pct = Math.round((100 * r.acertos) / Math.max(1, r.total));
  const motivos = [
    ...r.blocos.filter((b) => !b.ok).map((b) => `${b.bloco}: ${b.acertos} de ${b.total}, o mínimo é ${b.minimo}`),
    ...(!r.ok_total ? [`Total: ${r.acertos} de ${r.total}, o mínimo é ${r.minimo_total}`] : []),
    ...(r.regra_zerar ? r.zeradas.map((d) => `Zerou ${d}`) : []),
  ];

  return (
    <>
      {caminho}
      <div className={s.cabeca}>
        <span className="rotulo">Resultado</span>
        <h1 className={`display ${s.titulo}`} style={{ fontSize: 'clamp(22px, 2.8vw, 30px)' }}>{prova.titulo}</h1>
      </div>

      <section className="cartao-gradiente pv-placar">
        <div><span className="rotulo">Acertos</span><b className="display">{r.acertos}<small>/{r.total}</small></b><span>{pct}%</span></div>
        <div><span className="rotulo">Erros</span><b className="display">{r.erros}</b></div>
        <div><span className="rotulo">Em branco</span><b className="display">{r.em_branco}</b></div>
        {r.tem_regra && (
          <div className="pv-corte" data-ok={r.classificado ? 'sim' : 'nao'}>
            <b>{r.classificado ? 'Você passaria na regra de corte' : 'Abaixo da regra de corte'}</b>
            {r.classificado ? <span>Mínimo por bloco e no total atingidos, sem zerar disciplina.</span> : <ul>{motivos.map((m) => <li key={m}>{m}</li>)}</ul>}
          </div>
        )}
      </section>

      <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="disc">
        <h2 id="disc" className="display" style={{ margin: 0, fontSize: 19 }}>Por bloco e disciplina</h2>
        {r.blocos.map((b) => (
          <div key={b.bloco} className="pv-bloco">
            <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
              <b>{b.bloco}</b>
              <span className="mono" style={{ color: b.ok ? '#15803d' : 'var(--erro)' }}>{b.acertos}/{b.total}{b.minimo ? ` · mínimo ${b.minimo}` : ''}</span>
            </div>
            {r.disciplinas.filter((d) => d.bloco === b.bloco).map((d) => {
              const p = Math.round((100 * d.acertos) / Math.max(1, d.total));
              return (
                <div key={d.disciplina} className="linha-flex" style={{ flexWrap: 'nowrap', gap: 12 }}>
                  <span style={{ flex: '0 1 260px', minWidth: 0 }}>{d.disciplina}</span>
                  <span className={s.trilho} style={{ flex: 1 }}><span style={{ width: `${p}%`, background: d.acertos === 0 ? 'var(--erro)' : p >= 60 ? 'var(--azul)' : 'var(--laranja)' }} /></span>
                  <span className="mono" style={{ width: 60, textAlign: 'right' }}>{d.acertos}/{d.total}</span>
                  <Link href={`/aluno/questoes/listas?d=${encodeURIComponent(d.disciplina)}`} style={{ fontSize: 13.5, whiteSpace: 'nowrap' }}>Treinar</Link>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className={s.grupo} aria-labelledby="corr">
        <h2 id="corr" className="display">Correção comentada</h2>
        {questoes.map((q, i) => {
          const g = gabarito.get(q.id);
          const minha = prova.respostas[i] ?? '-';
          const ok = minha === g?.resposta;
          return (
            <article key={q.id} className="q-cartao" id={`pq-${i + 1}`}>
              <header className="q-cabeca">
                <div style={{ minWidth: 0 }}>
                  <span className="q-num">Questão {i + 1} · {q.disciplina}</span>
                  <span className="q-origem">{origemQuestao(q)}</span>
                </div>
                <span className={`pv-selo`} data-ok={minha === '-' ? 'branco' : ok ? 'sim' : 'nao'}>{minha === '-' ? 'Em branco' : ok ? 'Acertou' : 'Errou'}</span>
              </header>
              <div className="q-corpo">
                {q.textoBase && (i === 0 || questoes[i - 1].textoBase?.id !== q.textoBase.id) && <TextoBaseCaixa q={q} />}
                <TextoRico texto={q.enunciado} figuras={q.figuras} />
                <div className="q-alts">
                  {alternativasDe(q).map((a) => (
                    <div key={a.letra} className="q-alt" data-estado={a.letra === g?.resposta ? 'certa' : a.letra === minha ? 'errada' : ''}>
                      <div className="q-alt-botao"><b className="q-letra">{a.letra}</b><span className="q-alt-texto">{a.texto ? <TextoAlternativa texto={a.texto} figuras={q.figuras} /> : null}</span></div>
                    </div>
                  ))}
                </div>
                {g?.comentario && <div className="q-resolucao-texto"><TextoRico texto={g.comentario} /></div>}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
