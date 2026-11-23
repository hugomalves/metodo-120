import Link from 'next/link';
import {
  chaveDe, dataCurta, dataLonga, DIAS_SEMANA, diaDaSemana, diasEntre, inicioDaSemana, minutosTexto, somarDias, TIPOS_ESTUDO,
  type Conteudo, type DisciplinaEdital, type Estudo, type Item, type Progresso, type Revisao,
} from '@/lib/cronograma';
import { BotaoRegistrar, Marcador } from './Interativos';
import { SeletorEdital } from '../SeletorEdital';
import { apagarEstudo, apagarRevisao, concluirRevisao, replanejar } from './actions';
import s from './cronograma.module.css';

export type Aba = 'cronograma' | 'revisoes' | 'historico' | 'calendario' | 'edital';
export const ABAS: { id: Aba; rotulo: string; icone: string }[] = [
  { id: 'cronograma', rotulo: 'Cronograma', icone: 'M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11' },
  { id: 'revisoes', rotulo: 'Revisões', icone: 'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M15 15a3 3 0 1 1-1-2.2M15 12v1.5h-1.5' },
  { id: 'historico', rotulo: 'Histórico', icone: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 8v4l3 2' },
  { id: 'calendario', rotulo: 'Calendário', icone: 'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M8 13h2M12 13h2M16 13h.01M8 16h2M12 16h2' },
  { id: 'edital', rotulo: 'Edital', icone: 'M4 5h7v14H4zM13 5h7v14h-7zM6.5 9h2M6.5 12h2M15.5 9h2M15.5 12h2' },
];

function Icone({ d, tam = 16 }: { d: string; tam?: number }) {
  return <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

export type Mapa = Map<string, Conteudo>;
export type Base = {
  hoje: string;
  edital: { id: string; nome: string; data_prova: string | null };
  estrutura: DisciplinaEdital[];
  mapa: Mapa;                         // "disciplina::chave" → conteúdo
  progresso: Map<string, Progresso>;  // "disciplina::chave" → progresso
  itens: Item[];
};

const status = (b: Base, it: { disciplina: string; chave: string; dia: string }) =>
  b.progresso.get(chaveDe(it.disciplina, it.chave))?.teoria ? 'feito' : it.dia < b.hoje ? 'atrasado' : 'programado';

const linkQuestoes = (b: Base, c: Conteudo | undefined, disciplina: string) => {
  const q = new URLSearchParams({ e: b.edital.id, d: disciplina });
  if (c?.nomeCurto) q.set('a', c.nomeCurto);
  return `/aluno/questoes?${q}`;
};

// ---------- Topo: edital, atalhos, progresso ----------
export function Topo({ b, editais, trocar }: { b: Base; editais: { id: string; nome: string }[]; trocar: (f: FormData) => Promise<void> }) {
  const folhas = b.estrutura.flatMap((d) => d.folhas);
  const feitos = folhas.filter((c) => b.progresso.get(chaveDe(c.disciplina, c.chave))?.teoria).length;
  const pct = folhas.length ? Math.round((100 * feitos) / folhas.length) : 0;
  const pendentes = b.itens.filter((i) => status(b, i) !== 'feito');
  const fim = pendentes.reduce<string | null>((m, i) => (!m || i.dia > m ? i.dia : m), null);
  const atrasoProva = fim && b.edital.data_prova && fim > b.edital.data_prova;
  return (
    <div className={s.topo}>
      <div className={s.topoLinha}>
        <div className={s.seletor}>
          <Icone d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4" />
          <SeletorEdital editais={editais} atual={b.edital.id} acao={trocar} comNenhum={false} />
        </div>
        <BotaoRegistrar rotulo="Registrar estudo" className={s.btnPrimario} />
      </div>
      <nav className={s.atalhos} aria-label="Atalhos do edital">
        <Link href={`/aluno/questoes?e=${b.edital.id}`}><Icone d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3" />Questões</Link>
        <Link href="/aluno/cursos"><Icone d="M6 3h9l4 4v14H6zM14 3v5h5" />PDF</Link>
        <Link href="/aluno/simulados"><Icone d="M7 3h10v4H7zM5 7h14v14H5zM9 12l2 2 4-4" />Simulados</Link>
        <Link href="/aluno/questoes/listas"><Icone d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />Listas</Link>
      </nav>
      <div className={s.progresso}>
        <div className={s.progressoTexto}>
          <span>Conteúdos concluídos <b>{pct}%</b></span>
          <span>{feitos} de {folhas.length} conteúdos</span>
        </div>
        <div className={s.trilho}><span style={{ width: `${pct}%` }} /></div>
        <div className={s.conclusao} title="Data em que o último conteúdo pendente está programado">
          <Icone d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4M9 15l2 2 4-4" />
          Conclusão estimada <b>{fim ? dataLonga(fim) : '—'}</b>
          {atrasoProva && <span className={s.alertaProva}>depois da prova</span>}
        </div>
      </div>
    </div>
  );
}

export function Abas({ atual, retaFinal }: { atual: Aba; retaFinal?: boolean }) {
  return (
    <nav className={s.abas} aria-label="Seções do cronograma">
      {retaFinal && (
        <Link href="/aluno/cronograma/reta-final">
          <Icone d="M5 3v18M5 4h12l-2 4 2 4H5" />Plano Reta Final
        </Link>
      )}
      {ABAS.map((a) => (
        <Link key={a.id} href={`/aluno/cronograma?aba=${a.id}`} aria-current={a.id === atual ? 'page' : undefined}>
          <Icone d={a.icone} />{a.rotulo}
        </Link>
      ))}
    </nav>
  );
}

// ---------- Aba Cronograma ----------
function CartaoConteudo({ b, it, bloco }: { b: Base; it: Item; bloco?: number }) {
  const c = b.mapa.get(chaveDe(it.disciplina, it.chave));
  const st = status(b, it);
  return (
    <article className={`${s.bloco} ${st === 'feito' ? s.blocoFeito : ''}`}>
      <div className={s.blocoCabeca}>
        <div>
          {bloco != null && <span className={s.blocoNum}>Bloco {bloco}</span>}
          <h3 className={s.blocoDisc}>{it.disciplina}</h3>
          <p className={s.blocoAssunto}>{c?.nome ?? 'Conteúdo da disciplina'}</p>
          {st === 'atrasado' && <span className={s.tagAtraso}>Programado para {dataCurta(it.dia)} · atrasado</span>}
          {st === 'feito' && <span className={s.tagFeito}>Teoria concluída</span>}
        </div>
        <BotaoRegistrar conteudo={chaveDe(it.disciplina, it.chave === 'geral' ? '' : it.chave)} />
      </div>
      <div className={s.blocoLinks}>
        <Link href={linkQuestoes(b, c, it.disciplina)}>Questões</Link>
        <Link href="/aluno/cursos">PDF</Link>
        <Link href="/aluno/questoes/listas">Lista para imprimir</Link>
      </div>
    </article>
  );
}

export function AbaCronograma({ b, revisoes, semana }: { b: Base; revisoes: Revisao[]; semana: string }) {
  const hojeItens = b.itens.filter((i) => i.dia === b.hoje).sort((x, y) => x.ordem - y.ordem);
  const feitosHoje = hojeItens.filter((i) => status(b, i) === 'feito').length;
  const atrasados = b.itens.filter((i) => status(b, i) === 'atrasado').sort((x, y) => x.dia.localeCompare(y.dia) || x.ordem - y.ordem);
  const revHoje = revisoes.filter((r) => !r.feita_em && r.dia === b.hoje);
  const revAtras = revisoes.filter((r) => !r.feita_em && r.dia < b.hoje);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(semana, i));
  const fimSemana = dias[6];
  return (
    <>
      <div className={s.duasColunas}>
        <section className={s.painelBloco} aria-labelledby="h-estudos">
          <header className={s.painelCabeca}>
            <h2 id="h-estudos">Estudos</h2>
            <p>{hojeItens.length ? `${hojeItens.length - feitosHoje} de ${hojeItens.length} blocos pendentes para hoje.` : 'Nenhum bloco programado para hoje.'}</p>
            <div className={s.trilhoMini}><span style={{ width: `${hojeItens.length ? (100 * feitosHoje) / hojeItens.length : 0}%` }} /></div>
          </header>
          <div className={s.painelLista}>
            {hojeItens.map((it, i) => <CartaoConteudo key={chaveDe(it.disciplina, it.chave)} b={b} it={it} bloco={i + 1} />)}
            {!hojeItens.length && <p className={s.vazio}>Dia livre no seu cronograma. Que tal adiantar o próximo bloco ou fazer uma revisão?</p>}
          </div>
          {atrasados.length > 0 && (
            <form action={replanejar} className={s.atrasoAviso}>
              <input type="hidden" name="edital" value={b.edital.id} />
              <span><b>{atrasados.length}</b> {atrasados.length === 1 ? 'bloco atrasado' : 'blocos atrasados'}. Replanejar distribui os pendentes a partir de hoje.</span>
              <button className={s.btnMini}>Replanejar</button>
            </form>
          )}
        </section>
        <section className={`${s.painelBloco} ${s.painelRevisao}`} aria-labelledby="h-rev">
          <header className={s.painelCabeca}>
            <h2 id="h-rev">Revisões</h2>
            <p>{revHoje.length ? `${revHoje.length} ${revHoje.length === 1 ? 'revisão' : 'revisões'} para hoje.` : 'Nenhuma revisão para hoje.'}</p>
          </header>
          <div className={s.painelLista}>
            {revHoje.map((r) => <LinhaRevisao key={r.id} r={r} b={b} />)}
            {revAtras.length > 0 && <Link href="/aluno/cronograma?aba=revisoes&sub=atrasadas" className={s.linkAviso}>{revAtras.length} {revAtras.length === 1 ? 'revisão atrasada' : 'revisões atrasadas'} →</Link>}
          </div>
          <footer className={s.painelRodape}><Link href="/aluno/cronograma?aba=revisoes">Ver revisões →</Link></footer>
        </section>
      </div>

      <section className={s.semana} aria-labelledby="h-semana">
        <header className={s.semanaCabeca}>
          <Link href={`/aluno/cronograma?semana=${somarDias(semana, -7)}`} aria-label="Semana anterior">‹</Link>
          <div><h2 id="h-semana">Agenda de estudos da semana</h2><span>{dataCurta(semana)} – {dataCurta(fimSemana)}</span></div>
          <Link href={`/aluno/cronograma?semana=${somarDias(semana, 7)}`} aria-label="Próxima semana">›</Link>
        </header>
        <Legenda />
        <div className={s.semanaGrade}>
          {dias.map((d) => {
            const lista = b.itens.filter((i) => i.dia === d).sort((x, y) => x.ordem - y.ordem);
            const feitos = lista.filter((i) => status(b, i) === 'feito').length;
            return (
              <div key={d} className={`${s.semanaDia} ${d === b.hoje ? s.hoje : ''}`}>
                <div className={s.semanaDiaCabeca}><b>{DIAS_SEMANA[diaDaSemana(d)]}</b><span>{dataCurta(d)}</span><span>{feitos}/{lista.length}</span></div>
                {lista.map((it) => {
                  const st = status(b, it);
                  const c = b.mapa.get(chaveDe(it.disciplina, it.chave));
                  return (
                    <div key={chaveDe(it.disciplina, it.chave)} className={`${s.chipDia} ${s['st_' + st]}`} title={c?.nome}>
                      <i aria-hidden="true" /><span>{it.disciplina}</span>{st === 'atrasado' && <small>Atrasado</small>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className={s.semanaRodape}><Link href={`/aluno/cronograma?aba=calendario&mes=${semana.slice(0, 7)}`}>Ver calendário →</Link></div>
      </section>
    </>
  );
}

function Legenda() {
  return (
    <div className={s.legenda}>
      <span className={s.st_feito}><i />Concluído</span>
      <span className={s.st_programado}><i />Programado</span>
      <span className={s.st_atrasado}><i />Atrasado</span>
    </div>
  );
}

function LinhaRevisao({ r, b }: { r: Revisao; b: Base }) {
  const c = r.chave ? b.mapa.get(chaveDe(r.disciplina, r.chave)) : undefined;
  return (
    <div className={s.revisao}>
      <div className={s.revisaoTexto}>
        <b>{r.disciplina}</b>
        <span>{c?.nome ?? r.assunto_nome ?? 'Disciplina inteira'}</span>
        <small>{r.numero ? `${r.numero}ª revisão · ` : ''}{r.feita_em ? `feita em ${dataCurta(r.feita_em.slice(0, 10))}` : r.dia < b.hoje ? `atrasada desde ${dataCurta(r.dia)}` : dataLonga(r.dia)}</small>
      </div>
      <div className={s.revisaoAcoes}>
        <form action={concluirRevisao}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="feita" value={r.feita_em ? 'nao' : 'sim'} />
          <button className={r.feita_em ? s.btnMini : s.btnOk}>{r.feita_em ? 'Reabrir' : 'Concluir'}</button>
        </form>
        <form action={apagarRevisao}>
          <input type="hidden" name="id" value={r.id} />
          <button className={s.btnApagar} aria-label="Apagar revisão" title="Apagar">×</button>
        </form>
      </div>
    </div>
  );
}

// ---------- Aba Revisões ----------
export const SUBS = [
  { id: 'pendentes', rotulo: 'Pendentes' }, { id: 'atrasadas', rotulo: 'Atrasadas' },
  { id: 'agendadas', rotulo: 'Agendadas' }, { id: 'concluidas', rotulo: 'Concluídas' },
] as const;

export function AbaRevisoes({ b, revisoes, sub, disc, nova }: { b: Base; revisoes: Revisao[]; sub: string; disc: string; nova: React.ReactNode }) {
  const filtro = (r: Revisao) => !disc || r.disciplina === disc;
  const listas: Record<string, Revisao[]> = {
    pendentes: revisoes.filter((r) => !r.feita_em && r.dia === b.hoje),
    atrasadas: revisoes.filter((r) => !r.feita_em && r.dia < b.hoje).sort((x, y) => x.dia.localeCompare(y.dia)),
    agendadas: revisoes.filter((r) => !r.feita_em && r.dia > b.hoje).sort((x, y) => x.dia.localeCompare(y.dia)),
    concluidas: revisoes.filter((r) => r.feita_em).sort((x, y) => (y.feita_em ?? '').localeCompare(x.feita_em ?? '')),
  };
  const lista = (listas[sub] ?? listas.pendentes).filter(filtro);
  return (
    <>
      <div className={s.subLinha}>
        <nav className={s.subAbas} aria-label="Situação das revisões">
          {SUBS.map((x) => (
            <Link key={x.id} href={`/aluno/cronograma?aba=revisoes&sub=${x.id}${disc ? `&disc=${encodeURIComponent(disc)}` : ''}`} aria-current={x.id === sub ? 'page' : undefined}>
              {x.rotulo}{listas[x.id].length > 0 && x.id !== 'concluidas' && <span className={s.contador}>{listas[x.id].length}</span>}
            </Link>
          ))}
        </nav>
        {nova}
      </div>
      <form method="get" className={s.filtroLinha}>
        <input type="hidden" name="aba" value="revisoes" />
        <input type="hidden" name="sub" value={sub} />
        <select name="disc" defaultValue={disc} aria-label="Disciplina">
          <option value="">Todas as disciplinas</option>
          {b.estrutura.map((d) => <option key={d.nome} value={d.nome}>{d.nome}</option>)}
        </select>
        <button className={s.btnMini}>Filtrar</button>
      </form>
      <section className={s.painelBloco} aria-label="Revisões">
        <header className={s.painelCabecaSimples}><h2>Revisões</h2><span>{lista.length} {lista.length === 1 ? 'revisão' : 'revisões'}</span></header>
        <div className={s.painelLista}>
          {lista.slice(0, 200).map((r) => <LinhaRevisao key={r.id} r={r} b={b} />)}
          {!lista.length && <p className={s.vazio}>{sub === 'pendentes' ? 'Nenhuma revisão pendente para hoje.' : 'Nada por aqui.'}</p>}
        </div>
      </section>
    </>
  );
}

// ---------- Aba Histórico ----------
export const PERIODOS = [
  { id: 'hoje', rotulo: 'Hoje', dias: 1 }, { id: '7', rotulo: '7 dias', dias: 7 }, { id: '15', rotulo: '15 dias', dias: 15 },
  { id: '30', rotulo: 'Um mês', dias: 30 }, { id: '90', rotulo: 'Três meses', dias: 90 }, { id: '180', rotulo: 'Seis meses', dias: 180 },
  { id: '365', rotulo: 'Um ano', dias: 365 },
] as const;

function sequencias(dias: Set<string>, hoje: string) {
  const ord = [...dias].sort();
  let maior = 0;
  let run = 0;
  let ant: string | null = null;
  for (const d of ord) {
    run = ant && diasEntre(ant, d) === 1 ? run + 1 : 1;
    maior = Math.max(maior, run);
    ant = d;
  }
  let atual = 0;
  let d = dias.has(hoje) ? hoje : somarDias(hoje, -1);
  while (dias.has(d)) { atual++; d = somarDias(d, -1); }
  return { atual, maior };
}

export function AbaHistorico({ b, estudos, periodo, disc, tipo }: { b: Base; estudos: Estudo[]; periodo: string; disc: string; tipo: string }) {
  const p = PERIODOS.find((x) => x.id === periodo) ?? PERIODOS[1];
  const ini = somarDias(b.hoje, 1 - p.dias);
  const doPeriodo = estudos.filter((e) => e.dia >= ini && e.dia <= b.hoje && (!disc || e.disciplina === disc) && (!tipo || e.tipo === tipo));
  const total = doPeriodo.reduce((t, e) => t + e.minutos, 0);
  const revisao = doPeriodo.filter((e) => e.tipo === 'revisao').reduce((t, e) => t + e.minutos, 0);
  const diasCom = new Set(doPeriodo.filter((e) => e.minutos > 0).map((e) => e.dia));
  const todosDias = new Set(estudos.filter((e) => e.minutos > 0).map((e) => e.dia));
  const seq = sequencias(todosDias, b.hoje);
  const semana = inicioDaSemana(b.hoje);

  // gráfico: por dia (até 31 dias), por semana (até 6 meses) ou por mês
  const modo = p.dias <= 31 ? 'dia' : p.dias <= 180 ? 'semana' : 'mes';
  const grupos = new Map<string, { estudo: number; revisao: number }>();
  const chaveGrupo = (d: string) => (modo === 'dia' ? d : modo === 'semana' ? inicioDaSemana(d) : d.slice(0, 7));
  for (let d = ini; d <= b.hoje; d = somarDias(d, 1)) if (!grupos.has(chaveGrupo(d))) grupos.set(chaveGrupo(d), { estudo: 0, revisao: 0 });
  for (const e of doPeriodo) {
    const g = grupos.get(chaveGrupo(e.dia));
    if (g) g[e.tipo === 'revisao' ? 'revisao' : 'estudo'] += e.minutos;
  }
  const barras = [...grupos.entries()];
  const max = Math.max(60, ...barras.map(([, v]) => v.estudo + v.revisao));
  const rotuloBarra = (k: string) => (modo === 'mes' ? `${k.slice(5, 7)}/${k.slice(2, 4)}` : dataCurta(k));

  const filtroHref = (id: string) => `/aluno/cronograma?aba=historico&periodo=${id}${disc ? `&disc=${encodeURIComponent(disc)}` : ''}${tipo ? `&tipo=${tipo}` : ''}`;
  return (
    <>
      <nav className={s.subAbas} aria-label="Período">
        {PERIODOS.map((x) => <Link key={x.id} href={filtroHref(x.id)} aria-current={x.id === p.id ? 'page' : undefined}>{x.rotulo}</Link>)}
        <span className={s.periodoTexto}>{dataCurta(ini)} a {dataLonga(b.hoje)}</span>
      </nav>
      <form method="get" className={s.filtroLinha}>
        <input type="hidden" name="aba" value="historico" />
        <input type="hidden" name="periodo" value={p.id} />
        <select name="disc" defaultValue={disc} aria-label="Disciplina">
          <option value="">Todas as disciplinas</option>
          {[...new Set([...b.estrutura.map((d) => d.nome), ...estudos.map((e) => e.disciplina)])].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select name="tipo" defaultValue={tipo} aria-label="Tipo de estudo">
          <option value="">Todos os tipos</option>
          {Object.entries(TIPOS_ESTUDO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className={s.btnMini}>Filtrar</button>
      </form>

      <div className={s.indicadores}>
        <section className={s.painelBloco}>
          <h2 className={s.tituloCaixa}>Indicadores<small>Seguem o período e os filtros</small></h2>
          <div className={s.numeros}>
            <div><b>{minutosTexto(total)}</b><span>Tempo estudado</span><small>Estudo {minutosTexto(total - revisao)} · Revisão {minutosTexto(revisao)}</small></div>
            <div><b>{diasCom.size}<small>/{p.dias}</small></b><span>Dias com estudo</span><div className={s.trilhoMini}><span style={{ width: `${(100 * diasCom.size) / p.dias}%` }} /></div></div>
            <div><b>{minutosTexto(Math.round(total / p.dias))}</b><span>Média por dia</span><small>{total ? 'considerando todos os dias do período' : 'Sem estudos no período'}</small></div>
          </div>
        </section>
        <section className={s.painelBloco}>
          <h2 className={s.tituloCaixa}>Sequência de dias<small>Conta qualquer estudo, sem filtros</small></h2>
          <div className={s.numeros}>
            <div><b>{String(seq.atual).padStart(2, '0')}</b><span>Sequência atual</span></div>
            <div><b>{String(seq.maior).padStart(2, '0')}</b><span>Recorde</span></div>
          </div>
          <div className={s.diasSemana}>
            {Array.from({ length: 7 }, (_, i) => somarDias(semana, i)).map((d) => (
              <span key={d} className={todosDias.has(d) ? s.diaOk : d > b.hoje ? s.diaFuturo : undefined}>{DIAS_SEMANA[diaDaSemana(d)]}</span>
            ))}
          </div>
        </section>
      </div>

      <section className={s.painelBloco} aria-labelledby="h-tempo">
        <h2 id="h-tempo" className={s.tituloCaixa}>Tempo por {modo === 'dia' ? 'dia' : modo}</h2>
        <div className={s.grafico} role="img" aria-label={`Tempo de estudo por ${modo}`}>
          <div className={s.graficoEixo}><span>{minutosTexto(max)}</span><span>{minutosTexto(Math.round(max / 2))}</span><span>0</span></div>
          <div className={s.graficoBarras}>
            {barras.map(([k, v], i) => (
              <div key={k} className={s.graficoColuna} title={`${rotuloBarra(k)}: ${minutosTexto(v.estudo + v.revisao)}`}>
                <div className={s.graficoPilha}>
                  <span className={s.barRev} style={{ height: `${(100 * v.revisao) / max}%` }} />
                  <span className={s.barEst} style={{ height: `${(100 * v.estudo) / max}%` }} />
                </div>
                {barras.length <= 16 || i % Math.ceil(barras.length / 12) === 0 ? <small>{rotuloBarra(k)}</small> : <small />}
              </div>
            ))}
          </div>
        </div>
        <div className={s.legenda}><span className={s.st_programado}><i className={s.iEst} />Estudo</span><span className={s.st_programado}><i className={s.iRev} />Revisão</span></div>
      </section>

      <Atividade b={b} estudos={estudos} />

      <section className={s.painelBloco} aria-labelledby="h-reg">
        <h2 id="h-reg" className={s.tituloCaixa}>Registros do período</h2>
        <div className={s.painelLista}>
          {[...doPeriodo].sort((x, y) => y.dia.localeCompare(x.dia) || y.id - x.id).slice(0, 60).map((e) => (
            <div key={e.id} className={s.revisao}>
              <div className={s.revisaoTexto}>
                <b>{e.disciplina}</b>
                <span>{(e.chave && b.mapa.get(chaveDe(e.disciplina, e.chave))?.nome) ?? e.assunto_nome ?? 'Disciplina inteira'}</span>
                <small>{dataLonga(e.dia)} · {minutosTexto(e.minutos)} · {TIPOS_ESTUDO[e.tipo] ?? e.tipo}{e.observacoes ? ` · ${e.observacoes}` : ''}</small>
              </div>
              <form action={apagarEstudo}>
                <input type="hidden" name="id" value={e.id} />
                <button className={s.btnApagar} aria-label="Apagar registro" title="Apagar">×</button>
              </form>
            </div>
          ))}
          {!doPeriodo.length && <p className={s.vazio}>Nenhum estudo registrado no período. Use o botão Registrar estudo ou o cronômetro no topo.</p>}
        </div>
      </section>
    </>
  );
}

function Atividade({ b, estudos }: { b: Base; estudos: Estudo[] }) {
  const porDia = new Map<string, number>();
  for (const e of estudos) porDia.set(e.dia, (porDia.get(e.dia) ?? 0) + e.minutos);
  const fim = b.hoje;
  const inicio = somarDias(fim, -364 - diaDaSemana(somarDias(fim, -364)));
  const semanas: string[][] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) {
    if (diaDaSemana(d) === 0 || !semanas.length) semanas.push([]);
    semanas[semanas.length - 1].push(d);
  }
  const nivel = (m: number) => (m <= 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4);
  const comEstudo = [...porDia.entries()].filter(([d, m]) => m > 0 && d >= inicio).length;
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return (
    <section className={s.painelBloco} aria-labelledby="h-ativ">
      <h2 id="h-ativ" className={s.tituloCaixa}>Atividade nos últimos 12 meses<small>Todas as fontes, sem filtros · {comEstudo} dias com estudo</small></h2>
      <div className={s.mapaCalor}>
        <div className={s.mapaDias}>{['Dom', '', 'Ter', '', 'Qui', '', 'Sáb'].map((d, i) => <span key={i} style={{ gridRow: i + 2 }}>{d}</span>)}</div>
        <div className={s.mapaSemanas}>
          {semanas.map((sem, i) => (
            <div key={i} className={s.mapaColuna}>
              <span className={s.mapaMes}>{sem.some((d) => d.slice(8) === '01') ? MESES[Number(sem.find((d) => d.slice(8) === '01')!.slice(5, 7)) - 1] : ''}</span>
              {i === 0 && Array.from({ length: diaDaSemana(sem[0]) }, (_, k) => <i key={`v${k}`} className={s.mapaVazio} />)}
              {sem.map((d) => <i key={d} className={s[`n${nivel(porDia.get(d) ?? 0)}`]} title={`${dataLonga(d)}: ${minutosTexto(porDia.get(d) ?? 0)}`} />)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Aba Calendário ----------
export function AbaCalendario({ b, revisoes, mes }: { b: Base; revisoes: Revisao[]; mes: string }) {
  const primeiro = `${mes}-01`;
  const ano = Number(mes.slice(0, 4));
  const m = Number(mes.slice(5, 7));
  const ultimoDia = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const comeco = somarDias(primeiro, -diaDaSemana(primeiro));
  const semanas = Math.ceil((diaDaSemana(primeiro) + ultimoDia) / 7);
  const mesAnt = somarDias(primeiro, -1).slice(0, 7);
  const mesProx = somarDias(primeiro, 32).slice(0, 7);
  const NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return (
    <section className={s.calendario} aria-labelledby="h-cal">
      <header className={s.calCabeca}>
        <Link href={`/aluno/cronograma?aba=calendario&mes=${mesAnt}`}>‹ Mês anterior</Link>
        <h2 id="h-cal">{NOMES[m - 1]} de {ano}</h2>
        <Link href={`/aluno/cronograma?aba=calendario&mes=${mesProx}`}>Próximo mês ›</Link>
      </header>
      <Legenda />
      <div className={s.calGrade} role="grid">
        {DIAS_SEMANA.map((d) => <div key={d} className={s.calSemana} role="columnheader">{d.toLowerCase()}.</div>)}
        {Array.from({ length: semanas * 7 }, (_, i) => somarDias(comeco, i)).map((d) => {
          const fora = d.slice(0, 7) !== mes;
          const lista = b.itens.filter((i) => i.dia === d).sort((x, y) => x.ordem - y.ordem);
          const revs = revisoes.filter((r) => r.dia === d);
          return (
            <div key={d} role="gridcell" className={`${s.calDia} ${fora ? s.calFora : ''} ${d === b.hoje ? s.calHoje : ''}`}>
              <span className={s.calNum}>{Number(d.slice(8))}{d === b.hoje && <em>Hoje</em>}</span>
              {!fora && lista.slice(0, 3).map((it) => (
                <div key={chaveDe(it.disciplina, it.chave)} className={`${s.chipDia} ${s['st_' + status(b, it)]}`} title={b.mapa.get(chaveDe(it.disciplina, it.chave))?.nome}>
                  <i aria-hidden="true" /><span>{it.disciplina}</span>
                </div>
              ))}
              {!fora && lista.length > 3 && <small className={s.calMais}>+{lista.length - 3} mais</small>}
              {!fora && revs.length > 0 && <small className={s.calRev}>{revs.length} {revs.length === 1 ? 'revisão' : 'revisões'}</small>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Aba Edital (verticalizado) ----------
export type Aproveitamento = Map<string, { meus: [number, number]; outros: [number, number] }>; // "disciplina::assunto"

const pctDe = ([a, t]: [number, number]) => (t ? Math.round((100 * a) / t) : null);
function Pct({ v, comparar }: { v: number | null; comparar?: number | null }) {
  if (v == null) return <span className={s.pctVazio}>—</span>;
  const seta = comparar == null ? '' : v >= comparar ? s.pctCima : s.pctBaixo;
  return <span className={`${s.pct} ${seta}`}>{v}%</span>;
}

export function AbaEdital({ b, aprov, disc }: { b: Base; aprov: Aproveitamento; disc: string }) {
  const soma = (pares: ([number, number] | undefined)[]): [number, number] => pares.reduce<[number, number]>((t, p) => (p ? [t[0] + p[0], t[1] + p[1]] : t), [0, 0]);
  const aprovDe = (d: string, nomes: string[]) => {
    const x = nomes.map((n) => aprov.get(`${d}::${n}`));
    return { meus: soma(x.map((y) => y?.meus)), outros: soma(x.map((y) => y?.outros)) };
  };
  const folhas = b.estrutura.flatMap((d) => d.folhas);
  const feitas = folhas.filter((c) => b.progresso.get(chaveDe(c.disciplina, c.chave))?.teoria).length;
  const lista = b.estrutura.filter((d) => !disc || d.nome === disc);
  return (
    <section className={s.edital} aria-labelledby="h-edital">
      <header className={s.editalCabeca}>
        <h2 id="h-edital">Edital verticalizado</h2>
        <form method="get" className={s.filtroLinha} style={{ margin: 0 }}>
          <input type="hidden" name="aba" value="edital" />
          <select name="disc" defaultValue={disc} aria-label="Buscar disciplina">
            <option value="">Todas as disciplinas</option>
            {b.estrutura.map((d) => <option key={d.nome} value={d.nome}>{d.nome}</option>)}
          </select>
          <button className={s.btnMini}>Ver</button>
        </form>
      </header>
      <div className={s.editalProgresso}>
        <span>Teoria concluída no edital</span><b>{folhas.length ? Math.round((100 * feitas) / folhas.length) : 0}%</b>
        <div className={s.trilho}><span style={{ width: `${folhas.length ? (100 * feitas) / folhas.length : 0}%` }} /></div>
      </div>
      <div className={s.tabelaRolagem}>
        <div className={s.tabela} role="table" aria-label="Edital verticalizado">
          <div className={`${s.tl} ${s.tlCabeca}`} role="row">
            <span role="columnheader">Disciplina / assunto</span>
            <span role="columnheader">Iniciar</span>
            <span role="columnheader">Material</span>
            <span role="columnheader">Teoria</span>
            {[1, 2, 3, 4, 5, 6].map((n) => <span key={n} role="columnheader">{n}ª</span>)}
            <span role="columnheader" title="Seu aproveitamento nas questões do assunto">Meu</span>
            <span role="columnheader" title="Aproveitamento dos demais alunos">Outros</span>
          </div>
          {lista.map((d) => {
            const feitasD = d.folhas.filter((c) => b.progresso.get(chaveDe(c.disciplina, c.chave))?.teoria).length;
            const todos = aprovDe(d.nome, [...new Set([...aprov.keys()].filter((k) => k.startsWith(d.nome + '::')).map((k) => k.slice(d.nome.length + 2)))]);
            const meuD = pctDe(todos.meus);
            const outD = pctDe(todos.outros);
            return (
              <details key={d.nome} className={s.grupoDisc} open={!!disc || lista.length === 1}>
                <summary className={`${s.tl} ${s.tlDisc}`} role="row">
                  <span role="cell" className={s.nomeDisc}>{d.nome}{d.questoes ? <small>{d.questoes} questões</small> : null}</span>
                  <span role="cell" /><span role="cell" />
                  <span role="cell" className={s.contaTeoria}>{feitasD}/{d.folhas.length}<i style={{ width: `${d.folhas.length ? (100 * feitasD) / d.folhas.length : 0}%` }} /></span>
                  {[0, 1, 2, 3, 4, 5].map((n) => <span key={n} role="cell" />)}
                  <span role="cell"><Pct v={meuD} comparar={outD} /></span>
                  <span role="cell"><Pct v={outD} /></span>
                </summary>
                {d.linhas.map((c) => {
                  const k = chaveDe(c.disciplina, c.chave);
                  const pr = b.progresso.get(k);
                  const nomes = c.folha ? [c.nomeCurto] : [c.nomeCurto, ...c.folhasAbaixo.map((f) => b.mapa.get(chaveDe(c.disciplina, f))?.nomeCurto ?? '')];
                  const ap = aprovDe(c.disciplina, nomes.filter(Boolean));
                  const meu = pctDe(ap.meus);
                  const out = pctDe(ap.outros);
                  const feitasSub = c.folhasAbaixo.filter((f) => b.progresso.get(chaveDe(c.disciplina, f))?.teoria).length;
                  return (
                    <div key={k} className={`${s.tl} ${c.folha ? '' : s.tlGrupo}`} role="row">
                      <span role="cell" className={s.nomeAssunto} style={{ paddingLeft: 14 + c.nivel * 18 }}>{c.nome}</span>
                      <span role="cell">{c.folha && <BotaoRegistrar conteudo={chaveDe(c.disciplina, c.chave === 'geral' ? '' : c.chave)} rotulo="" className={s.btnIcone} />}</span>
                      <span role="cell">{c.folha && (
                        <Link href={linkQuestoes(b, c, c.disciplina)} className={s.btnIcone} title="Questões do assunto" aria-label={`Questões de ${c.nome}`}>
                          <Icone d="M4 5h7v14H4zM13 5h7v14h-7z" />
                        </Link>
                      )}</span>
                      <span role="cell">{c.folha
                        ? <Marcador edital={b.edital.id} disciplina={c.disciplina} chave={c.chave} campo="teoria" valor={!!pr?.teoria} rotulo={`Teoria de ${c.nome}`} />
                        : <span className={s.contaTeoria}>{feitasSub}/{c.folhasAbaixo.length}</span>}</span>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <span key={n} role="cell">{c.folha && <Marcador edital={b.edital.id} disciplina={c.disciplina} chave={c.chave} campo={n} valor={!!pr?.revisoes?.[n]} rotulo={`${n + 1}ª revisão de ${c.nome}`} />}</span>
                      ))}
                      <span role="cell"><Pct v={meu} comparar={out} /></span>
                      <span role="cell"><Pct v={out} /></span>
                    </div>
                  );
                })}
              </details>
            );
          })}
        </div>
      </div>
      <p className={s.notaEdital}>“Meu” e “Outros” mostram o aproveitamento nas questões do banco de cada assunto. Marque a teoria quando terminar o assunto; as revisões são marcadas sozinhas quando você conclui a revisão agendada.</p>
    </section>
  );
}
