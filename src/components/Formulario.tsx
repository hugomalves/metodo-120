'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';

export type Estado = { ok?: string; erro?: string; link?: string };

// Formulário genérico: envia para uma ação do servidor e mostra o resultado (e um link para copiar, se houver).
// Em caso de erro, o texto digitado continua no formulário.
export function Formulario({
  acao, botao, children, classeBotao = 'btn btn-azul', pendenteTexto = 'Enviando…', limparAoEnviar = false,
}: {
  acao: (anterior: Estado, f: FormData) => Promise<Estado>;
  botao: string;
  children: ReactNode;
  classeBotao?: string;
  pendenteTexto?: string;
  limparAoEnviar?: boolean;
}) {
  const [estado, setEstado] = useState<Estado>({});
  const [pendente, iniciar] = useTransition();
  const [copiado, setCopiado] = useState(false);

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    iniciar(async () => {
      setEstado({});
      const r = await acao({}, dados);
      setEstado(r ?? {});
      setCopiado(false);
      if (r?.ok && limparAoEnviar) form.reset();
    });
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
      <div className="linha-flex">
        <button className={classeBotao} disabled={pendente}>{pendente ? pendenteTexto : botao}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
      {estado.link && (
        <div className="linha-flex" style={{ gap: 8 }}>
          <input readOnly value={estado.link} aria-label="Link" className="mono" onFocus={(e) => e.currentTarget.select()}
            style={{ flex: '1 1 260px', minWidth: 0, minHeight: 44, padding: '0 12px', borderRadius: 4, border: '1.5px solid var(--linha-forte)', background: 'var(--faixa)', color: 'var(--texto)', fontSize: 13 }} />
          <button type="button" className="btn btn-linha" onClick={() => { navigator.clipboard?.writeText(estado.link!); setCopiado(true); }}>
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
          <a className="btn btn-linha" target="_blank" rel="noopener"
            href={`https://wa.me/?text=${encodeURIComponent(estado.link)}`}>
            Enviar pelo WhatsApp
          </a>
        </div>
      )}
    </form>
  );
}
