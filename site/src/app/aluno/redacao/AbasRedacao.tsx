import Link from 'next/link';
import s from './redacao.module.css';

const ABAS = [
  { id: 'home', rotulo: 'Home', href: '/aluno/redacao' },
  { id: 'aulas', rotulo: 'Aulas', href: '/aluno/redacao/aulas' },
  { id: 'nova', rotulo: 'Nova redação', href: '/aluno/redacao/nova' },
  { id: 'minhas', rotulo: 'Minhas correções', href: '/aluno/redacao/minhas' },
  { id: 'propostas', rotulo: 'Propostas', href: '/aluno/redacao/propostas' },
  { id: 'modelos', rotulo: 'Redações-modelo', href: '/aluno/redacao/modelos' },
] as const;
export type AbaRedacao = (typeof ABAS)[number]['id'];

// Abas horizontais da redação
export function AbasRedacao({ ativa }: { ativa?: AbaRedacao }) {
  return (
    <nav className={s.abas} aria-label="Redação">
      {ABAS.map((a) => (
        <Link key={a.id} href={a.href} className={s.aba} aria-current={a.id === ativa ? 'page' : undefined}>{a.rotulo}</Link>
      ))}
    </nav>
  );
}
