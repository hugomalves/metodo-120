import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { AULAS_REDACAO, aulaRedacao } from '@/lib/redacaoAulas';
import { AbasRedacao } from '../../AbasRedacao';
import { semanasFeitas } from '../progresso';
import { VistaAula } from './VistaAula';
import s from '../../redacao.module.css';

export const metadata = { title: 'Aula de redação' };
export const dynamic = 'force-dynamic';

export default async function AulaPagina({ params }: { params: Promise<{ n: string }> }) {
  const aula = aulaRedacao(Number((await params).n));
  if (!aula) notFound();
  const { supabase, perfil } = await exigirCurso();
  const { data } = await supabase.from('redacoes').select('proposta').eq('aluno_id', perfil.id);
  const feita = semanasFeitas(((data ?? []) as { proposta: string | null }[]).map((r) => r.proposta)).has(aula.n);
  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Aulas', href: '/aluno/redacao/aulas' }, { rotulo: `Semana ${aula.n}` }]} />
      <AbasRedacao ativa="aulas" />
      <VistaAula aula={aula} feita={feita} />
      <nav className={s.navAulas} aria-label="Outras aulas">
        {aula.n > 1 ? <Link href={`/aluno/redacao/aulas/${aula.n - 1}`}>← Semana {aula.n - 1}</Link> : <span />}
        <Link href="/aluno/redacao/aulas">Todas as aulas</Link>
        {aula.n < AULAS_REDACAO.length ? <Link href={`/aluno/redacao/aulas/${aula.n + 1}`}>Semana {aula.n + 1} →</Link> : <span />}
      </nav>
    </div>
  );
}
