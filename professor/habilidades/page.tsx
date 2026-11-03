import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { COMPETENCIAS, HABILIDADES } from '@/lib/habilidades';
import styles from '../professor.module.css';

export const metadata = { title: 'Habilidades e listas · Painel do professor' };

export default async function HabilidadesProfessor() {
  const supabase = await createClient();
  const [{ data: mats, error }, { data: questoes }] = await Promise.all([
    supabase.from('materiais_habilidade').select('habilidade, tipo, publicada'),
    supabase.from('questoes').select('habilidade'),
  ]);
  const lista = (mats ?? []) as { habilidade: string; tipo: string; publicada: boolean }[];
  const conta = (h: string, t: string) => lista.filter((m) => m.habilidade === h && m.tipo === t).length;
  const nq = (h: string) => ((questoes ?? []) as { habilidade: string | null }[]).filter((q) => q.habilidade === h).length;

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Habilidades e listas' }]} />
      <h1 className={`display ${styles.titulo}`}>Habilidades e listas</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        Cada habilidade tem um espaço próprio na área do aluno, com aulas da habilidade, listas de exercícios e questões do banco. Escolha uma para adicionar materiais.
      </p>
      {error && <p className="erro" style={{ margin: 0 }}>Rode a atualização do banco (0005) no Supabase para usar esta página.</p>}

      {COMPETENCIAS.map((c) => (
        <section key={c.numero} className={`cartao ${styles.bloco}`} aria-labelledby={`pc${c.numero}`}>
          <h2 id={`pc${c.numero}`} className="display">C{c.numero} · {c.nome}</h2>
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Habilidade</th><th>Aulas</th><th>Listas</th><th>Questões</th><th></th></tr></thead>
              <tbody>
                {c.habilidades.map((h) => (
                  <tr key={h}>
                    <td>
                      <strong className="mono">{h}</strong>
                      <div className="suave" style={{ fontSize: 13, maxWidth: 460 }}>{HABILIDADES[h]}</div>
                    </td>
                    <td>{conta(h, 'aula')}</td>
                    <td>{conta(h, 'lista')}</td>
                    <td>{nq(h)}</td>
                    <td><Link href={`/professor/habilidades/${h}`} className={`btn btn-linha ${styles.mini}`}>Gerenciar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
