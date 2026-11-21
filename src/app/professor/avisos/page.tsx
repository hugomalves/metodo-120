import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { alternarAviso, excluirAviso } from './acoes';
import { FormAviso } from './FormAviso';
import styles from '../professor.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Avisos do banco · Painel do professor' };

type Aviso = { id: string; titulo: string; texto: string | null; link_url: string | null; ordem: number; ativo: boolean };

export default async function Pagina() {
  const supabase = await createClient();
  const { data } = await supabase.from('avisos_banco').select('id, titulo, texto, link_url, ordem, ativo').order('ordem').order('criado_em', { ascending: false });
  const avisos = (data ?? []) as Aviso[];
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Avisos do banco' }]} />
      <h1 className={`display ${styles.titulo}`}>Avisos do banco de questões</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>Os avisos ativos aparecem no quadro azul da página <b>Home</b> do banco de questões do aluno, um de cada vez, com setas.</p>
      <section className={`cartao ${styles.bloco}`} aria-labelledby="novo"><h2 id="novo" className="display">Novo aviso</h2><FormAviso /></section>
      <section className={`cartao ${styles.bloco}`}>
        <h2 className="display">Avisos publicados</h2>
        {avisos.length === 0 && <p className="suave">Nenhum aviso. Os alunos veem uma mensagem de boas-vindas padrão.</p>}
        {avisos.map((a) => (
          <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--borda, #e5e7eb)' }}>
            <div style={{ flex: 1, minWidth: 220 }}><b>{a.titulo}</b>{a.texto && <div className="suave">{a.texto}</div>}{a.link_url && <div className="suave">→ {a.link_url}</div>}</div>
            <span className={`${styles.chip} ${a.ativo ? styles.chipOk : styles.chipNeutro}`}>{a.ativo ? 'No ar' : 'Oculto'}</span>
            <form action={alternarAviso}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="ativar" value={a.ativo ? 'nao' : 'sim'} /><button className="btn btn-linha">{a.ativo ? 'Ocultar' : 'Mostrar'}</button></form>
            <form action={excluirAviso}><input type="hidden" name="id" value={a.id} /><button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Excluir</button></form>
          </div>
        ))}
      </section>
    </>
  );
}
