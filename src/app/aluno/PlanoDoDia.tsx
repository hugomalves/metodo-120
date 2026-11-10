import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Formulario } from '@/components/Formulario';
import { hojeSP, somarDias } from '@/lib/datas';
import type { Grupo } from '@/lib/filtros';
import { planoDoDia, proximosDias, type DisciplinaEdital, type MetaPlano } from '@/lib/plano';
import { criarLista, gerarProva } from './actions';

type Edital = { id: string; nome: string; banca?: string | null; data_prova: string | null; edital_disciplinas: DisciplinaEdital[] };
type Tentativa = { questao_id: string; acertou: boolean; respondida_em: string; questoes: { disciplina: string } | null };

const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const SEMANA_LONGA = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
const dow = (d: string) => (new Date(d + 'T12:00:00Z').getUTCDay() + 6) % 7;

// como estudar cada bloco (orientação fixa do método)
const COMO: Record<string, string> = {
  teoria: 'Leia o PDF com caneta na mão: sublinhe a regra e o exemplo de cada tópico e faça as questões do fim da aula sem consultar.',
  q1: 'Resolva sem olhar a teoria. Marque as que você chutou: elas contam como erro na hora de revisar.',
  q2: 'Ritmo de prova: cerca de 2 minutos e meio por questão. Leu duas vezes e não saiu? Pule e volte no fim.',
  revisao: 'Refaça antes de ler a resolução. Se errar de novo, escreva em uma linha o motivo do erro.',
  simulado: 'Faça de uma vez, no tempo da prova, sem consulta. A correção mostra se você passaria na regra de corte.',
};

