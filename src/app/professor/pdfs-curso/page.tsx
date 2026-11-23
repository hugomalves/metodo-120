import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { EnviarPdfs } from './EnviarPdfs';
import styles from '../professor.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'PDFs do curso · Painel do professor' };

export default async function Pagina() {
  const supabase = await createClient();
  const [{ data: its }, { data: pdfs }] = await Promise.all([
    supabase.from('plano_curso_itens').select('pdf, aula, sigla').eq('produto_slug', 'reta-final-pmpe'),
    supabase.from('pdfs_curso').select('codigo').eq('produto_slug', 'reta-final-pmpe'),
  ]);
  const enviados = new Set(((pdfs ?? []) as { codigo: string }[]).map((p) => p.codigo));
  const itens = (its ?? []) as { pdf: string | null; aula: string | null; sigla: string }[];
  const precisa = new Set<string>();
  itens.forEach((i) => { if (i.pdf) precisa.add(i.pdf); if (i.aula && i.pdf) precisa.add(i.aula); });
  const faltam = Array.from(precisa).filter((c) => !enviados.has(c)).sort();
  const porDisc = new Map<string, { tem: number; total: number }>();
  precisa.forEach((c) => { const k = c.slice(0, 2); const x = porDisc.get(k) ?? { tem: 0, total: 0 }; x.total++; if (enviados.has(c)) x.tem++; porDisc.set(k, x); });
  const NOME: Record<string, string> = { PT: 'Português', DC: 'Dir. Constitucional', DH: 'DH e Legislação', IN: 'Informática', RL: 'Raciocínio Lógico', HP: 'História de PE', RD: 'Redação' };

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'PDFs do curso' }]} />
      <h1 className={`display ${styles.titulo}`}>PDFs da Reta Final PM PE</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        Envie aqui os PDFs das aulas (completas e blocos de 15 min). Eles ficam guardados em pasta protegida e aparecem no plano de estudos do aluno,
        com a marca d&apos;água dele (nome, CPF e telefone). Enviar de novo um PDF com o mesmo nome substitui o anterior.
      </p>
      <section className={`cartao ${styles.bloco}`}>
        <h2 className="display">Enviar PDFs</h2>
        <EnviarPdfs />
      </section>
      <section className={`cartao ${styles.bloco}`}>
        <h2 className="display">O que já está no site</h2>
        <p style={{ margin: 0 }}><b>{precisa.size - faltam.length}</b> de <b>{precisa.size}</b> PDFs do plano enviados.</p>
        <ul style={{ margin: 0 }}>
          {Array.from(porDisc.entries()).map(([k, v]) => <li key={k}>{NOME[k] ?? k}: {v.tem} de {v.total}</li>)}
        </ul>
        {faltam.length > 0 && (
          <details><summary>Ver os que faltam ({faltam.length})</summary><p className="suave" style={{ fontSize: 13 }}>{faltam.join(', ')}</p></details>
        )}
      </section>
    </>
  );
}
