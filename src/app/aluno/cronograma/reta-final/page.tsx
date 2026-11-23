import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { dataCurta, hojeBr, inicioDaSemana, valido } from '@/lib/cronograma';
import { DATA_PROVA, OPCOES_TEMPO, fimCom, montarPlano, rotuloTempo } from '@/lib/planoCurso';
import { carregarPlano } from '@/lib/planoServidor';
import { Abas } from '../Vistas';
import { FaixaRitmo } from './CronogramaHoje';
import { FormRitmo } from './FormRitmo';
import { Lista } from './ListaPlano';
import { PainelDia, SemanaPlano, TopoPlano } from './VistaPlano';
import c from '../cronograma.module.css';
import s from './plano.module.css';

export const metadata = { title: 'Cronograma personalizado' };
export const dynamic = 'force-dynamic';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const diaSem = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay();
const duracao = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);

export default async function CronogramaPersonalizado({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, perfil } = await acessoAtual();
  const hoje = hojeBr();
  const d = await carregarPlano(supabase, perfil.id);

  if (!d) {
    return (
      <div className={c.pagina}>
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
  // as outras abas (revisões, histórico…) só para quem também montou o cronograma do edital
  const { count: temGeral } = await supabase.from('cronogramas').select('edital_id', { count: 'exact', head: true }).eq('aluno_id', perfil.id);
  const abas = temGeral ? <div className={c.abasLinha}><Abas atual="cronograma" retaFinal /></div> : null;

  if (!itens.length) {
    return (<div className={c.pagina}><section className={s.cartao}><h1 className={s.h1}>O cronograma está sendo preparado</h1><p className="suave">Volte em breve.</p></section></div>);
  }
  if (!cfg) return (<div className={c.pagina}>{abas}<FaixaRitmo d={d} /></div>);

  if (sp.ajustar === '1') {
    return (
      <div className={c.pagina}>
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
  const futuros = plano.dias.filter((x) => x.dia > hoje && x.itens.some((i) => !i.feito));
  const selecionado = valido(sp.dia) ? sp.dia : hoje;
  const doDia = plano.dias.find((x) => x.dia === selecionado);
  const proximo = futuros.find((x) => x.dia > selecionado)?.dia;
  const semana = valido(sp.semana) ? inicioDaSemana(sp.semana) : inicioDaSemana(selecionado);
  const passou = plano.fim && plano.fim > DATA_PROVA;
  const comMais = passou ? OPCOES_TEMPO.filter((m) => m > cfg.minutos_dia).map((m) => ({ m, fim: fimCom(itens, feitos, cfg, hoje, m) })).find((x) => x.fim && x.fim <= DATA_PROVA) : null;

  return (
    <div className={c.pagina}>
      <TopoPlano minutos={cfg.minutos_dia} feito={plano.feito} total={plano.total} fim={plano.fim} inicio={cfg.inicio} />
      {abas}
      {passou && (
        <p className={s.alerta} role="alert">
          Neste ritmo o cronograma termina depois da prova.{comMais ? <> Com <b>{rotuloTempo(comMais.m)} por dia</b> ele termina em {dataCurta(comMais.fim!)}. <Link href="/aluno/cronograma/reta-final?ajustar=1">Ajustar dia e horas</Link></> : ' Aumente as horas por dia ou estude também nos dias livres.'}
        </p>
      )}
      {selecionado !== hoje && <Link href="/aluno/cronograma/reta-final" className={s.voltar}>← Voltar para hoje</Link>}
      <PainelDia dia={doDia} hoje={hoje} temPdf={temPdf} primeiroFuturo={proximo} />
      <SemanaPlano dias={plano.dias} hoje={hoje} semana={semana} selecionado={selecionado} />

      {sp.ver === 'tudo' && (
        <section className={s.cartao} aria-labelledby="tudo">
          <h2 id="tudo" className={s.h2}>Cronograma inteiro ({futuros.length} dias pela frente)</h2>
          {futuros.map((x) => (
            <details key={x.dia} className={s.dia}>
              <summary><b>{SEMANA[diaSem(x.dia)]} {dataCurta(x.dia)}</b><span>{resumo(x.itens)}</span><span className={s.tempo}>{duracao(x.minutos)}</span></summary>
              <Lista itens={x.itens} temPdf={temPdf} podeMarcar />
            </details>
          ))}
        </section>
      )}
      <p className="suave" style={{ fontSize: 13.5, margin: 0 }}>
        Atrasou? Não precisa fazer nada: o que ficou para trás passa para os próximos dias. Adiantou? Conclua os blocos de outro dia e o cronograma anda junto.
      </p>
    </div>
  );
}

function resumo(itens: { tipo: string; titulo: string; disciplina: string; sigla: string }[]) {
  const nomes: string[] = [];
  for (const i of itens) {
    const n = i.tipo === 'simulado' || i.tipo === 'mini' ? i.titulo : i.tipo === 'revisao' ? `Revisão ${i.sigla}` : i.tipo === 'proposta' ? 'Redação (proposta)' : `${i.disciplina} ${i.titulo.slice(0, 7)}`;
    if (!nomes.includes(n)) nomes.push(n);
  }
  return nomes.join(' · ');
}
