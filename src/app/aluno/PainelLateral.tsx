import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { minhasTentativas } from '@/lib/questao';
import { hojeBr } from '@/lib/cronograma';
import { montarPlano } from '@/lib/planoCurso';
import type { DadosPlano } from '@/lib/planoServidor';
import { SEM_CONQUISTAS, nivelPorPontos, type Conquistas } from '@/lib/conquistas';
import { MedalhaNivel } from '@/components/Emblema';
import s from './aluno.module.css';

const META_QUESTOES = 30;
const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m}min`);

function Anel({ pct, cor, children, tam = 120 }: { pct: number; cor: string; children: React.ReactNode; tam?: number }) {
  return (
    <div className={s.anel} style={{ width: tam, height: tam, ['--p' as string]: `${Math.max(0, Math.min(100, pct))}`, ['--cor' as string]: cor }}>
      <div>{children}</div>
    </div>
  );
}

// Coluna da direita do Início: missões do dia, questões, sequência/nível e contagem para a prova
export async function PainelLateral({ supabase, alunoId, plano, prova, nomeProva }: {
  supabase: SupabaseClient; alunoId: string; plano: DadosPlano | null; prova: string | null; nomeProva: string | null;
}) {
  const hoje = hojeBr();
  const [tentativas, { data: dia }, { data: conqRaw }] = await Promise.all([
    minhasTentativas(supabase, alunoId),
    supabase.from('dias_estudo').select('minutos').eq('aluno_id', alunoId).eq('dia', hoje).maybeSingle(),
    supabase.rpc('conquistas_de', { p_aluno: alunoId }),
  ]);
  const conq = ((conqRaw ?? []) as Conquistas[])[0] ?? SEM_CONQUISTAS;
  const nivel = nivelPorPontos(conq.pontos);

  // questões: última resposta de cada uma; e quantas respondidas hoje
  const ultima = new Map<string, boolean>();
  let hojeQ = 0;
  for (const t of tentativas) {
    if (!ultima.has(t.questao_id)) ultima.set(t.questao_id, t.acertou);
    if (t.respondida_em && new Date(t.respondida_em).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) === hoje) hojeQ++;
  }
  const resolvidas = ultima.size;
  const acertos = Array.from(ultima.values()).filter(Boolean).length;
  const erros = resolvidas - acertos;
  const pctAcerto = resolvidas ? Math.round((100 * acertos) / resolvidas) : 0;

  // missões de hoje
  const minutosHoje = (dia as { minutos: number } | null)?.minutos ?? 0;
  const metaMin = plano?.cfg?.minutos_dia ?? 120;
  let blocos: { feitos: number; total: number } | null = null;
  if (plano?.cfg) {
    const p = montarPlano(plano.itens, plano.feitos, plano.cfg, hoje);
    const d = p.dias.find((x) => x.dia === hoje);
    if (d) blocos = { feitos: d.itens.filter((i) => i.feito).length, total: d.itens.length };
  }
  const missoes = [
    ...(blocos ? [{ rotulo: 'Blocos do cronograma', valor: `${blocos.feitos}/${blocos.total}`, r: blocos.total ? blocos.feitos / blocos.total : 1, href: '/aluno/cronograma/reta-final' }] : []),
    { rotulo: 'Questões', valor: `${hojeQ}/${META_QUESTOES}`, r: hojeQ / META_QUESTOES, href: '/aluno/questoes/filtrar' },
    { rotulo: 'Tempo de estudo', valor: `${dur(minutosHoje)}/${dur(metaMin)}`, r: minutosHoje / metaMin, href: '/aluno/cronograma' },
  ];
  const pctMissoes = Math.round((100 * missoes.reduce((t, m) => t + Math.min(1, m.r), 0)) / missoes.length);
  const faltam = prova ? Math.max(0, Math.round((new Date(prova + 'T12:00:00Z').getTime() - new Date(hoje + 'T12:00:00Z').getTime()) / 86400000)) : null;

  return (
    <aside className={s.lateral} aria-label="Seu dia">
      <section className={s.lCartao} aria-labelledby="l-missoes">
        <div className={s.lTopo}><h2 id="l-missoes">Missões de hoje</h2><span className={s.lSelo}>{pctMissoes}%</span></div>
        <div className={s.lBarra}><span style={{ width: `${pctMissoes}%` }} /></div>
        <ul className={s.lMissoes}>
          {missoes.map((m) => (
            <li key={m.rotulo} data-ok={m.r >= 1 || undefined}>
              <Link href={m.href}>
                <span className={s.lCheck} aria-hidden="true">{m.r >= 1 ? '✓' : ''}</span>
                <span className={s.lRotulo}>{m.rotulo}</span>
                <b>{m.valor}</b>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.lCartao} aria-labelledby="l-questoes">
        <div className={s.lTopo}><h2 id="l-questoes">Questões feitas</h2><Link href="/aluno/questoes">Banco ›</Link></div>
        <div className={s.lLinha}>
          <Anel pct={pctAcerto} cor="#22b35a"><b className="display">{resolvidas}</b><span>resolvidas</span></Anel>
          <ul className={s.lNumeros}>
            <li><span>Acertos</span><b className={s.lVerde}>{acertos}</b><em className={s.lVerdeFundo}>{pctAcerto}%</em></li>
            <li><span>Erros</span><b className={s.lVermelho}>{erros}</b><em className={s.lVermelhoFundo}>{resolvidas ? 100 - pctAcerto : 0}%</em></li>
          </ul>
        </div>
        {erros > 0 && <Link href="/aluno/questoes/erros" className={s.lBotao}>{erros === 1 ? 'Refazer meu erro' : `Refazer meus ${erros} erros`}</Link>}
      </section>

      <section className={s.lCartao} aria-labelledby="l-conq">
        <div className={s.lTopo}><h2 id="l-conq">Sua sequência</h2><Link href="/aluno/estatisticas">Conquistas ›</Link></div>
        <div className={s.lLinha}>
          <div className={s.lFogo}><span aria-hidden="true">🔥</span><b className="display">{conq.sequencia_atual}</b><small>{conq.sequencia_atual === 1 ? 'dia seguido' : 'dias seguidos'}</small></div>
          <div className={s.lNivel}>
            <MedalhaNivel faixa={nivel.faixa} rotulo={nivel.rotulo} tamanho={52} />
            <div><b>Nível {nivel.rotulo}</b><span>{nivel.faixa.nome} · {conq.pontos} pts</span>
              {!nivel.maximo && <span className={s.lBarra} style={{ marginTop: 6 }}><span style={{ width: `${nivel.pct}%`, background: nivel.faixa.cor }} /></span>}
            </div>
          </div>
        </div>
        <p className={s.lPe}>Maior sequência: {conq.maior_sequencia} {conq.maior_sequencia === 1 ? 'dia' : 'dias'}</p>
      </section>

      {faltam !== null && (
        <section className={`${s.lCartao} ${s.lProva}`} aria-label="Contagem para a prova">
          <span className="rotulo">{nomeProva ?? 'Sua prova'}</span>
          <div className={s.lContagem}><b className="display">{faltam}</b><span>{faltam === 1 ? 'dia para a prova' : 'dias para a prova'}</span></div>
          <span className={s.lPe}>{new Date(prova + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
        </section>
      )}
    </aside>
  );
}
