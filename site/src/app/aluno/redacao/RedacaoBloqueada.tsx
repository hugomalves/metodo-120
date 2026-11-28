import Link from 'next/link';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { CRITERIOS } from '@/lib/redacao';
import s from './redacao.module.css';

const OFERTA = [
  { t: 'Correção do professor', d: 'Nota de 0 a 40 nos 4 critérios da AOCP, com comentário em cada um.' },
  { t: 'Redação do Zero', d: '8 aulas, uma por semana, com modelos prontos para completar e exercícios.' },
  { t: '11 propostas no estilo da banca', d: 'Cada uma com texto motivador, incluindo o tema da prova de 2024.' },
  { t: 'Envie digitada ou em foto', d: 'Escreva no site, com contagem de linhas, ou fotografe a folha.' },
];

// Quem não tem o curso vê o que a Redação oferece e o caminho para o Reta Final
export function RedacaoBloqueada({ nome }: { nome: string }) {
  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação' }]} />
      <section className={s.hero} aria-labelledby="bl-t">
        <div className={s.heroTexto}>
          <span className={s.heroRotulo}>Redação PM PE · exclusivo do Reta Final</span>
          <h1 id="bl-t">{nome}, a redação pode eliminar você. Treine com correção</h1>
          <p>Abaixo de 12 pontos em 40, o candidato é eliminado. Com o Reta Final PM PE, você aprende do zero e envia redações para o professor corrigir no modelo da AOCP.</p>
          <div className={s.chips}><span>15 a 20 linhas</span><span>4 critérios × 10</span><span>Nota de 0 a 40</span><span>Mínimo 12</span></div>
          <div className={s.heroBotoes}>
            <Link href="/curso/reta-final-pmpe" className={s.btVerde}>Conhecer o Reta Final PM PE</Link>
          </div>
        </div>
        <div className={s.heroNumeros} style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          {OFERTA.map((o) => <div key={o.t} className={s.num}><span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{o.t}</span><span>{o.d}</span></div>)}
        </div>
      </section>
      <section className={s.secao} aria-labelledby="crit-b">
        <h2 id="crit-b">Como a AOCP corrige</h2>
        <div className={s.criterios}>
          {CRITERIOS.map((c) => <div key={c.n} className={s.criterio}><small>Critério {c.n} · 10 pontos</small><b>{c.nome}</b><span>{c.dica}</span></div>)}
        </div>
      </section>
    </div>
  );
}
