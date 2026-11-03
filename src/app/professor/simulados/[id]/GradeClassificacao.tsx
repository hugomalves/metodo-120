'use client';

import { useState, useTransition, type Dispatch, type SetStateAction } from 'react';
import { salvarClassificacao, type Resultado } from '../../actions';
import styles from '../../professor.module.css';

const HABS = Array.from({ length: 30 }, (_, i) => `H${i + 1}`);
const ajustar = (l: string[], n: number) => Array.from({ length: n }, (_, i) => l[i] ?? '');

export function GradeClassificacao({
  simuladoId, gabarito, habilidades, assuntos, niveis, comentarios, sugestoes,
}: {
  simuladoId: string; gabarito: string; habilidades: string[]; assuntos: string[]; niveis: string[]; comentarios: string[]; sugestoes: string[];
}) {
  const n = gabarito.length;
  const [hab, setHab] = useState(() => ajustar(habilidades, n));
  const [ass, setAss] = useState(() => ajustar(assuntos, n));
  const [niv, setNiv] = useState(() => ajustar(niveis, n));
  const [com, setCom] = useState(() => ajustar(comentarios, n));
  const [estado, setEstado] = useState<Resultado>({});
  const [pendente, iniciar] = useTransition();

  const muda = (set: Dispatch<SetStateAction<string[]>>, i: number, v: string) =>
    set((l: string[]) => l.map((x, k) => (k === i ? v : x)));

  function salvar() {
    const f = new FormData();
    f.set('simulado_id', simuladoId);
    f.set('n', String(n));
    f.set('habilidades', JSON.stringify(hab));
    f.set('assuntos', JSON.stringify(ass));
    f.set('niveis', JSON.stringify(niv));
    f.set('comentarios', JSON.stringify(com));
    iniciar(async () => { setEstado({}); setEstado(await salvarClassificacao({}, f)); });
  }

  const feitas = ass.filter(Boolean).length;
  const campo = { minHeight: 40, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--linha-forte)', background: 'var(--faixa)', color: 'var(--texto)', font: 'inherit', width: '100%' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <datalist id="lista-assuntos">{sugestoes.map((a) => <option key={a} value={a} />)}</datalist>
      <div className={styles.tabelaCaixa}>
        <table className={styles.tabela} style={{ minWidth: 860 }}>
          <thead><tr><th>Q</th><th>Certa</th><th>Habilidade</th><th>Assunto</th><th>Nível</th><th>Comentário (o aluno vê depois de enviar)</th></tr></thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i}>
                <td className="mono">{i + 1}</td>
                <td className="mono" style={{ fontWeight: 700 }}>{gabarito[i]}</td>
                <td style={{ width: 110 }}>
                  <select aria-label={`Habilidade da questão ${i + 1}`} value={hab[i]} onChange={(e) => muda(setHab, i, e.target.value)} style={campo}>
                    <option value="">–</option>
                    {HABS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </td>
                <td style={{ minWidth: 220 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input aria-label={`Assunto da questão ${i + 1}`} list="lista-assuntos" value={ass[i]} maxLength={80} onChange={(e) => muda(setAss, i, e.target.value)} style={campo} />
                    {i > 0 && !ass[i] && ass[i - 1] && (
                      <button type="button" className={`btn btn-linha ${styles.mini}`} title="Repetir o assunto da questão de cima" aria-label={`Repetir o assunto da questão ${i}`}
                        onClick={() => { muda(setAss, i, ass[i - 1]); if (!hab[i]) muda(setHab, i, hab[i - 1]); }}>↓</button>
                    )}
                  </div>
                </td>
                <td style={{ width: 120 }}>
                  <select aria-label={`Nível da questão ${i + 1}`} value={niv[i]} onChange={(e) => muda(setNiv, i, e.target.value)} style={campo}>
                    <option value="">–</option>
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </td>
                <td style={{ minWidth: 260 }}>
                  <textarea aria-label={`Comentário da questão ${i + 1}`} value={com[i]} rows={1} maxLength={3000} onChange={(e) => muda(setCom, i, e.target.value)}
                    style={{ ...campo, paddingBlock: 8, resize: 'vertical' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="linha-flex" style={{ position: 'sticky', bottom: 0, background: 'var(--cartao)', paddingBlock: 10 }}>
        <button className="btn btn-azul" onClick={salvar} disabled={pendente}>{pendente ? 'Salvando…' : 'Salvar classificação'}</button>
        <span className="suave" style={{ fontSize: 14 }}>{feitas} de {n} questões com assunto</span>
        {estado.erro && <span role="alert" className="erro">{estado.erro}</span>}
        {estado.ok && <span role="status" className="ok">{estado.ok}</span>}
      </div>
    </div>
  );
}
