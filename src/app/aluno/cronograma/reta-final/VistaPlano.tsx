import Link from 'next/link';
import { dataCurta, dataLonga, diaDaSemana, inicioDaSemana, somarDias } from '@/lib/cronograma';
import { DATA_PROVA, rotuloTempo, type DiaPlano, type ItemPlano } from '@/lib/planoCurso';
import { propostaDoBloco } from '@/lib/redacao';
import { alternarFeito } from './acoes';
import s from '../cronograma.module.css';
import p from './plano.module.css';

type ItemDia = ItemPlano & { feito: boolean };
const SEM = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const NOME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const BASE = '/aluno/cronograma/reta-final';
const duracao = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
const ehRevisao = (i: ItemPlano) => i.tipo === 'revisao';

function Icone({ d }: { d: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

// ---------- Topo: curso, ritmo (com o botão de ajustar em destaque), atalhos e progresso ----------
export function TopoPlano({ minutos, feito, total, fim, inicio }: { minutos: number; feito: number; total: number; fim: string | null; inicio: string }) {
  const pct = Math.round((100 * feito) / Math.max(1, total));
  return (
    <div className={s.topo}>
      <div className={s.topoLinha}>
        <div className={s.seletor}>
          <Icone d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4" />
          <b style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: 15 }}>Reta Final PM PE · Soldado</b>
          <span className={p.chipRitmo}>{rotuloTempo(minutos)} por dia · desde {dataCurta(inicio)}</span>
        </div>
        <Link href={`${BASE}?ajustar=1`} className={`${s.btnPrimario} ${p.btnAjustar}`}>
          <Icone d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />Ajustar dia e horas
        </Link>
      </div>
      <nav className={s.atalhos} aria-label="Atalhos">
        <Link href="/aluno/questoes/cadernos"><Icone d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3" />Cadernos</Link>
        <Link href="/aluno/simulados"><Icone d="M7 3h10v4H7zM5 7h14v14H5zM9 12l2 2 4-4" />Simulados</Link>
        <Link href="/aluno/minissimulados"><Icone d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />Minissimulados</Link>
        <Link href="/aluno/questoes/erros"><Icone d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />Meus erros</Link>
      </nav>
      <div className={s.progresso}>
        <div className={s.progressoTexto}>
          <span>Cronograma concluído <b>{pct}%</b></span>
          <span>{duracao(feito)} de {duracao(total)}</span>
        </div>
        <div className={s.trilho}><span style={{ width: `${pct}%` }} /></div>
        <div className={s.conclusao}>
          <Icone d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M9 15l2 2 4-4" />
          Conclusão estimada <b>{fim ? dataLonga(fim) : '—'}</b>
          {fim && fim > DATA_PROVA && <span className={s.alertaProva}>depois da prova</span>}
        </div>
      </div>
    </div>
  );
}

