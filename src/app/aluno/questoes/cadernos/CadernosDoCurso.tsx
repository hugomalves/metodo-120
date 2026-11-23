import Link from 'next/link';
import { IconeCaderno, IconePasta } from '../Icones';
import b from '../banco.module.css';

type Modelo = { codigo: string; titulo: string; sigla: string; disciplina: string; aula: number; bloco: number | null; total: number };
const ORDEM = ['PT', 'DC', 'DH', 'IN', 'RL', 'HP'];
const sem = (t: string) => t.split(' · ').slice(1).join(' · ');

// Cadernos prontos do curso (por aula e por bloco de 15 min), agrupados por disciplina
export function CadernosDoCurso({ modelos, progresso }: { modelos: Modelo[]; progresso: Map<string, { feitas: number; total: number }> }) {
  if (!modelos.length) return null;
  const grupos = ORDEM.map((sig) => ({ sig, itens: modelos.filter((m) => m.sigla === sig) })).filter((g) => g.itens.length);
  return (
    <section className="cartao" aria-labelledby="cad-curso" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <h2 id="cad-curso" className="display" style={{ margin: 0, fontSize: 19 }}>Cadernos do Reta Final PM PE</h2>
        <p className="suave" style={{ margin: '4px 0 0', fontSize: 14 }}>Um caderno por aula e um por bloco de 15 minutos, os mesmos dos QR codes dos PDFs.</p>
      </div>
      {grupos.map((g) => {
        const aulas = Array.from(new Set(g.itens.map((m) => m.aula))).sort((x, y) => x - y);
        return (
          <details key={g.sig}>
            <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <IconePasta /> <b>{g.itens[0].disciplina}</b> <span className="suave" style={{ fontSize: 13 }}>{aulas.length} aulas</span>
            </summary>
            <div>
              {aulas.map((n) => {
                const inteira = g.itens.find((m) => m.aula === n && m.bloco === null);
                const blocos = g.itens.filter((m) => m.aula === n && m.bloco !== null).sort((x, y) => (x.bloco ?? 0) - (y.bloco ?? 0));
                const pr = inteira ? progresso.get(inteira.codigo) : undefined;
                return (
                  <div key={n} className={b.itemCaderno} style={{ alignItems: 'flex-start' }}>
                    <IconeCaderno />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {inteira
                        ? <Link href={`/lista/${inteira.codigo}`} style={{ color: 'var(--ciano-texto)', textDecoration: 'underline' }}>{`Aula ${String(n).padStart(2, '0')} · ${sem(inteira.titulo).replace(/^Aula \d+ · /, '')}`}</Link>
                        : <span>{`Aula ${String(n).padStart(2, '0')}`}</span>}
                      <span className={b.progresso}>
                        {inteira ? `${inteira.total} questões${pr ? ` · ${pr.feitas} feitas` : ''}` : ''}
                      </span>
                      {blocos.length > 0 && (
                        <span className={b.acoesMini}>
                          {blocos.map((m) => {
                            const p = progresso.get(m.codigo);
                            return <Link key={m.codigo} href={`/lista/${m.codigo}`} title={sem(m.titulo)}>Bloco {m.bloco} ({p ? `${p.feitas}/${m.total}` : m.total})</Link>;
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </section>
  );
}
