import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { dataCurta, dataLonga, diasEntre, hojeBr, somarDias } from '@/lib/cronograma';
import { DATA_PROVA, OPCOES_TEMPO, fimCom, montarPlano, rotuloTempo, type ItemPlano } from '@/lib/planoCurso';
import { carregarPlano } from '@/lib/planoServidor';
import { Abas } from '../Vistas';
import { FaixaRitmo } from './CronogramaHoje';
import { FormRitmo } from './FormRitmo';
import { Lista } from './ListaPlano';
import s from './plano.module.css';
import c from '../cronograma.module.css';

export const metadata = { title: 'Cronograma personalizado' };
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
  const d = await carregarPlano(supabase, perfil.id);

  if (!d) {
    return (
      <div className={s.pagina}>
        <Voltar />
        <section className={s.cartao}>
          <span className="rotulo">Reta Final PM PE</span>
          <h1 className={s.h1}>O cronograma personalizado é do curso Reta Final PM PE</h1>
          <p className="suave">Quem tem o curso recebe aqui o plano do dia: os PDFs de cada bloco de 15 minutos e as questões de cada bloco.</p>
          <Link href="/curso/reta-final-pmpe" className="btn btn-azul" style={{ alignSelf: 'flex-start' }}>Conhecer o curso</Link>
        </section>
      </div>
    );
  }
  const { itens, cfg, feitos, temPdf } = d;
  // as outras abas do cronograma (revisões, histórico…) só para quem também montou o cronograma do edital
  const { count: temGeral } = await supabase.from('cronogramas').select('edital_id', { count: 'exact', head: true }).eq('aluno_id', perfil.id);
  const abas = temGeral ? <div className={c.abasLinha}><Abas atual="cronograma" retaFinal /></div> : null;

  if (!itens.length) {
    return (<div className={s.pagina}><section className={s.cartao}><h1 className={s.h1}>O cronograma está sendo preparado</h1><p className="suave">Volte em breve.</p></section></div>);
  }

  // primeira vez: iniciar o cronograma
  if (!cfg) {
    return (<div className={s.pagina}>{abas}<FaixaRitmo d={d} /></div>);
  }

  // ajustar dia e horas
  if (sp.ajustar === '1') {
    return (
      <div className={s.pagina}>
        {abas}
        <section className={`cartao-gradiente ${s.destaque}`} aria-labelledby="ajustar">
          <span className="rotulo">Cronograma personalizado</span>
          <h1 id="ajustar" className={s.destaqueTitulo}>Ajustar dia e horas</h1>
          <p className={s.destaqueTexto}>Mude quando quiser: o que você já concluiu continua feito e o resto é redistribuído.</p>
          <FormRitmo itens={itens} feitos={feitos} cfg={cfg} hoje={hoje} />
          <Link href="/aluno/cronograma/reta-final" style={{ color: '#fff' }}>← Voltar ao cronograma</Link>
        </section>
      </div>
    );
  }

  const plano = montarPlano(itens, feitos, cfg, hoje);
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
      {abas}
      <FaixaRitmo d={d} />
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

