import Link from 'next/link';
import { dataCurta, dataLonga, hojeBr } from '@/lib/cronograma';
import { montarPlano, rotuloTempo } from '@/lib/planoCurso';
import type { DadosPlano } from '@/lib/planoServidor';
import { FormRitmo } from './FormRitmo';
import { Lista } from './ListaPlano';
import s from './plano.module.css';

const NOME_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const diaSem = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay();

// Faixa de destaque: o ritmo do aluno e o botão de ajustar (ou o convite para iniciar)
export function FaixaRitmo({ d, compacta }: { d: DadosPlano; compacta?: boolean }) {
  const hoje = hojeBr();
  if (!d.cfg) {
    return (
      <section className={`cartao-gradiente ${s.destaque}`} aria-labelledby="iniciar">
        <span className="rotulo">Reta Final PM PE</span>
        <h2 id="iniciar" className={s.destaqueTitulo}>Iniciar cronograma personalizado</h2>
        <p className={s.destaqueTexto}>Escolha o dia em que você começa e quantas horas tem por dia. O site monta o seu cronograma com os PDFs de cada bloco de 15 minutos e as questões de cada bloco. Com 2 horas por dia, o curso cabe em 8 semanas.</p>
        <FormRitmo itens={d.itens} feitos={d.feitos} cfg={null} hoje={hoje} />
      </section>
    );
  }
  const plano = montarPlano(d.itens, d.feitos, d.cfg, hoje);
  const pct = Math.round((100 * plano.feito) / Math.max(1, plano.total));
  return (
    <section className={`cartao-gradiente ${s.destaque} ${s.destaqueLinha}`} aria-label="Seu cronograma personalizado">
      <div style={{ minWidth: 0, flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="rotulo">Cronograma personalizado · Reta Final PM PE</span>
        <b className={s.destaqueTitulo} style={{ fontSize: compacta ? 22 : undefined }}>{rotuloTempo(d.cfg.minutos_dia)} por dia · {pct}% concluído</b>
        <span className={s.destaqueTexto}>
          {d.cfg.inicio > hoje ? `Começa ${NOME_DIA[diaSem(d.cfg.inicio)]}, ${dataCurta(d.cfg.inicio)}` : `Começou em ${dataCurta(d.cfg.inicio)}`}
          {plano.fim ? ` · término previsto em ${dataLonga(plano.fim)}` : ' · plano concluído!'}
        </span>
        <span className={s.barraClara}><span style={{ width: `${pct}%` }} /></span>
      </div>
      <Link href="/aluno/cronograma/reta-final?ajustar=1" className={s.botaoAjustar}>Ajustar dia e horas</Link>
    </section>
  );
}

// Plano de hoje no Início (mesmo cronograma da aba Cronograma)
export function CronogramaHoje({ d }: { d: DadosPlano }) {
  const hoje = hojeBr();
  if (!d.cfg) return <FaixaRitmo d={d} />;
  const plano = montarPlano(d.itens, d.feitos, d.cfg, hoje);
  const doDia = plano.dias.find((x) => x.dia === hoje);
  const proximo = plano.dias.find((x) => x.dia > hoje && x.itens.some((i) => !i.feito));
  const mostrar = doDia?.itens.length ? doDia : proximo;
  const ehHoje = mostrar?.dia === hoje;
  return (
    <>
      <FaixaRitmo d={d} compacta />
      <section className={s.cartao} aria-labelledby="hoje-crono">
        <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <h2 id="hoje-crono" className={s.h2}>
            {mostrar ? (ehHoje ? `Hoje · ${NOME_DIA[diaSem(hoje)]}, ${dataCurta(hoje)}` : `Próximo dia de estudo · ${NOME_DIA[diaSem(mostrar.dia)]}, ${dataCurta(mostrar.dia)}`) : 'Cronograma concluído'}
          </h2>
          <Link href="/aluno/cronograma/reta-final" style={{ fontWeight: 600 }}>Ver o cronograma completo →</Link>
        </div>
        {mostrar && ehHoje && <p className="suave" style={{ margin: 0, fontSize: 14 }}>{mostrar.itens.filter((i) => i.feito).length} de {mostrar.itens.length} feitos</p>}
        {mostrar && <Lista itens={mostrar.itens} temPdf={d.temPdf} podeMarcar />}
      </section>
    </>
  );
}
