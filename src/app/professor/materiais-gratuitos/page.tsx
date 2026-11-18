import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { formatarCpf, formatarTelefone } from '@/lib/documentos';
import { alternarMaterialGratuito, excluirMaterialGratuito } from './acoes';
import { FormMaterial } from './FormMaterial';
import styles from '../professor.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Materiais grátis e leads · Painel do professor' };

type Mat = { id: string; titulo: string; publicado: boolean; ordem: number };
type Lead = { email: string; nome: string; cpf: string; telefone: string; origem: string; atualizado_em: string };

export default async function Pagina() {
  const supabase = await createClient();
  const [{ data: m }, { data: b }, { data: l }, { count }] = await Promise.all([
    supabase.from('materiais_gratuitos').select('id, titulo, publicado, ordem').order('ordem').order('criado_em', { ascending: false }),
    supabase.from('materiais_gratuitos_baixas').select('material_id'),
    supabase.from('dados_comprador').select('email, nome, cpf, telefone, origem, atualizado_em').order('atualizado_em', { ascending: false }).limit(300),
    supabase.from('dados_comprador').select('email', { count: 'exact', head: true }),
  ]);
  const baixas = new Map<string, number>();
  for (const x of (b ?? []) as { material_id: string }[]) baixas.set(x.material_id, (baixas.get(x.material_id) ?? 0) + 1);
  const leads = (l ?? []) as Lead[];
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Materiais grátis e leads' }]} />
      <h1 className={`display ${styles.titulo}`}>Materiais grátis e leads</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '70ch' }}>Os materiais aparecem na aba <b>Materiais grátis</b> do site. Para baixar, a pessoa cria conta (nome completo, CPF e telefone) e o PDF sai com esses dados na marca d&apos;água.</p>
      <section className={`cartao ${styles.bloco}`} aria-labelledby="novo"><h2 id="novo" className="display">Novo material</h2><FormMaterial /></section>
      <section className={`cartao ${styles.bloco}`}>
        <h2 className="display">Materiais publicados</h2>
        {(m ?? []).length === 0 && <p className="suave">Nenhum material ainda.</p>}
        {((m ?? []) as Mat[]).map((x) => (
          <div key={x.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--borda, #e5e7eb)' }}>
            <b style={{ flex: 1, minWidth: 220 }}>{x.titulo}</b>
            <span className="suave">{baixas.get(x.id) ?? 0} download(s)</span>
            <span className={`${styles.chip} ${x.publicado ? styles.chipOk : styles.chipNeutro}`}>{x.publicado ? 'Publicado' : 'Oculto'}</span>
            <form action={alternarMaterialGratuito}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="publicar" value={x.publicado ? 'nao' : 'sim'} /><button className="btn btn-linha">{x.publicado ? 'Ocultar' : 'Publicar'}</button></form>
            <form action={excluirMaterialGratuito}><input type="hidden" name="id" value={x.id} /><button className="btn btn-linha" style={{ color: 'var(--erro)' }}>Excluir</button></form>
          </div>
        ))}
      </section>
      <section className={`cartao ${styles.bloco}`}>
        <h2 className="display">Leads ({count ?? leads.length})</h2>
        <p><a className="btn btn-azul" href="/professor/materiais-gratuitos/csv">Baixar lista em planilha (CSV)</a></p>
        <div className={styles.tabelaCaixa}>
          <table className={styles.tabela}>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>CPF</th><th>Origem</th><th>Data</th></tr></thead>
            <tbody>{leads.slice(0, 100).map((x) => (
              <tr key={x.email}><td>{x.nome}</td><td>{x.email}</td><td>{formatarTelefone(x.telefone)}</td><td>{formatarCpf(x.cpf)}</td><td>{x.origem === 'kiwify' ? 'Compra' : 'Cadastro'}</td><td>{new Date(x.atualizado_em).toLocaleDateString('pt-BR')}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {leads.length > 100 && <p className="suave">Mostrando os 100 mais recentes; o CSV traz todos.</p>}
      </section>
    </>
  );
}
