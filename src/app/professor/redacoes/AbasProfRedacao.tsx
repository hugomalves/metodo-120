import Link from 'next/link';
import s from '@/app/aluno/redacao/redacao.module.css';

const ABAS = [
  { id: 'fila', rotulo: 'Para corrigir', href: '/professor/redacoes' },
  { id: 'modelos', rotulo: 'Redações-modelo', href: '/professor/redacoes/modelos' },
  { id: 'testar', rotulo: 'Testar a IA', href: '/professor/redacoes/testar' },
] as const;

export function AbasProfRedacao({ ativa }: { ativa: (typeof ABAS)[number]['id'] }) {
  return (
    <nav className={s.abas} aria-label="Redações">
      {ABAS.map((a) => <Link key={a.id} href={a.href} className={s.aba} aria-current={a.id === ativa ? 'page' : undefined}>{a.rotulo}</Link>)}
    </nav>
  );
}
