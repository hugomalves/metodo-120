'use client';

import { useActionState } from 'react';
import { CRITERIOS, PROPOSTAS } from '@/lib/redacao';
import { testarIA, type ResTeste } from '../acoes';

// O professor cola uma redação e vê a nota que a IA daria (nada é salvo)
export function TesteIA() {
  const [estado, enviar, pendente] = useActionState<ResTeste, FormData>(testarIA, {});
  const r = estado.resultado;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <form action={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="campo">
          <label htmlFor="tt">Tema</label>
          <input id="tt" name="tema" maxLength={200} required list="temas-teste" />
          <datalist id="temas-teste">{PROPOSTAS.map((p) => <option key={p.slug} value={p.tema} />)}</datalist>
        </div>
        <div className="campo"><label htmlFor="tx">Redação</label><textarea id="tx" name="texto" rows={14} required maxLength={6000} /></div>
        <div className="linha-flex">
          <button className="btn btn-azul" disabled={pendente}>{pendente ? 'A IA está corrigindo… (até 1 min)' : 'Ver a nota da IA'}</button>
          {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        </div>
      </form>
      {r && (
        <div className="cartao" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <b className="display" style={{ fontSize: 30 }}>{r.nota}<small className="suave" style={{ fontSize: 16 }}> / 40</small></b>
            <span className="suave" style={{ fontSize: 13 }}>modelo {r.modelo} · {r.segundos} s</span>
          </div>
          {r.zerar && <p className="erro" style={{ margin: 0 }}>A IA zeraria: {r.motivo_zero}</p>}
          {r.alerta && <p style={{ margin: 0 }}><b>Alerta:</b> {r.alerta}</p>}
          {CRITERIOS.map((c) => (
            <div key={c.n} style={{ borderTop: '1px solid var(--linha)', paddingTop: 10 }}>
              <b>{c.n}. {c.nome}: {r[`c${c.n}` as 'c1']}/10</b>
              <p style={{ margin: '4px 0 0' }}>{r.comentarios[`c${c.n}` as 'c1']}</p>
            </div>
          ))}
          {r.pontos_fortes && <p style={{ margin: 0 }}><b>Pontos fortes:</b> {r.pontos_fortes}</p>}
          {r.pontos_melhorar && <p style={{ margin: 0 }}><b>Para subir a nota:</b> {r.pontos_melhorar}</p>}
        </div>
      )}
    </div>
  );
}
