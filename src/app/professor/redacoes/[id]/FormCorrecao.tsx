'use client';

import { useActionState, useState } from 'react';
import { CRITERIOS, MOTIVOS_ZERO } from '@/lib/redacao';
import { corrigirRedacao } from '../acoes';

type Inicial = { notas: (number | null)[]; comentarios: Record<string, string>; fortes: string; melhorar: string; zerada: boolean; motivo: string };

// Correção do professor: 4 critérios de 0 a 10 (total ao vivo) ou nota zero com o motivo
export function FormCorrecao({ id, inicial, ehArquivo }: { id: string; inicial: Inicial; ehArquivo: boolean }) {
  const [estado, enviar, pendente] = useActionState(corrigirRedacao, {});
  const [notas, setNotas] = useState(inicial.notas.map((n) => (n == null ? 6 : n)));
  const [zerada, setZerada] = useState(inicial.zerada);
  const total = zerada ? 0 : notas.reduce((a, b) => a + b, 0);
  // na folha escrita à mão, todos os motivos valem; no texto digitado, os de caneta e folha não fazem sentido
  const motivos = ehArquivo ? MOTIVOS_ZERO : MOTIVOS_ZERO.slice(0, 5);

  return (
    <form action={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input type="hidden" name="id" value={id} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <b style={{ fontSize: 15 }}>Nota final</b>
        <span className="display" style={{ fontSize: 34 }}>{total}<small className="suave" style={{ fontSize: 16 }}> / 40</small></span>
      </div>
      {total < 12 && <p className="suave" style={{ margin: 0, fontSize: 13.5 }}>Abaixo de 12: na prova, o candidato seria eliminado.</p>}

      <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600, padding: '10px 12px', border: '1px solid var(--linha-forte)', borderRadius: 4, background: zerada ? 'var(--erro-fundo)' : undefined }}>
        <input type="checkbox" name="zerada" checked={zerada} onChange={(e) => setZerada(e.target.checked)} />
        Atribuir nota zero (motivo do edital)
      </label>
      {zerada && (
        <div className="campo">
          <label htmlFor="mz">Motivo da nota zero</label>
          <select id="mz" name="motivo_zero" defaultValue={inicial.motivo && (motivos as readonly string[]).includes(inicial.motivo) ? inicial.motivo : motivos[0]}>
            {motivos.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {CRITERIOS.map((c, i) => (
        <fieldset key={c.n} disabled={zerada} style={{ border: '1px solid var(--linha)', borderRadius: 4, padding: '12px 14px', margin: 0, display: 'flex', flexDirection: 'column', gap: 8, opacity: zerada ? 0.55 : 1 }}>
          <legend style={{ fontWeight: 700, padding: '0 6px' }}>{c.n}. {c.nome}</legend>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min={0} max={10} step={1} name={`c${c.n}`} value={notas[i]} aria-label={`Nota do critério ${c.n}`}
              onChange={(e) => setNotas((x) => x.map((v, j) => (j === i ? Number(e.target.value) : v)))} style={{ flex: 1 }} />
            <b className="display" style={{ fontSize: 20, minWidth: 44, textAlign: 'right' }}>{notas[i]}</b>
          </div>
          <span className="suave" style={{ fontSize: 13 }}>{c.dica}</span>
          <textarea name={`com${c.n}`} rows={2} maxLength={1200} defaultValue={inicial.comentarios['c' + c.n] ?? ''} placeholder="Comentário para o aluno (opcional)" aria-label={`Comentário do critério ${c.n}`}
            style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid var(--linha-forte)', font: 'inherit', fontSize: 14.5, background: 'var(--fundo)', color: 'var(--texto)' }} />
        </fieldset>
      ))}

      <div className="campo"><label htmlFor="pf">Pontos fortes</label><textarea id="pf" name="pontos_fortes" rows={3} maxLength={2000} defaultValue={inicial.fortes} /></div>
      <div className="campo"><label htmlFor="pm">Para subir a nota</label><textarea id="pm" name="pontos_melhorar" rows={3} maxLength={2000} defaultValue={inicial.melhorar} /></div>
      <div className="linha-flex">
        <button className="btn btn-azul" disabled={pendente}>{pendente ? 'Enviando…' : 'Enviar correção ao aluno'}</button>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </form>
  );
}
