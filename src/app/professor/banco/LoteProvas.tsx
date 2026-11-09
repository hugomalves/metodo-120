'use client';

import { useEffect, useState } from 'react';

const caixas = () => Array.from(document.querySelectorAll<HTMLInputElement>('input[name="provas"][form="lote"]'));

// Barra de ações em lote: conta as provas marcadas, marca/desmarca todas e publica ou oculta de uma vez
export function LoteProvas({ total }: { total: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const contar = () => setN(caixas().filter((c) => c.checked).length);
    document.addEventListener('change', contar);
    return () => document.removeEventListener('change', contar);
  }, []);
  const marcarTodas = (v: boolean) => { caixas().forEach((c) => { c.checked = v; }); setN(v ? caixas().length : 0); };

  return (
    <div className="linha-flex" style={{ gap: 10, padding: '10px 12px', background: 'var(--faixa)', border: '1px solid var(--linha)', borderRadius: 4 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, cursor: 'pointer' }}>
        <input type="checkbox" checked={n > 0 && n === total} onChange={(e) => marcarTodas(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--azul)' }} />
        Selecionar todas
      </label>
      <span className="suave" style={{ marginRight: 'auto' }}>{n ? `${n} ${n === 1 ? 'prova selecionada' : 'provas selecionadas'}` : 'Marque as provas na lista'}</span>
      <button form="lote" name="acao" value="publicar" className="btn btn-azul" disabled={!n}>Publicar selecionadas</button>
      <button form="lote" name="acao" value="ocultar" className="btn btn-linha" disabled={!n}>Ocultar selecionadas</button>
    </div>
  );
}
