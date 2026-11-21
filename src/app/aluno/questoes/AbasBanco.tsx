import Link from 'next/link';
import s from './banco.module.css';

const ABAS = [
  { id: 'home', rotulo: 'Home', href: '/aluno/questoes' },
  { id: 'filtrar', rotulo: 'Filtrar questões', href: '/aluno/questoes/filtrar' },
  { id: 'cadernos', rotulo: 'Meus cadernos', href: '/aluno/questoes/cadernos' },
  { id: 'erros', rotulo: 'Cadernos de erros', href: '/aluno/questoes/erros' },
  { id: 'pdf', rotulo: 'Imprimir lista em PDF', href: '/aluno/questoes/listas' },
] as const;

export type AbaBanco = (typeof ABAS)[number]['id'];

// Abas horizontais do banco de questões
export function AbasBanco({ ativa }: { ativa?: AbaBanco }) {
  return (
    <nav className={s.abas} aria-label="Banco de questões">
      {ABAS.map((a) => (
        <Link key={a.id} href={a.href} className={s.aba} aria-current={a.id === ativa ? 'page' : undefined}>{a.rotulo}</Link>
      ))}
    </nav>
  );
}
