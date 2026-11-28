import type { ReactNode } from 'react';
import s from './oferta.module.css';

// Números da oferta do Reta Final PM PE (apostila de 30 dias)
export const RETA_FINAL = { paginas: 366, dias: 30, questoes: 500 };
const porDia = Math.round(RETA_FINAL.paginas / RETA_FINAL.dias);          // ≈ 12 páginas
const questoesDia = Math.round(RETA_FINAL.questoes / RETA_FINAL.dias);     // ≈ 17 questões
const ESCUDO = '/img/reta-final/escudo-pmpe-p.webp';

const FASES = [
  { nome: 'Semana 1', dias: [1, 2, 3, 4, 5, 6, 7] },
  { nome: 'Semana 2', dias: [8, 9, 10, 11, 12, 13, 14] },
  { nome: 'Semana 3', dias: [15, 16, 17, 18, 19, 20, 21] },
  { nome: 'Semana 4', dias: [22, 23, 24, 25, 26, 27, 28] },
  { nome: 'Reta final', dias: [29, 30] },
];

const RECEBE = [
  ['Apostila de 366 páginas', 'todo o conteúdo do edital de Soldado, em PDF com o seu nome'],
  ['500 questões no estilo AOCP', 'divididas ao longo do mês, sobre o que você acabou de ler'],
  ['Cronograma de 30 dias', 'cerca de 12 páginas por dia, começando no dia que você escolher'],
  ['Simulados e minissimulados', 'no formato da prova, para treinar o tempo e a pressão'],
  ['Redação com correção', 'nota nos 4 critérios da AOCP e 8 aulas de Redação do Zero'],
];

// Capa da apostila (arte do curso) num livro inclinado, com a borda das páginas
function Apostila() {
  return (
    <div className={s.livroCena}>
      <div className={s.livro}>
        <img src="/img/reta-final/capa-apostila.webp" alt="Capa da apostila PM PE: 366 páginas" width={720} height={788} className={s.capaImg} />
      </div>
    </div>
  );
}

// Seção de venda do Reta Final, com a identidade da PM PE
export function OfertaRetaFinal({ preco, cta }: { preco: string | null; cta: ReactNode }) {
  return (
    <>
      <section className={s.jogada} aria-labelledby="jogada-t">
        <div className={s.jogadaTexto}>
          <span className={s.selo}><img src={ESCUDO} alt="" width={22} height={26} />Soldado PM PE · Edital 2026 · Banca AOCP</span>
          <h2 id="jogada-t" className="display">Uma apostila. <em>{RETA_FINAL.dias} dias.</em> Todo o edital de Soldado da PM PE.</h2>
          <p>Em vez de juntar dezenas de materiais, você estuda por <b>uma apostila só</b>, feita para o edital de Soldado e para o jeito da AOCP cobrar. São {RETA_FINAL.paginas} páginas divididas em {RETA_FINAL.dias} dias: <b>cerca de {porDia} páginas por dia</b>.</p>
          <ul className={s.numeros}>
            <li><b>{RETA_FINAL.paginas}</b><span>páginas de apostila</span></li>
            <li><b>{RETA_FINAL.dias}</b><span>dias para fechar o edital</span></li>
            <li><b>~{porDia}</b><span>páginas por dia</span></li>
            <li><b>{RETA_FINAL.questoes}</b><span>questões estilo AOCP</span></li>
          </ul>
          <div className={s.compra}>
            {preco && <span className={s.pilula}><small>Por apenas</small>{preco}</span>}
            {cta}
          </div>
        </div>
        <Apostila />
        <span className={s.arcoFaixa} aria-hidden="true" />
      </section>

      <section className={s.recebe} aria-labelledby="recebe-t">
        <h2 id="recebe-t" className="display">Olha o que você vai receber</h2>
        <ul>{RECEBE.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ul>
      </section>

      <section className={s.mes} aria-labelledby="mes-t">
        <div className={s.mesTopo}>
          <img src={ESCUDO} alt="" width={54} height={63} />
          <div>
            <h2 id="mes-t" className="display">{RETA_FINAL.dias} dias até a prova, dia a dia</h2>
            <p>Cada dia tem a sua parte da apostila e as questões dela. O cronograma começa no dia em que você começar e mostra quanto do edital você já fechou.</p>
          </div>
        </div>
        <div className={s.fases}>
          {FASES.map((f) => (
            <div key={f.nome} className={s.fase}>
              <b>{f.nome}</b>
              <ol>
                {f.dias.map((d) => {
                  const pct = Math.round((d / RETA_FINAL.dias) * 100);
                  return (
                    <li key={d} data-fim={d === RETA_FINAL.dias} aria-label={`Dia ${d}: ${pct}% do edital`}>
                      <span>Dia {d}</span>
                      <em>{d === RETA_FINAL.dias ? 'Edital fechado' : `${pct}% do edital`}</em>
                      <i style={{ width: `${pct}%` }} aria-hidden="true" />
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className={s.dia} aria-labelledby="dia-t">
        <div className={s.diaFoto} aria-hidden="true" />
        <div className={s.diaTexto}>
          <h2 id="dia-t" className="display">Como é o seu dia de estudo</h2>
          <ol className={s.passos}>
            <li><b>Leia as páginas do dia</b><span>Cerca de {porDia} páginas da apostila, com caneta na mão, sublinhando o que a banca mais cobra.</span></li>
            <li><b>Resolva as questões do dia</b><span>Cerca de {questoesDia} questões sobre o que você acabou de ler, no estilo da AOCP.</span></li>
            <li><b>Marque e siga em frente</b><span>O cronograma registra o seu avanço. Perdeu um dia? Ele reorganiza o que falta até a prova.</span></li>
          </ol>
        </div>
      </section>
    </>
  );
}
