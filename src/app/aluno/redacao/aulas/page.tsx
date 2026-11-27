import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { AULAS_REDACAO, codigoPdfAula } from '@/lib/redacaoAulas';
import { AbasRedacao } from '../AbasRedacao';
import { semanasFeitas } from './progresso';
import s from '../redacao.module.css';

export const metadata = { title: 'Aulas de redação' };
export const dynamic = 'force-dynamic';

export default async function AulasRedacao() {
  const { supabase, perfil } = await exigirCurso();
  const { data } = await supabase.from('redacoes').select('proposta').eq('aluno_id', perfil.id);
  const feitas = semanasFeitas(((data ?? []) as { proposta: string | null }[]).map((r) => r.proposta));
  const proxima = AULAS_REDACAO.find((a) => !feitas.has(a.n)) ?? null;

  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Aulas' }]} />
      <AbasRedacao ativa="aulas" />
      <section className={s.aulasTopo}>
        <div>
          <span className={s.heroRotulo}>Redação do zero · PM PE</span>
          <h1 className="display">8 semanas para escrever uma redação segura</h1>
          <p>Para quem tem dificuldade e precisa treinar até a prova. Uma aula e uma redação por semana, com modelos prontos para completar e exercícios com resposta.</p>
        </div>
        <div className={s.progressoAulas} aria-label={`${feitas.size} de 8 semanas concluídas`}>
          <b>{feitas.size}<small>/8</small></b>
          <span>semanas com a redação enviada</span>
          <div className={s.trilho}><div className={s.enchido} style={{ width: `${(feitas.size / 8) * 100}%` }} /></div>
          {proxima && <Link href={`/aluno/redacao/aulas/${proxima.n}`} className={s.btVerde}>{feitas.size === 0 ? 'Começar a semana 1' : `Continuar: semana ${proxima.n}`}</Link>}
        </div>
      </section>
      <ol className={s.trilha}>
        {AULAS_REDACAO.map((a) => {
          const feita = feitas.has(a.n);
          return (
            <li key={a.n} className={s.etapa} data-feita={feita} data-atual={proxima?.n === a.n}>
              <span className={s.etapaNum} aria-hidden="true">{feita ? '✓' : a.n}</span>
              <div className={s.etapaCorpo}>
                <small>Semana {a.n} · {a.minutos} min{feita ? ' · redação enviada' : ''}</small>
                <Link href={`/aluno/redacao/aulas/${a.n}`}><b>{a.titulo}</b></Link>
                <span>{a.chamada}</span>
              </div>
              <div className={s.etapaBotoes}>
                <Link href={`/aluno/redacao/aulas/${a.n}`} className="btn btn-azul">Estudar</Link>
                <a href={`/api/curso-pdf/${codigoPdfAula(a.n)}`} target="_blank" rel="noopener" className="btn btn-linha">PDF</a>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
