import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { dataCurta, dataLonga, diasEntre, hojeBr, somarDias } from '@/lib/cronograma';
import { CURSO, DATA_PROVA, OPCOES_TEMPO, fimCom, montarPlano, rotuloTempo, type ConfigPlano, type ItemPlano } from '@/lib/planoCurso';
import { FormAcao } from '@/app/professor/FormAcao';
import { salvarPlano } from './acoes';
import { Lista } from './ListaPlano';
import s from './plano.module.css';

export const metadata = { title: 'Plano da Reta Final PM PE' };
export const dynamic = 'force-dynamic';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOME_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const diaSem = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay();
const duracao = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
const semanas = (d: number) => { const w = Math.floor(d / 7), r = d % 7; return `${w} semana${w === 1 ? '' : 's'}${r ? ` e ${r} dia${r === 1 ? '' : 's'}` : ''}`; };

export default async function PlanoRetaFinal({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, perfil } = await acessoAtual();
  const hoje = hojeBr();
  const { data: tem } = await supabase.rpc('tem_curso', { p_slug: CURSO });

  if (!tem) {
    return (
      <div className={s.pagina}>
        <Voltar />
        <section className={s.cartao}>
          <span className="rotulo">Reta Final PM PE</span>
          <h1 className={s.h1}>O plano de 8 semanas é do curso Reta Final PM PE</h1>
          <p className="suave">Quem tem o curso recebe aqui o plano do dia: os PDFs de cada bloco de 15 minutos e as questões de cada bloco.</p>
          <Link href="/curso/reta-final-pmpe" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>Conhecer o curso</Link>
        </section>
      </div>
    );
  }

  const [{ data: its }, { data: cfgRaw }, { data: fts }, { data: pdfs }] = await Promise.all([
    supabase.from('plano_curso_itens').select('codigo, seq, tipo, sigla, disciplina, titulo, subtitulo, minutos, pdf, caderno, aula, ciclo, extra').eq('produto_slug', CURSO).order('seq'),
    supabase.from('planos_aluno').select('inicio, minutos_dia, dias_semana').eq('aluno_id', perfil.id).eq('produto_slug', CURSO).maybeSingle(),
    supabase.from('plano_feitos').select('codigo, dia').eq('aluno_id', perfil.id).eq('produto_slug', CURSO),
    supabase.from('pdfs_curso').select('codigo').eq('produto_slug', CURSO),
  ]);
  const itens = (its ?? []) as ItemPlano[];
  const cfg = cfgRaw as ConfigPlano | null;
  const feitos = new Map(((fts ?? []) as { codigo: string; dia: string }[]).map((x) => [x.codigo, x.dia]));
  const temPdf = new Set(((pdfs ?? []) as { codigo: string }[]).map((x) => x.codigo));

  if (!itens.length) {
    return (<div className={s.pagina}><Voltar /><section className={s.cartao}><h1 className={s.h1}>O plano está sendo preparado</h1><p className="suave">Volte em breve.</p></section></div>);
  }

  // montar ou ajustar o ritmo
  if (!cfg || sp.ajustar === '1') {
    const base: ConfigPlano = cfg ?? { inicio: hoje, minutos_dia: 120, dias_semana: [0, 1, 2, 3, 4, 5, 6] };
    const previsoes = OPCOES_TEMPO.map((m) => ({ m, fim: fimCom(itens, feitos, base, hoje, m) }));
    return (
      <div className={s.pagina}>
        <Voltar />
        <section className={s.cartao}>
          <span className="rotulo">Reta Final PM PE</span>
          <h1 className={s.h1}>{cfg ? 'Ajustar o seu ritmo' : 'Monte o seu plano de 8 semanas'}</h1>
          <p className="suave" style={{ margin: 0 }}>
            O padrão é <b>2 horas por dia</b> (8 blocos de 15 minutos), todos os dias: assim o curso cabe em cerca de 8 semanas.
            Se você tem mais tempo, escolha abaixo: o plano anda mais rápido. Você pode mudar quando quiser, sem perder o que já fez.
          </p>
          <FormAcao acao={salvarPlano} botao={cfg ? 'Salvar e refazer o plano' : 'Começar meu plano'}>
            <div className={s.grade}>
              <div className="campo">
                <label htmlFor="pl-min">Tempo de estudo por dia</label>
                <select id="pl-min" name="minutos" defaultValue={base.minutos_dia}>
                  {previsoes.map(({ m, fim }) => (
                    <option key={m} value={m}>{rotuloTempo(m)} por dia{m === 120 ? ' (padrão)' : ''}{fim ? ` · termina em ${dataCurta(fim)}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="pl-ini">Começar em</label>
                <input id="pl-ini" type="date" name="inicio" defaultValue={base.inicio < hoje ? hoje : base.inicio} min={hoje} />
              </div>
            </div>
            <fieldset className={s.dias}>
              <legend>Dias de estudo</legend>
              {SEMANA.map((d, i) => (
                <label key={d}><input type="checkbox" name="dias" value={i} defaultChecked={base.dias_semana.includes(i)} />{d}</label>
              ))}
            </fieldset>
            <p className="suave" style={{ margin: 0, fontSize: 14 }}>A prova está prevista para {dataLonga(DATA_PROVA)}. Os simulados ocupam um dia inteiro (4h30).</p>
          </FormAcao>
          {cfg && <Link href="/aluno/cronograma/reta-final">← Voltar ao plano</Link>}
        </section>
      </div>
    );
  }

  const plano = montarPlano(itens, feitos, cfg, hoje);
  const pct = Math.round((100 * plano.feito) / Math.max(1, plano.total));
  const doDia = (d: string) => plano.dias.find((x) => x.dia === d);
  const hojeP = doDia(hoje);
  const futuros = plano.dias.filter((d) => d.dia > hoje && d.itens.some((i) => !i.feito));
  const passou = plano.fim && plano.fim > DATA_PROVA;
  const comMais = passou ? OPCOES_TEMPO.filter((m) => m > cfg.minutos_dia).map((m) => ({ m, fim: fimCom(itens, feitos, cfg, hoje, m) })).find((x) => x.fim && x.fim <= DATA_PROVA) : null;
  const comecaDepois = cfg.inicio > hoje;
  const proximos = comecaDepois ? futuros.slice(1) : futuros;
  const ver = sp.ver === 'tudo' ? proximos : proximos.slice(0, 6);

  return (
    <div className={s.pagina}>
      <Voltar />
      <section className={s.topo}>
        <div>
          <span className="rotulo">Reta Final PM PE · {rotuloTempo(cfg.minutos_dia)} por dia</span>
          <h1 className={s.h1}>Seu plano de estudos</h1>
          <p className="suave" style={{ margin: 0 }}>
            {plano.fim ? <>Término previsto: <b>{dataLonga(plano.fim)}</b> ({semanas(diasEntre(cfg.inicio, plano.fim) + 1)} desde o início). Prova: {dataLonga(DATA_PROVA)}.</> : <b>Você concluiu o plano inteiro. Parabéns!</b>}
          </p>
        </div>
        <Link href="/aluno/cronograma/reta-final?ajustar=1" className="btn btn-linha">Ajustar tempo por dia</Link>
      </section>
      <div className={s.progresso} aria-label={`${pct}% do plano concluído`}><span style={{ width: `${pct}%` }} /></div>
      <p className="suave" style={{ margin: 0, fontSize: 14 }}>{pct}% concluído · {duracao(plano.feito)} de {duracao(plano.total)}</p>

      {passou && (
        <p className={s.alerta} role="alert">
          Neste ritmo o plano termina depois da prova.{comMais ? <> Com <b>{rotuloTempo(comMais.m)} por dia</b> ele termina em {dataCurta(comMais.fim!)}. <Link href="/aluno/cronograma/reta-final?ajustar=1">Ajustar</Link></> : ' Aumente o tempo por dia ou estude também nos dias livres.'}
        </p>
      )}

      <section className={s.cartao} aria-labelledby="hoje">
        <h2 id="hoje" className={s.h2}>{comecaDepois && futuros[0] ? `Seu plano começa ${NOME_DIA[diaSem(futuros[0].dia)]}, ${dataCurta(futuros[0].dia)}` : `Hoje · ${NOME_DIA[diaSem(hoje)]}, ${dataCurta(hoje)}`}</h2>
        {comecaDepois ? (
          <Lista itens={futuros[0]?.itens ?? []} temPdf={temPdf} podeMarcar />
        ) : hojeP && hojeP.itens.length ? (
          <>
            <p className="suave" style={{ margin: 0, fontSize: 14 }}>{hojeP.itens.filter((i) => i.feito).length} de {hojeP.itens.length} feitos · {duracao(hojeP.minutos)} no total</p>
            <Lista itens={hojeP.itens} temPdf={temPdf} podeMarcar />
          </>
        ) : (
          <p className="suave" style={{ margin: 0 }}>Hoje não é dia de estudo no seu plano. Se quiser adiantar, conclua os itens do próximo dia: o plano se ajusta sozinho.</p>
        )}
      </section>

      {proximos.length > 0 && (
        <section className={s.cartao} aria-labelledby="proximos">
          <h2 id="proximos" className={s.h2}>Próximos dias</h2>
          {ver.map((d) => (
            <details key={d.dia} className={s.dia}>
              <summary>
                <b>{SEMANA[diaSem(d.dia)]} {dataCurta(d.dia)}</b>
                <span>{resumo(d.itens)}</span>
                <span className={s.tempo}>{duracao(d.minutos)}</span>
              </summary>
              <Lista itens={d.itens} temPdf={temPdf} podeMarcar />
            </details>
          ))}
          {sp.ver !== 'tudo' && proximos.length > ver.length && <Link href="/aluno/cronograma/reta-final?ver=tudo">Ver o plano inteiro ({proximos.length} dias) →</Link>}
        </section>
      )}

      {plano.dias.some((d) => d.dia < hoje) && (
        <details className={s.cartao}>
          <summary className={s.h2} style={{ cursor: 'pointer' }}>Dias anteriores</summary>
          {plano.dias.filter((d) => d.dia < hoje).reverse().slice(0, 30).map((d) => (
            <div key={d.dia} className={s.passado}><b>{SEMANA[diaSem(d.dia)]} {dataCurta(d.dia)}</b> <span>{resumo(d.itens)}</span></div>
          ))}
        </details>
      )}
      <p className="suave" style={{ fontSize: 13.5, margin: 0 }}>
        Atrasou? Não precisa fazer nada: o que ficou para trás passa para os próximos dias. Adiantou? Conclua os itens de amanhã e o plano anda junto.
        {' '}Seu plano começou em {dataCurta(cfg.inicio)}{cfg.inicio < hoje ? ` (${diasEntre(cfg.inicio, hoje)} dias atrás)` : ''}.
      </p>
    </div>
  );
}

function resumo(itens: (ItemPlano & { feito: boolean })[]) {
  const nomes: string[] = [];
  for (const i of itens) {
    const n = i.tipo === 'simulado' ? i.titulo : i.tipo === 'mini' ? i.titulo : i.tipo === 'revisao' ? `Revisão ${i.sigla}` : i.tipo === 'proposta' ? 'Redação (proposta)' : `${i.disciplina} ${i.titulo.slice(0, 7)}`;
    if (!nomes.includes(n)) nomes.push(n);
  }
  return nomes.join(' · ');
}

function Voltar() {
  return <Link href="/aluno/cronograma" className={s.voltar}>← Cronograma</Link>;
}

