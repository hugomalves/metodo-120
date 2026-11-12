import Link from 'next/link';
import { diasAte } from '@/lib/datas';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Perfil } from '@/lib/sessao';
import type { Acesso } from '@/lib/acesso';
import type { Grupo } from '@/lib/filtros';
import { CartaoCapa } from '@/components/CartaoCapa';
import { iconePorDisciplina } from '@/components/Capa';
import { seguirEdital } from './actions';
import { PlanoDoDia } from './PlanoDoDia';
import { carregarLoja, linkCompra, produtoQueLibera, quadrosSimulados } from '@/lib/loja';
import { CartaoProduto, Cadeado } from '@/components/CartaoProduto';
import { QuadrosSimulados } from '@/components/QuadrosSimulados';

type AulaCat = { aula_id: string; modulo_titulo: string; disciplina: string | null; numero: number; titulo: string; tem_mini: boolean };
import s from './aluno.module.css';

type Edital = { id: string; nome: string; banca: string | null; data_prova: string | null; edital_disciplinas: { disciplina: string; questoes: number; bloco: string | null; ordem: number }[] };

const dataBr = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

// Início de quem usa só o banco de questões (plano grátis ou banco completo)
export async function InicioBanco({ supabase, perfil, acesso, dia }: { supabase: SupabaseClient; perfil: Perfil; acesso: Acesso; dia?: string }) {
  const [{ data }, { data: eds }, loja, { data: cat }] = await Promise.all([
    supabase.rpc('contagem_banco'),
    supabase.from('editais').select('id, nome, banca, data_prova, edital_disciplinas(disciplina, questoes, bloco, ordem)').eq('publicado', true).order('data_prova', { nullsFirst: false }),
    carregarLoja(supabase, perfil.id),
    supabase.rpc('catalogo_aulas'),
  ]);
  const simulados = await quadrosSimulados(supabase, perfil.id, loja.produtos, 4);
  const grupos = (data ?? []) as Grupo[];
  const editais = (eds ?? []) as Edital[];
  const meu = editais.find((e) => e.id === perfil.edital_id) ?? null;
  const porDisc = new Map<string, { total: number; feitas: number }>();
  grupos.forEach((g) => {
    const k = g.disciplina ?? '';
    const v = porDisc.get(k) ?? { total: 0, feitas: 0 };
    v.total += g.n; if (g.feita) v.feitas += g.n;
    porDisc.set(k, v);
  });
  const restantes = Math.max(0, acesso.limiteDia - acesso.usadasHoje);
  const pct = acesso.limiteDia ? Math.round((100 * Math.min(acesso.usadasHoje, acesso.limiteDia)) / acesso.limiteDia) : 0;
  const discs = meu
    ? [...meu.edital_disciplinas].sort((a, b) => a.ordem - b.ordem)
    : Array.from(porDisc.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR')).map((d) => ({ disciplina: d, questoes: 0, bloco: null, ordem: 0 }));
  const noEdital = discs.reduce((t, d) => t + (porDisc.get(d.disciplina)?.total ?? 0), 0);

  return (
    <>
      <div className={s.cabeca}>
        <h1 className="display" style={{ margin: 0, fontSize: 'clamp(28px, 3.2vw, 38px)' }}>Olá, {perfil.nome || 'concurseiro'}</h1>
        <p className="suave" style={{ margin: 0 }}>{acesso.curso ? 'Curso Método 120' : `Banco de questões · ${acesso.completo ? 'acesso completo' : 'plano grátis'}`}</p>
      </div>

      <section className="cartao-gradiente" style={{ padding: 22, borderRadius: 4, display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', justifyContent: 'space-between' }} aria-labelledby="edital">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 300px' }}>
          <span className="rotulo" id="edital">Seu edital</span>
          <b className="display" style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.15 }}>{meu ? meu.nome : 'Escolha o concurso que você vai fazer'}</b>
          {meu && (
            <span style={{ color: 'var(--texto-2)' }}>
              {[meu.banca, meu.data_prova ? `prova em ${dataBr(meu.data_prova)}` : null, meu.data_prova && diasAte(meu.data_prova) > 0 ? `faltam ${diasAte(meu.data_prova)} dias` : null].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <form action={seguirEdital} className="linha-flex" style={{ gap: 8 }}>
          <label htmlFor="sed" className="sr-only">Edital</label>
          <select id="sed" name="edital" defaultValue={meu?.id ?? ''} style={{ minHeight: 44, padding: '0 12px', borderRadius: 4, border: '1.5px solid var(--linha-forte)', background: 'var(--cartao)', color: 'var(--texto)', font: 'inherit', maxWidth: '100%' }}>
            <option value="">Nenhum (ver todas as questões)</option>
            {editais.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
          <button className="btn btn-ciano">{meu ? 'Trocar' : 'Seguir este edital'}</button>
        </form>
      </section>

      {meu && <PlanoDoDia supabase={supabase} alunoId={perfil.id} edital={meu} curso={acesso.curso} grupos={grupos} diaEscolhido={dia} />}

      {(() => {
        // Reta Final (ou outro curso em destaque) do edital, para quem ainda não comprou
        const destaque = loja.produtos.find((p) => p.destaque && p.tipo === 'curso' && (!meu || !p.edital_id || p.edital_id === meu.id) && !loja.meus.has(p.id));
        return destaque ? <div className="loja-grade" style={{ gridTemplateColumns: '1fr' }}><CartaoProduto p={destaque} meu={false} /></div> : null;
      })()}

      {meu && (() => {
        // PDFs do curso: as aulas das disciplinas do edital (abertas para quem tem o curso; com cadeado para os demais)
        const discs = new Set(meu.edital_disciplinas.map((d) => d.disciplina));
        const aulas = ((cat ?? []) as AulaCat[]).filter((a) => a.disciplina && discs.has(a.disciplina)).slice(0, 6);
        const curso = produtoQueLibera(loja.produtos, 'curso', meu.id);
        return (
          <section className={s.grupo} aria-labelledby="pdfs">
            <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 id="pdfs" className="display">PDFs do curso</h2>
              <Link href={acesso.curso ? '/aluno/trilha' : '/aluno/cursos'} style={{ fontWeight: 600 }}>{acesso.curso ? 'Ver todas as aulas' : 'Ver os cursos'}</Link>
            </div>
            <p className="suave" style={{ margin: 0 }}>Cada aula tem 3 arquivos: o PDF da teoria com questões, o minissimulado com cartão-resposta e o gabarito comentado.</p>
            {aulas.length === 0 ? <p className="suave" style={{ margin: 0 }}>As aulas em PDF deste edital serão publicadas em breve.</p> : (
              <div className="trio">
                {aulas.map((a) => {
                  const href = acesso.curso ? `/aluno/aula/${a.aula_id}` : linkCompra(curso);
                  const externo = !acesso.curso && href.startsWith('http');
                  return (
                    <div key={a.aula_id} className="trio-linha">
                      <b>{a.disciplina} · {a.titulo}</b>
                      <span className="suave">{a.tem_mini ? 'PDF + minissimulado + gabarito' : 'PDF da aula'}</span>
                      <a href={href} className={`btn ${acesso.curso ? 'btn-linha' : 'btn-vermelho'}`} {...(externo ? { target: '_blank', rel: 'noopener' } : {})}>
                        {acesso.curso ? 'Abrir' : <><Cadeado /> Liberar</>}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })()}

      {(() => {
        // loja no início: cursos à venda que o aluno ainda não tem (a Reta Final em destaque já aparece acima)
        const outros = loja.produtos.filter((p) => p.tipo === 'curso' && p.venda_aberta && !p.destaque && !loja.meus.has(p.id));
        return outros.length ? (
          <section className={s.grupo} aria-labelledby="loja">
            <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 id="loja" className="display">Cursos para você</h2>
              <Link href="/aluno/cursos" style={{ fontWeight: 600 }}>Ver todos</Link>
            </div>
            <div className="loja-grade">{outros.slice(0, 6).map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}</div>
          </section>
        ) : null;
      })()}

      {simulados.length > 0 && (
        <section className={s.grupo} aria-labelledby="sims">
          <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 id="sims" className="display">Simulados</h2>
            <Link href="/aluno/simulados" style={{ fontWeight: 600 }}>Ver todos</Link>
          </div>
          <QuadrosSimulados itens={simulados} />
        </section>
      )}

      {!acesso.completo && (
        <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="hoje">
          <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
            <h2 id="hoje" className="display" style={{ margin: 0, fontSize: 19 }}>Suas questões grátis de hoje</h2>
            <b className="display" style={{ fontSize: 22, color: 'var(--azul)' }}>{acesso.usadasHoje} de {acesso.limiteDia}</b>
          </div>
          <span className="cc-progresso" role="img" aria-label={`${acesso.usadasHoje} de ${acesso.limiteDia} questões usadas hoje`}>
            <span style={{ width: `${pct}%` }} />
          </span>
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>
            {restantes > 0
              ? `Você ainda pode responder ${restantes} ${restantes === 1 ? 'questão' : 'questões'} hoje, com gabarito e resolução comentada. Amanhã o contador recomeça.`
              : 'Você usou todas as questões grátis de hoje. Amanhã o contador recomeça, ou desbloqueie o banco completo para continuar agora.'}
          </p>
          <div className="linha-flex" style={{ gap: 8 }}>
            <Link href="/aluno/planos" className="btn btn-azul">Conhecer o banco completo</Link>
          </div>
        </section>
      )}

      <section className={s.grupo} aria-labelledby="discs">
        <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 id="discs" className="display">{meu ? 'Disciplinas do edital' : 'Disciplinas'}</h2>
          {meu && <Link href={`/aluno/questoes?e=${meu.id}`} style={{ fontWeight: 600 }}>Resolver tudo do edital ({noEdital})</Link>}
        </div>
        <div className="cc-grade">
          {discs.map((d) => {
            const v = porDisc.get(d.disciplina) ?? { total: 0, feitas: 0 };
            const href = `/aluno/questoes?d=${encodeURIComponent(d.disciplina)}`;
            return (
              <CartaoCapa key={d.disciplina} href={v.total ? href : undefined} tipo="banco" icone={iconePorDisciplina(d.disciplina)}
                rotulo={d.bloco ?? 'Disciplina'} destaque={v.total ? String(v.total) : undefined} titulo={d.disciplina}
                texto={meu && d.questoes ? `${d.questoes} questões na prova.` : undefined}
                selo={v.total ? undefined : 'Em breve'}
                rodape={v.total
                  ? <><Link href={href} className="btn btn-azul">Resolver</Link><span className="cc-info">{v.feitas} de {v.total} feitas</span></>
                  : <span className="cc-info">As questões desta disciplina estão sendo preparadas.</span>} />
            );
          })}
        </div>
      </section>

      <section className={s.grupo} aria-labelledby="mais">
        <h2 id="mais" className="display">Treine do seu jeito</h2>
        <div className="cc-grade">
          <CartaoCapa href="/aluno/questoes/listas" tipo="lista" rotulo="Lista impressa" titulo="Monte e imprima uma lista"
            texto={`Escolha edital, disciplina, banca e dificuldade${acesso.completo ? '' : `. No plano grátis, listas de até ${acesso.listaMax} questões`}.`}
            rodape={<Link href="/aluno/questoes/listas" className="btn btn-azul">Montar lista</Link>} />
        </div>
      </section>
    </>
  );
}
