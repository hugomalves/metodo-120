import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Formulario } from '@/components/Formulario';
import { hojeSP } from '@/lib/datas';
import { planoDoDia, proximosDias, type DisciplinaEdital, type MetaPlano } from '@/lib/plano';
import { criarLista, gerarProva } from './actions';

type Edital = { id: string; nome: string; data_prova: string | null; edital_disciplinas: DisciplinaEdital[] };
type Tentativa = { questao_id: string; acertou: boolean; respondida_em: string; questoes: { disciplina: string } | null };

const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Metas de hoje montadas a partir do edital, com o que o aluno já cumpriu (questões, aula e simulado de hoje)
export async function PlanoDoDia({ supabase, alunoId, edital, curso }: { supabase: SupabaseClient; alunoId: string; edital: Edital; curso: boolean }) {
  const hoje = hojeSP();
  const plano = planoDoDia(edital.edital_disciplinas, edital.data_prova, hoje);
  const inicioHoje = new Date(`${hoje}T00:00:00-03:00`).toISOString();

  const [{ data: tent }, { data: provasHoje }, { data: aulasHoje }, proximaAula] = await Promise.all([
    supabase.from('tentativas_questoes').select('questao_id, acertou, respondida_em, questoes(disciplina)').eq('aluno_id', alunoId)
      .order('respondida_em', { ascending: false }).limit(3000),
    supabase.from('provas').select('id, finalizada_em').eq('aluno_id', alunoId).gte('iniciada_em', inicioHoje),
    supabase.from('progresso_aulas').select('aula_id').eq('aluno_id', alunoId).gte('concluida_em', inicioHoje),
    curso && plano.principal ? aulaSeguinte(supabase, alunoId, plano.principal) : Promise.resolve(null),
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
          <span className="rotulo">Plano de hoje · {edital.nome}</span>
          <h2 id="plano" className="display">{plano.domingo ? 'Domingo é dia de simulado' : `${plano.principal}${plano.secundaria ? ` + ${plano.secundaria}` : ''}`}</h2>
          <span className="suave">
            {minutos >= 60 ? `${Math.floor(minutos / 60)}h${minutos % 60 ? String(minutos % 60).padStart(2, '0') : ''}` : `${minutos} min`} de estudo
            {plano.diasProva !== null ? ` · faltam ${plano.diasProva} dias para a prova` : ''}{plano.fase === 'reta' ? ' · reta final' : ''}
          </span>
        </div>
        <div className="plano-anel" style={{ ['--p' as string]: `${pct}` }} role="img" aria-label={`${pct}% do plano de hoje cumprido`}><b>{pct}%</b></div>
      </div>

      <ol className="plano-metas">
        {metas.map((m) => {
          const f = feito(m);
          const ok = f >= m.alvo;
          return (
            <li key={m.id} data-ok={ok ? 'sim' : undefined}>
              <span className="plano-check" aria-hidden="true">{ok ? '✓' : ''}</span>
              <div className="plano-meta-texto">
                <b>{m.titulo}</b>
                <span className="suave">
                  {m.minutos} min · {m.tipo === 'questoes' || m.tipo === 'revisao' ? `${f} de ${m.alvo} questões` : ok ? 'feito' : m.tipo === 'teoria' && proximaAula ? proximaAula.titulo : m.tipo === 'teoria' ? (curso ? 'resumo ou lei seca da disciplina' : 'as aulas fazem parte do curso') : 'a fazer'}
                </span>
              </div>
              <div className="plano-acao">
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
        {semana.map((d) => {
          const dow = SEMANA[(new Date(d.dia + 'T12:00:00Z').getUTCDay() + 6) % 7];
          return (
            <div key={d.dia} data-hoje={d.dia === hoje ? 'sim' : undefined}>
              <span>{d.dia === hoje ? 'Hoje' : dow}</span>
              <b>{d.domingo ? 'Simulado' : d.principal}</b>
            </div>
          );
        })}
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
