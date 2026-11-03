'use client';

import { useActionState, type ReactNode } from 'react';
import type { Resultado } from './actions';

// Formulário genérico do painel: envia para uma ação do servidor e mostra o resultado
export function FormAcao({
  acao,
  botao,
  children,
  className,
}: {
  acao: (anterior: Resultado, f: FormData) => Promise<Resultado>;
  botao: string;
  children: ReactNode;
  className?: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, {});
  return (
    <form action={enviar} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {children}
      <div className="linha-flex">
        <button className="btn btn-azul" disabled={pendente}>{pendente ? 'Salvando…' : botao}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
