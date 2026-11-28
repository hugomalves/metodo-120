import Link from 'next/link';
import { exigirCurso } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { ORIGEM_ROTULO, PROPOSTAS, type Proposta } from '@/lib/redacao';
import { AbasRedacao } from '../AbasRedacao';
import s from '../redacao.module.css';

export const metadata = { title: 'Propostas de redação' };

const FILTROS: { id: 'todas' | Proposta['origem']; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'treino', rotulo: ORIGEM_ROTULO.treino },
  { id: 'curso', rotulo: ORIGEM_ROTULO.curso },
  { id: 'prova', rotulo: ORIGEM_ROTULO.prova },
];

export default async function Propostas({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  await exigirCurso();
  const o = (await searchParams).o;
  const ativo = FILTROS.some((f) => f.id === o) ? o : 'todas';
  const lista = ativo === 'todas' ? PROPOSTAS : PROPOSTAS.filter((p) => p.origem === ativo);
  return (
    <div className={s.pagina}>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Redação', href: '/aluno/redacao' }, { rotulo: 'Propostas' }]} />
      <AbasRedacao ativa="propostas" />
      <div className={s.cabeca}>
        <h1 className="display">Propostas de redação</h1>
        <p>Temas no formato da AOCP, cada um com um texto motivador. Leia, planeje e escreva de 15 a 20 linhas.</p>
      </div>
      <nav className={s.filtros} aria-label="Filtrar propostas">
        {FILTROS.map((f) => <Link key={f.id} href={f.id === 'todas' ? '/aluno/redacao/propostas' : `/aluno/redacao/propostas?o=${f.id}`} aria-current={f.id === ativo ? 'true' : undefined}>{f.rotulo}</Link>)}
      </nav>
      <div className={s.cartoes}>
        {lista.map((p) => (
          <Link key={p.slug} href={`/aluno/redacao/propostas/${p.slug}`} className={s.cartaoProp}>
            <span className={s.origem} data-o={p.origem}>{ORIGEM_ROTULO[p.origem]}</span>
            <b>{p.tema}</b>
            <span>{p.resumo}</span>
            <em>Ver proposta →</em>
          </Link>
        ))}
      </div>
    </div>
  );
}