// ---------- Um bloco do dia (mesmo visual dos blocos do cronograma) ----------
function Bloco({ it, n, temPdf }: { it: ItemDia; n: number; temPdf: Set<string> }) {
  const rotulo = it.tipo === 'simulado' ? 'Simulado · 4h30' : it.tipo === 'mini' ? 'Minissimulado · 2h' : it.tipo === 'revisao' ? 'Revisão · 30 min' : `Bloco ${n} · 15 min`;
  const disc = it.tipo === 'simulado' || it.tipo === 'mini' ? it.titulo : it.disciplina;
  const sub = (it.subtitulo ?? '').replace(/^Bloco (\d+) de (\d+)( · )?/, '');
  const parte = (it.subtitulo ?? '').match(/^Bloco (\d+) de (\d+)/);
  const assunto = it.tipo === 'simulado' || it.tipo === 'mini' || it.tipo === 'revisao' ? (it.subtitulo ?? '') : sub || it.titulo;
  const origem = it.tipo === 'aula' || it.tipo === 'proposta' ? `${it.titulo}${parte ? ` · parte ${parte[1]} de ${parte[2]}` : ''}` : null;
  return (
    <article className={`${s.bloco} ${it.feito ? s.blocoFeito : ''}`}>
      <div className={s.blocoCabeca}>
        <div>
          <span className={s.blocoNum}>{rotulo}</span>
          <h3 className={s.blocoDisc}>{disc}</h3>
          <p className={s.blocoAssunto} style={{ color: 'var(--texto)', fontWeight: 600 }}>{assunto}</p>
          {origem && <p className={s.blocoAssunto} style={{ fontSize: 12.5 }}>{origem}</p>}
          {it.feito && <span className={s.tagFeito}>Concluído</span>}
        </div>
        <form action={alternarFeito}>
          <input type="hidden" name="codigo" value={it.codigo} />
          {it.feito && <input type="hidden" name="desfazer" value="1" />}
          <button className={it.feito ? s.btnMini : s.btnRegistrar} aria-label={it.feito ? `Desfazer: ${disc}` : `Concluir: ${disc}`}>
            {it.feito ? 'Desfazer' : <><Icone d="M5 12l5 5 9-11" />Concluir</>}
          </button>
        </form>
      </div>
      <div className={s.blocoLinks}>
        {it.pdf && (temPdf.has(it.pdf)
          ? <a href={`/api/curso-pdf/${it.pdf}`} target="_blank" rel="noopener" className={p.linkPdf}>Abrir PDF</a>
          : <span className={p.semPdf}>PDF em breve</span>)}
        {it.caderno && <Link href={`/lista/${it.caderno}`}>Questões do bloco</Link>}
        {propostaDoBloco(it.codigo) && <Link href={`/aluno/redacao/nova?tema=${propostaDoBloco(it.codigo)!.slug}`}>Enviar redação para correção</Link>}
        {it.aula && it.tipo === 'aula' && temPdf.has(it.aula) && <a href={`/api/curso-pdf/${it.aula}`} target="_blank" rel="noopener">Aula completa</a>}
        {it.tipo === 'revisao' && <Link href="/aluno/questoes/erros">Refazer meus erros</Link>}
        {it.tipo === 'revisao' && (it.extra.aulas ?? []).map((a) => <Link key={a} href={`/lista/${a}`}>{a.replace('-AULA', ' · Aula ')}</Link>)}
        {it.tipo === 'simulado' && <Link href="/aluno/simulados">Ir aos simulados</Link>}
        {it.tipo === 'mini' && <Link href="/aluno/minissimulados">Ir aos minissimulados</Link>}
      </div>
    </article>
  );
}

// ---------- Estudos | Revisões do dia ----------
export function PainelDia({ dia, hoje, temPdf, primeiroFuturo }: { dia: DiaPlano | undefined; hoje: string; temPdf: Set<string>; primeiroFuturo?: string }) {
  const itens = dia?.itens ?? [];
  const estudos = itens.filter((i) => !ehRevisao(i));
  const revisoes = itens.filter(ehRevisao);
  const feitos = estudos.filter((i) => i.feito).length;
  const ehHoje = !dia || dia.dia === hoje;
  const quando = dia && !ehHoje ? `${NOME[diaDaSemana(dia.dia)]}, ${dataCurta(dia.dia)}` : 'hoje';
  let n = 0;
  return (
    <div className={s.duasColunas}>
      <section className={s.painelBloco} aria-labelledby="h-estudos">
        <header className={s.painelCabeca}>
          <h2 id="h-estudos">Estudos{ehHoje ? '' : ` · ${quando}`}</h2>
          <p>{estudos.length ? `${estudos.length - feitos} de ${estudos.length} ${estudos.length === 1 ? 'item pendente' : 'itens pendentes'} para ${quando} · ${duracao(dia?.minutos ?? 0)}` : `Nenhum bloco para ${quando}.`}</p>
          <div className={s.trilhoMini}><span style={{ width: `${estudos.length ? (100 * feitos) / estudos.length : 0}%` }} /></div>
        </header>
        <div className={s.painelLista}>
          {estudos.map((it) => <Bloco key={it.codigo} it={it} n={it.tipo === 'aula' || it.tipo === 'proposta' ? ++n : 0} temPdf={temPdf} />)}
          {!estudos.length && (
            <p className={s.vazio}>
              {primeiroFuturo ? <>Dia livre. Quer adiantar? <Link href={`${BASE}?dia=${primeiroFuturo}`}>Veja o próximo dia de estudo</Link> e conclua os blocos: o cronograma anda junto.</> : 'Nada programado.'}
            </p>
          )}
        </div>
        {ehHoje && estudos.length > 0 && feitos === estudos.length && primeiroFuturo && (
          <div className={p.avisoOk}><span>Tudo feito por hoje! Quer adiantar?</span><Link href={`${BASE}?dia=${primeiroFuturo}`} className={s.btnMini}>Ver o próximo dia</Link></div>
        )}
      </section>
      <section className={`${s.painelBloco} ${s.painelRevisao}`} aria-labelledby="h-rev">
        <header className={s.painelCabeca}>
          <h2 id="h-rev">Revisões</h2>
          <p>{revisoes.length ? `${revisoes.length} ${revisoes.length === 1 ? 'revisão' : 'revisões'} para ${quando}.` : `Nenhuma revisão para ${quando}.`}</p>
        </header>
        <div className={s.painelLista}>
          {revisoes.map((it) => <Bloco key={it.codigo} it={it} n={0} temPdf={temPdf} />)}
          {!revisoes.length && <p className={s.vazio}>As revisões entram sozinhas no fim de cada ciclo de cada disciplina.</p>}
        </div>
        <footer className={s.painelRodape}><Link href="/aluno/questoes/erros">Refazer meus erros →</Link></footer>
      </section>
    </div>
  );
}