// Metas de hoje montadas a partir do edital, com o que o aluno já cumpriu (questões, aula e simulado de hoje)
export async function PlanoDoDia({ supabase, alunoId, edital, curso, grupos = [], diaEscolhido }: {
  supabase: SupabaseClient; alunoId: string; edital: Edital; curso: boolean; grupos?: Grupo[]; diaEscolhido?: string;
}) {
  const hoje = hojeSP();
  // o aluno pode olhar os próximos 6 dias (só hoje registra o que foi feito)
  const dia = diaEscolhido && /^\d{4}-\d{2}-\d{2}$/.test(diaEscolhido) && diaEscolhido > hoje && diaEscolhido <= somarDias(hoje, 6) ? diaEscolhido : hoje;
  const ehHoje = dia === hoje;
  const plano = planoDoDia(edital.edital_disciplinas, edital.data_prova, dia);
  const inicioHoje = new Date(`${hoje}T00:00:00-03:00`).toISOString();

  const [{ data: tent }, { data: provasHoje }, { data: aulasHoje }, proximaAula] = await Promise.all([
    supabase.from('tentativas_questoes').select('questao_id, acertou, respondida_em, questoes(disciplina)').eq('aluno_id', alunoId)
      .order('respondida_em', { ascending: false }).limit(3000),
    supabase.from('provas').select('id, finalizada_em').eq('aluno_id', alunoId).gte('iniciada_em', inicioHoje),
    supabase.from('progresso_aulas').select('aula_id').eq('aluno_id', alunoId).gte('concluida_em', inicioHoje),
    curso && plano.principal && ehHoje ? aulaSeguinte(supabase, alunoId, plano.principal) : Promise.resolve(null),
  ]);
  const tentativas = (tent ?? []) as unknown as Tentativa[];
  const deHoje = tentativas.filter((t) => t.respondida_em >= inicioHoje);
  const antes = tentativas.filter((t) => t.respondida_em < inicioHoje);

  // questões de hoje por disciplina
  const porDisc = new Map<string, number>();
  deHoje.forEach((t) => { const d = t.questoes?.disciplina ?? ''; porDisc.set(d, (porDisc.get(d) ?? 0) + 1); });
  // erros pendentes: a última tentativa antes de hoje foi errada
  const ultimaAntes = new Map<string, boolean>();
  antes.forEach((t) => { if (!ultimaAntes.has(t.questao_id)) ultimaAntes.set(t.questao_id, t.acertou); });
  const erradas = Array.from(ultimaAntes.values()).filter((ok) => !ok).length;
  const refeitasHoje = new Set(deHoje.filter((t) => ultimaAntes.get(t.questao_id) === false).map((t) => t.questao_id)).size;

  const feito = (m: MetaPlano): number => {
    if (!ehHoje) return 0;
    if (m.tipo === 'questoes') return Math.min(m.alvo, porDisc.get(m.disciplina ?? '') ?? 0);
    if (m.tipo === 'teoria') return (aulasHoje ?? []).length > 0 ? 1 : 0;
    if (m.tipo === 'simulado') return (provasHoje ?? []).some((p: { finalizada_em: string | null }) => p.finalizada_em) ? 1 : 0;
    return Math.min(m.alvo, refeitasHoje);
  };
  const metas = plano.metas.map((m) => (m.tipo === 'revisao' ? { ...m, alvo: Math.max(0, Math.min(m.alvo, erradas)) } : m)).filter((m) => m.alvo > 0);
  const minutos = metas.reduce((t, m) => t + m.minutos, 0);
  const minutosFeitos = metas.reduce((t, m) => t + Math.round((m.minutos * feito(m)) / m.alvo), 0);
  const pct = minutos ? Math.round((100 * minutosFeitos) / minutos) : 0;
  const semana = proximosDias(edital.edital_disciplinas, edital.data_prova, hoje, 7);

  // resumo do dia, com dados reais: peso na prova, o que mais cai na banca e os erros do aluno
  const totalProva = edital.edital_disciplinas.reduce((t, d) => t + d.questoes, 0);
  const resumoDe = (disc: string | null) => {
    if (!disc) return null;
    const ed = edital.edital_disciplinas.find((d) => d.disciplina === disc);
    const conta = new Map<string, number>();
    grupos.filter((g) => g.disciplina === disc && (!edital.banca || g.banca === edital.banca) && g.assunto)
      .forEach((g) => conta.set(g.assunto!, (conta.get(g.assunto!) ?? 0) + g.n));
    const top = Array.from(conta.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const errosDisc = new Set(antes.filter((t) => ultimaAntes.get(t.questao_id) === false && t.questoes?.disciplina === disc).map((t) => t.questao_id)).size;
    const pct = ed && totalProva ? Math.round((100 * ed.questoes) / totalProva) : 0;
    const media = totalProva / Math.max(1, edital.edital_disciplinas.length);
    return { disc, questoes: ed?.questoes ?? 0, pct, alto: !!ed && ed.questoes > media, top, errosDisc };
  };
  const resumos = [resumoDe(plano.principal), resumoDe(plano.secundaria)].filter((x): x is NonNullable<ReturnType<typeof resumoDe>> => !!x);

  if (plano.fase === 'prova') {
    return (
      <section className="cartao plano" aria-labelledby="plano">
        <h2 id="plano" className="display">Dia de prova</h2>
        <p style={{ margin: 0 }}>Descanse, confira o local e o documento com foto. Você treinou para isso.</p>
      </section>
    );
  }

  return (
    <section className="cartao plano" aria-labelledby="plano">
      <div className="plano-cabeca">
        <div>
          <span className="rotulo">{ehHoje ? 'Plano de hoje' : `Plano de ${SEMANA_LONGA[dow(dia)]}, ${dia.slice(8, 10)}/${dia.slice(5, 7)}`} · {edital.nome}</span>
          <h2 id="plano" className="display">{plano.domingo ? 'Domingo é dia de simulado' : `${plano.principal}${plano.secundaria ? ` + ${plano.secundaria}` : ''}`}</h2>
          <span className="suave">
            {minutos >= 60 ? `${Math.floor(minutos / 60)}h${minutos % 60 ? String(minutos % 60).padStart(2, '0') : ''}` : `${minutos} min`} de estudo
            {plano.diasProva !== null ? ` · faltam ${plano.diasProva} dias para a prova` : ''}{plano.fase === 'reta' ? ' · reta final' : ''}
          </span>
        </div>
        <div className="plano-anel" style={{ ['--p' as string]: `${pct}` }} role="img" aria-label={`${pct}% do plano de hoje cumprido`}><b>{pct}%</b></div>
      </div>

      {resumos.length > 0 && (
        <div className="plano-resumo">
          {resumos.map((r) => (
            <div key={r.disc}>
              <b>{r.disc}</b>
              <span>{r.questoes ? <>Vale <b>{r.questoes} de {totalProva}</b> questões da prova ({r.pct}%){r.alto ? ' · peso alto' : ''}.</> : 'Disciplina do edital.'}</span>
              {r.top.length > 0 && <span>O que mais cai{edital.banca ? ` na ${edital.banca.replace('Instituto ', '')}` : ''}: {r.top.map(([a, n]) => `${a} (${n})`).join(', ')}.</span>}
              {r.errosDisc > 0 && <span className="plano-alerta">Revisar: você tem {r.errosDisc} {r.errosDisc === 1 ? 'questão errada' : 'questões erradas'} desta disciplina.</span>}
            </div>
          ))}
        </div>
      )}
      {plano.domingo && <p className="plano-dica" style={{ margin: 0 }}><b>Como fazer:</b> {COMO.simulado}</p>}

      <ol className="plano-metas">
        {metas.map((m) => {
          const f = feito(m);
          const ok = f >= m.alvo;
          return (
            <li key={m.id} data-ok={ok ? 'sim' : undefined}>
              <span className="plano-check" aria-hidden="true">{ok ? '✓' : ''}</span>
              <div className="plano-meta-texto">
                <b>{m.titulo}</b>
                {COMO[m.id] && !plano.domingo && <span className="plano-dica">{COMO[m.id]}</span>}
                <span className="suave">
                  {m.minutos} min · {m.tipo === 'questoes' || m.tipo === 'revisao' ? `${f} de ${m.alvo} questões` : ok ? 'feito' : m.tipo === 'teoria' && proximaAula ? proximaAula.titulo : m.tipo === 'teoria' ? (curso ? 'resumo ou lei seca da disciplina' : 'as aulas fazem parte do curso') : 'a fazer'}
                </span>
              </div>
              <div className="plano-acao" hidden={!ehHoje}>
                {!ok && m.tipo === 'questoes' && (
                  <Formulario acao={criarLista} botao={`Resolver ${m.alvo - f}`} classeBotao="btn btn-azul" pendenteTexto="Montando…">
                    <input type="hidden" name="d" value={m.disciplina ?? ''} />
                    <input type="hidden" name="qtd" value={Math.max(5, m.alvo - f)} />
                  </Formulario>
                )}
                {!ok && m.tipo === 'revisao' && <Link href={`/aluno/questoes?s=erradas&e=${edital.id}`} className="btn btn-linha">Refazer erros</Link>}
                {!ok && m.tipo === 'teoria' && proximaAula && <Link href={`/aluno/aula/${proximaAula.id}`} className="btn btn-linha">Assistir</Link>}
                {!ok && m.tipo === 'simulado' && (
                  <Formulario acao={gerarProva} botao="Começar" classeBotao="btn btn-azul" pendenteTexto="Sorteando…">
                    <input type="hidden" name="edital" value={edital.id} />
                    <input type="hidden" name="tipo" value={plano.fase === 'reta' ? 'completo' : 'mini'} />
                  </Formulario>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="plano-semana" aria-label="Próximos dias">
        {semana.map((d) => (
          <Link key={d.dia} href={d.dia === hoje ? '/aluno#plano' : `/aluno?dia=${d.dia}#plano`} scroll={false}
            data-hoje={d.dia === dia ? 'sim' : undefined} aria-current={d.dia === dia ? 'date' : undefined}>
            <span>{d.dia === hoje ? 'Hoje' : SEMANA[dow(d.dia)]}</span>
            <b>{d.domingo ? 'Simulado' : d.principal}</b>
          </Link>
        ))}
      </div>
    </section>
  );
}

// próxima aula ainda não concluída da disciplina (só para quem tem o curso)
async function aulaSeguinte(supabase: SupabaseClient, alunoId: string, disciplina: string) {
  const [{ data: mods }, { data: feitas }] = await Promise.all([
    supabase.from('modulos').select('numero, aulas(id, numero, titulo, publicada)').eq('disciplina', disciplina).order('numero'),
    supabase.from('progresso_aulas').select('aula_id').eq('aluno_id', alunoId),
  ]);
  const ok = new Set(((feitas ?? []) as { aula_id: string }[]).map((f) => f.aula_id));
  for (const m of (mods ?? []) as { aulas: { id: string; numero: number; titulo: string; publicada: boolean }[] }[]) {
    const a = [...m.aulas].sort((x, y) => x.numero - y.numero).find((x) => x.publicada && !ok.has(x.id));
    if (a) return { id: a.id, titulo: a.titulo };
  }
  return null;
}
