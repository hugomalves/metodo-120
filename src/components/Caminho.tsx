import Link from 'next/link';

export type Passo = { rotulo: string; href?: string };

// Caminho de navegação ("Meu painel › Trilha › Módulo 1 › Aula 3"): cada passo anterior é clicável
export function Caminho({ passos }: { passos: Passo[] }) {
  return (
    <nav aria-label="Você está em" className="caminho">
      <ol>
        {passos.map((p, i) => {
          const ultimo = i === passos.length - 1;
          return (
            <li key={`${i}-${p.rotulo}`}>
              {p.href && !ultimo ? <Link href={p.href}>{p.rotulo}</Link> : <span aria-current={ultimo ? 'page' : undefined}>{p.rotulo}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const PAINEL_ALUNO: Passo = { rotulo: 'Meu painel', href: '/aluno' };
export const PAINEL_PROFESSOR: Passo = { rotulo: 'Painel', href: '/professor' };