// ---------- Agenda da semana ----------
function chips(itens: ItemDia[]) {
  const grupos: { chave: string; rotulo: string; feito: boolean; tipo: string }[] = [];
  for (const i of itens) {
    const chave = i.tipo === 'aula' || i.tipo === 'proposta' ? (i.aula ?? i.codigo) : i.codigo;
    const rotulo = i.tipo === 'aula' ? `${i.disciplina} · ${i.titulo.split(' · ')[0]}` : i.tipo === 'proposta' ? 'Redação · proposta' : i.tipo === 'revisao' ? `Revisão · ${i.disciplina}` : i.titulo;
    const g = grupos.find((x) => x.chave === chave);
    if (g) g.feito = g.feito && i.feito; else grupos.push({ chave, rotulo, feito: i.feito, tipo: i.tipo });
  }
  return grupos;
}

export function SemanaPlano({ dias, hoje, semana, selecionado }: { dias: DiaPlano[]; hoje: string; semana: string; selecionado: string }) {
  const lista = Array.from({ length: 7 }, (_, i) => somarDias(semana, i));
  return (
    <section className={s.semana} aria-labelledby="h-semana">
      <header className={s.semanaCabeca}>
        <Link href={`${BASE}?semana=${somarDias(semana, -7)}`} aria-label="Semana anterior">‹</Link>
        <div><h2 id="h-semana">Agenda de estudos da semana</h2><span>{dataCurta(semana)} – {dataCurta(lista[6])}</span></div>
        <Link href={`${BASE}?semana=${somarDias(semana, 7)}`} aria-label="Próxima semana">›</Link>
      </header>
      <div className={s.legenda}>
        <span className={s.st_feito}><i />Concluído</span>
        <span className={s.st_programado}><i />Programado</span>
        <span className={p.legendaTexto}>Toque num dia para ver os blocos.</span>
      </div>
      <div className={s.semanaGrade}>
        {lista.map((d) => {
          const it = dias.find((x) => x.dia === d)?.itens ?? [];
          const gs = chips(it);
          const feitos = it.filter((i) => i.feito).length;
          return (
            <Link key={d} href={`${BASE}?dia=${d}&semana=${semana}`} className={`${s.semanaDia} ${d === hoje ? s.hoje : ''} ${p.diaLink}`} aria-current={d === selecionado ? 'date' : undefined}>
              <div className={s.semanaDiaCabeca}><b>{SEM[diaDaSemana(d)]}</b><span>{dataCurta(d)}</span><span>{feitos}/{it.length}</span></div>
              {gs.map((g) => (
                <div key={g.chave} className={`${s.chipDia} ${g.feito ? s.st_feito : s.st_programado} ${g.tipo === 'simulado' || g.tipo === 'mini' ? p.chipSim : ''}`}>
                  <i aria-hidden="true" /><span>{g.rotulo}</span>
                </div>
              ))}
            </Link>
          );
        })}
      </div>
      <div className={s.semanaRodape}><Link href={`${BASE}?ver=tudo`}>Ver o cronograma inteiro →</Link></div>
    </section>
  );
}

export const semanaDe = (d: string) => inicioDaSemana(d);
