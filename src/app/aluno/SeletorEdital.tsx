'use client';

import { useRef, useTransition } from 'react';

// Escolher o edital que o aluno segue: ao escolher na lista, já troca (sem botão que parece não fazer nada).
export function SeletorEdital({ editais, atual, acao, comNenhum = true, classe, estilo }: {
  editais: { id: string; nome: string }[]; atual: string; acao: (f: FormData) => Promise<void>;
  comNenhum?: boolean; classe?: string; estilo?: React.CSSProperties;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [pendente, inicia] = useTransition();
  return (
    <form ref={form} className={classe} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
      action={(f) => inicia(async () => { await acao(f); })}>
      <label htmlFor="sed-troca" className="sr-only">Escolher o edital</label>
      <select id="sed-troca" name="edital" defaultValue={atual} disabled={pendente} onChange={() => form.current?.requestSubmit()} style={estilo}>
        {comNenhum && <option value="">Nenhum (ver todas as questões)</option>}
        {editais.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
      </select>
      <span aria-live="polite" style={{ fontSize: 13.5, color: 'var(--suave)' }}>
        {pendente ? 'Trocando…' : editais.length <= 1 ? 'Mais editais em breve.' : 'Escolha na lista para trocar.'}
      </span>
    </form>
  );
}
