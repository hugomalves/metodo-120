import Link from 'next/link';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CRITERIOS, MOTIVOS_ZERO, NOTA_MAXIMA, NOTA_MINIMA, dataBR, faixaNota } from '@/lib/redacao';
import { AbasRedacao } from './AbasRedacao';
import s from './redacao.module.css';

export type Red = { id: string; tema: string; status: string; nota: number | null; zerada: boolean; c1: number | null; c2: number | null; c3: number | null; c4: number | null; enviada_em: string };
export type Media = { redacoes: number; c1: number | null; c2: number | null; c3: number | null; c4: number | null; nota: number | null };

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (n: number | null) => (n == null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));

// Home da redação: chamada, números do mês, desempenho, últimas redações e como a AOCP corrige
export function VistaHome({ nome, erro, lista, limite, usadas, plataforma: p }: { nome: string; erro: boolean; lista: Red[]; limite: number; usadas: number; plataforma: Media | null }) {
  const corrigidas = lista.filter((r) => r.status === 'corrigida' && r.nota != null);
  const minhaMedia = media(corrigidas.map((r) => r.nota as number));
  const validas = corrigidas.filter((r) => !r.zerada);
  const meuCrit = CRITERIOS.map((c) => media(validas.map((r) => r[`c${c.n}` as 'c1'] as number)));
  const platCrit = CRITERIOS.map((c) => (p && p.redacoes > 0 ? Number(p[`c${c.n}` as 'c1']) : null));
  const evolucao = corrigidas.slice(0, 8).reverse();
  const ultimas = lista.slice(0, 4);

  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação' }]} />
      <AbasRedacao ativa="home" />
      {erro && <p className="erro" role="alert">A redação ainda não foi ativada. Avise a equipe.</p>}

      <section className={s.hero} aria-labelledby="hero-t">
        <div className={s.heroTexto}>
          <span className={s.heroRotulo}>Redação PM PE · Instituto AOCP</span>
          <h1 id="hero-t">{nome}, treine a redação do jeito que a banca corrige</h1>
          <p>Escreva sobre uma proposta, envie digitada ou em foto da folha e receba a nota nos 4 critérios da AOCP, com comentários do professor.</p>
          <div className={s.chips}><span>15 a 20 linhas</span><span>4 critérios × 10</span><span>Nota de 0 a 40</span><span>Mínimo 12</span></div>
          <div className={s.heroBotoes}>
            <Link href="/aluno/redacao/nova" className={s.btVerde}>Escrever nova redação</Link>
            <Link href="/aluno/redacao/propostas" className={s.btClaro}>Ver propostas</Link>
          </div>
        </div>
        <div className={s.heroNumeros}>
          <div className={s.num}><small>Neste mês</small><b>{usadas}/{limite}</b><span>envios</span></div>
          <div className={s.num}><small>Corrigidas</small><b>{corrigidas.length}</b><span>no total</span></div>
          <div className={s.num}><small>Sua média</small><b>{fmt(minhaMedia)}</b><span>{minhaMedia == null ? 'após a 1ª nota' : `de ${NOTA_MAXIMA}`}</span></div>
        </div>
      </section>

      <div className={s.chamadaAulas}>
        <div><b>Redação é o seu ponto fraco? Comece pelas aulas.</b><span>8 semanas do zero à redação completa, com modelos prontos e uma redação por semana.</span></div>
        <Link href="/aluno/redacao/aulas" className="btn btn-azul">Ver as aulas</Link>
      </div>

      <section className={s.secao} aria-labelledby="des-t">
        <div className={s.secaoTopo}><h2 id="des-t">Seu desempenho</h2>{corrigidas.length > 0 && <Link href="/aluno/redacao/minhas">Ver todas as correções</Link>}</div>
        {corrigidas.length === 0 ? (
          <div className={s.vazio}>Seu desempenho aparece aqui depois da primeira correção. <Link href="/aluno/redacao/nova">Escreva a primeira redação</Link>.</div>
        ) : (
          <div className={s.duasCol}>
            <div className={s.painel}>
              <h3>Média por critério (0 a 10)</h3>
              <div className={s.barras}>
                {CRITERIOS.map((c, i) => (
                  <div key={c.n} className={s.barra}>
                    <span>{c.nome}</span>
                    <div className={s.trilho} role="img" aria-label={`Você ${fmt(meuCrit[i])}${platCrit[i] != null ? `, média da plataforma ${fmt(platCrit[i])}` : ''}`}>
                      <div className={s.enchido} style={{ width: `${((meuCrit[i] ?? 0) / 10) * 100}%` }} />
                      {platCrit[i] != null && <div className={s.marcaPlat} style={{ left: `calc(${((platCrit[i] as number) / 10) * 100}% - 1px)` }} />}
                    </div>
                    <b>{fmt(meuCrit[i])}</b>
                  </div>
                ))}
              </div>
              <div className={s.legenda}><span><i style={{ background: '#2F6BFF' }} />Você</span>{p && p.redacoes > 0 && <span><i style={{ background: '#f5a524' }} />Média de todos os alunos</span>}</div>
            </div>
            <div className={s.painel}>
              <h3>Evolução das notas (0 a 40)</h3>
              <div className={s.evolucao} role="img" aria-label={`Últimas notas: ${evolucao.map((r) => r.nota).join(', ')}`}>
                <div className={s.plot}>
                  <div className={s.linhaMin}><span>mínimo {NOTA_MINIMA}</span></div>
                  {evolucao.map((r) => (
                    <div key={r.id} className={s.coluna}>
                      <div className={s.colunaBarra} data-tom={faixaNota(r.nota)?.tom} style={{ height: `${Math.max(3, ((r.nota as number) / NOTA_MAXIMA) * 100)}%` }}><b>{r.nota}</b></div>
                    </div>
                  ))}
                </div>
                <div className={s.rotulos} aria-hidden="true">{evolucao.map((r) => <span key={r.id}>{dataBR(r.enviada_em).slice(0, 5)}</span>)}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={s.secao} aria-labelledby="ult-t">
        <div className={s.secaoTopo}><h2 id="ult-t">Últimas redações</h2>{lista.length > 4 && <Link href="/aluno/redacao/minhas">Ver todas</Link>}</div>
        {ultimas.length === 0 ? <div className={s.vazio}>Você ainda não enviou nenhuma redação.</div> : (
          <ul className={s.lista}>
            {ultimas.map((r) => (
              <li key={r.id}>
                <Link href={`/aluno/redacao/${r.id}`} className={s.item}>
                  <span className={s.itemTema}><b>{r.tema}</b><small>Enviada em {dataBR(r.enviada_em)}</small></span>
                  {r.status === 'corrigida'
                    ? <span className={s.selo} data-tom={faixaNota(r.nota)?.tom}><b>{r.nota}</b><small>{r.zerada ? 'zerada' : 'de 40'}</small></span>
                    : <span className={s.espera}>Em correção</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={s.secao} aria-labelledby="crit-t">
        <h2 id="crit-t">Como a AOCP corrige</h2>
        <div className={s.criterios}>
          {CRITERIOS.map((c) => <div key={c.n} className={s.criterio}><small>Critério {c.n} · 10 pontos</small><b>{c.nome}</b><span>{c.dica}</span></div>)}
        </div>
        <div className={s.zera}>
          <b>A redação recebe nota zero se tiver:</b>
          <ul>{MOTIVOS_ZERO.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      </section>
    </div>
  );
}
