import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { liberarAcesso } from '../actions';
import { FormAcao } from '../FormAcao';
import styles from '../professor.module.css';

export const metadata = { title: 'Alunos · Painel do professor' };

type Aluno = {
  id: string; nome: string; email: string; trilha: 'gabaritar' | 'ir_bem' | null; turma: string | null;
  edital: string | null; acesso_ativo: boolean; aulas_concluidas: number; questoes: number; ultimo_dia: string | null;
};

const FILTROS = [
  { id: '', rotulo: 'Todos' },
  { id: 'parados', rotulo: 'Sem estudar há 7+ dias' },
  { id: 'sem-acesso', rotulo: 'Sem acesso ativo' },
];

function diasDesde(dia: string | null): number | null {
  if (!dia) return null;
  return Math.floor((Date.now() - new Date(dia + 'T12:00:00').getTime()) / 86400000);
}

export default async function Alunos({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const { f = '', q = '' } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: produtos }, { data: turmas }] = await Promise.all([
    supabase.rpc('professor_listar_alunos'),
    supabase.from('produtos').select('id, nome').order('criado_em'),
    supabase.from('turmas').select('id, nome').order('inicio', { ascending: false }),
  ]);
  const todos = (data as Aluno[] | null) ?? [];
  const busca = q.trim().toLowerCase();

  const lista = todos.filter((a) => {
    const d = diasDesde(a.ultimo_dia);
    if (f === 'parados' && !(a.acesso_ativo && (d === null || d >= 7))) return false;
    if (f === 'sem-acesso' && a.acesso_ativo) return false;
    if (busca && !`${a.nome} ${a.email}`.toLowerCase().includes(busca)) return false;
    return true;
  });

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Alunos' }]} />
      <h1 className={`display ${styles.titulo}`}>Alunos</h1>

      <section aria-labelledby="liberar" className={`cartao ${styles.bloco}`}>
        <h2 id="liberar" className="display">Liberar acesso manualmente</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          Para quem comprou fora da Kiwify ou para cortesias. A pessoa precisa ter criado a conta no site.
        </p>
        <FormAcao acao={liberarAcesso} botao="Liberar acesso">
          <div className={styles.campos}>
            <div className="campo"><label htmlFor="lemail">E-mail da conta</label><input id="lemail" name="email" type="email" required placeholder="aluno@exemplo.com" /></div>
            <div className="campo">
              <label htmlFor="lprod">Produto</label>
              <select id="lprod" name="produto_id" required>
                {((produtos ?? []) as { id: string; nome: string }[]).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="ltur">Turma</label>
              <select id="ltur" name="turma_id" defaultValue="">
                <option value="">Sem turma</option>
                {((turmas ?? []) as { id: string; nome: string }[]).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>
        </FormAcao>
      </section>

      <section aria-labelledby="lista" className={`cartao ${styles.bloco}`}>
        <h2 id="lista" className="display">Lista de alunos</h2>
        <form method="get" className="linha-flex">
          <input type="hidden" name="f" value={f} />
          <label htmlFor="q" className="suave" style={{ fontSize: 14 }}>Buscar</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Nome ou e-mail" style={{ flex: '1 1 220px', minWidth: 0, minHeight: 40, padding: '0 14px', borderRadius: 4, border: '1.5px solid var(--linha-forte)', background: 'var(--faixa)', color: 'var(--texto)', font: 'inherit' }} />
          <button className={`btn btn-linha ${styles.mini}`}>Buscar</button>
        </form>
        <div className={styles.filtros}>
          {FILTROS.map((x) => (
            <Link key={x.id} href={`/professor/alunos${x.id ? `?f=${x.id}` : ''}`} className={`${styles.filtro} ${f === x.id ? styles.filtroAtivo : ''}`}>
              {x.rotulo}
            </Link>
          ))}
        </div>
        <div className={styles.tabelaCaixa}>
          <table className={styles.tabela}>
            <thead><tr><th>Aluno</th><th>Edital</th><th>Turma</th><th>Aulas</th><th>Questões</th><th>Último estudo</th><th>Acesso</th></tr></thead>
            <tbody>
              {lista.map((a) => {
                const d = diasDesde(a.ultimo_dia);
                const parado = a.acesso_ativo && (d === null || d >= 7);
                return (
                  <tr key={a.id}>
                    <td><div style={{ fontWeight: 600 }}>{a.nome || '(sem nome)'}</div><div className="suave" style={{ fontSize: 13 }}>{a.email}</div></td>
                    <td>{a.edital ?? '–'}</td>
                    <td>{a.turma ?? '–'}</td>
                    <td>{a.aulas_concluidas}</td>
                    <td>{a.questoes}</td>
                    <td style={{ color: parado ? 'var(--erro)' : undefined, fontWeight: parado ? 700 : 400 }}>
                      {d === null ? 'Nunca' : d === 0 ? 'Hoje' : d === 1 ? 'Ontem' : `Há ${d} dias`}
                    </td>
                    <td><span className={`${styles.chip} ${a.acesso_ativo ? styles.chipOk : styles.chipNeutro}`}>{a.acesso_ativo ? 'Ativo' : 'Sem acesso'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <span className="suave" style={{ fontSize: 14 }}>Mostrando {lista.length} de {todos.length} alunos.</span>
      </section>
    </>
  );
}
