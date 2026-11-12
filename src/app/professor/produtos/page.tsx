import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { salvarProdutoLoja } from '../actions';
import { FormAcao } from '../FormAcao';
import { CampoImagemProduto } from './CampoImagemProduto';
import { urlImagemProduto } from '@/lib/loja';
import styles from '../professor.module.css';

export const metadata = { title: 'Produtos e loja · Painel do professor' };

type P = {
  id: string; slug: string; nome: string; tipo: string; descricao: string | null; preco: string | null; beneficios: string[]; edital_id: string | null;
  destaque: boolean; selo: string | null; ordem: number; checkout_url: string | null; kiwify_product_id: string | null; venda_aberta: boolean; acesso_ate: string | null; imagem_path: string | null;
};
const TIPOS: Record<string, string> = { curso: 'Curso em PDF (libera as aulas, os minissimulados e os simulados do edital)', simulados: 'Pacote de simulados', mentoria: 'Mentoria individual', banco: 'Banco de questões completo' };

function Form({ p, editais }: { p?: P; editais: { id: string; nome: string }[] }) {
  const id = p?.id ?? 'novo';
  return (
    <FormAcao key={p ? JSON.stringify(p) : 'novo'} acao={salvarProdutoLoja} botao={p ? 'Salvar' : 'Criar produto'}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className={styles.campos}>
        <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor={`pn-${id}`}>Nome</label><input id={`pn-${id}`} name="nome" required defaultValue={p?.nome} placeholder="Reta Final PM PE 2026" /></div>
        <div className="campo">
          <label htmlFor={`pt-${id}`}>Tipo</label>
          <select id={`pt-${id}`} name="tipo" defaultValue={p?.tipo ?? 'curso'}>{Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        <div className="campo">
          <label htmlFor={`pe-${id}`}>Edital</label>
          <select id={`pe-${id}`} name="edital_id" defaultValue={p?.edital_id ?? ''}><option value="">Nenhum (vale para todos)</option>{editais.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
        </div>
        <div className="campo"><label htmlFor={`pp-${id}`}>Preço (como aparece)</label><input id={`pp-${id}`} name="preco" defaultValue={p?.preco ?? ''} placeholder="R$ 197 ou 12x de R$ 19,70" /></div>
        <div className="campo"><label htmlFor={`ps-${id}`}>Selo (opcional)</label><input id={`ps-${id}`} name="selo" maxLength={30} defaultValue={p?.selo ?? ''} placeholder="Reta final" /></div>
        <div className="campo"><label htmlFor={`po-${id}`}>Ordem</label><input id={`po-${id}`} name="ordem" type="number" min={0} max={99} defaultValue={p?.ordem ?? 1} /></div>
        <div className="campo"><label htmlFor={`pa-${id}`}>Acesso até (vazio = sem prazo)</label><input id={`pa-${id}`} name="acesso_ate" type="date" defaultValue={p?.acesso_ate ?? ''} /></div>
      </div>
      <CampoImagemProduto id={id} url={urlImagemProduto(p?.imagem_path)} temImagem={Boolean(p?.imagem_path)} />
      <div className="campo"><label htmlFor={`pd-${id}`}>Descrição curta (até 600 caracteres)</label><textarea id={`pd-${id}`} name="descricao" rows={2} maxLength={600} defaultValue={p?.descricao ?? ''} /></div>
      <div className="campo"><label htmlFor={`pb-${id}`}>O que está incluído (um item por linha)</label><textarea id={`pb-${id}`} name="beneficios" rows={4} defaultValue={(p?.beneficios ?? []).join('\n')} placeholder={'Aulas em PDF de todas as disciplinas\nMinissimulado por aula com gabarito comentado\n4 simulados completos no padrão AOCP'} /></div>
      <div className={styles.campos}>
        <div className="campo" style={{ gridColumn: 'span 2' }}><label htmlFor={`pc-${id}`}>Link de compra (checkout da Kiwify)</label><input id={`pc-${id}`} name="checkout_url" type="url" defaultValue={p?.checkout_url ?? ''} placeholder="https://pay.kiwify.com.br/..." /></div>
        <div className="campo"><label htmlFor={`pk-${id}`}>ID do produto na Kiwify</label><input id={`pk-${id}`} name="kiwify_product_id" defaultValue={p?.kiwify_product_id ?? ''} className="mono" /></div>
      </div>
      <label className={styles.check}><input type="checkbox" name="venda_aberta" defaultChecked={p?.venda_aberta ?? true} /> À venda (aparece para os alunos e na vitrine)</label>
      <label className={styles.check}><input type="checkbox" name="destaque" defaultChecked={p?.destaque ?? false} /> Destaque: quadrado vermelho no edital da vitrine e no início do aluno (use para a Reta Final)</label>
    </FormAcao>
  );
}

export default async function Produtos() {
  const supabase = await createClient();
  const [{ data }, { data: eds }] = await Promise.all([
    supabase.from('produtos').select('*').order('ordem').order('nome'),
    supabase.from('editais').select('id, nome').order('nome'),
  ]);
  const produtos = (data ?? []) as P[];
  const editais = (eds ?? []) as { id: string; nome: string }[];
  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Produtos e loja' }]} />
      <h1 className={`display ${styles.titulo}`}>Produtos e loja</h1>
      <p className="suave" style={{ margin: 0, maxWidth: '72ch' }}>
        Tudo o que é vendido no site. O aluno vê os produtos à venda nas páginas Cursos em PDF, Simulados e Mentoria; o que ele compra abre, o resto aparece com cadeado e leva direto para o link de compra.
        A compra aprovada na Kiwify libera o acesso sozinha (precisa do ID do produto na Kiwify).
      </p>
      <section className={`cartao ${styles.bloco}`} style={{ borderColor: 'var(--azul)' }} aria-labelledby="novo">
        <h2 id="novo" className="display">Novo produto</h2>
        <Form editais={editais} />
      </section>
      {produtos.map((p) => (
        <details key={p.id} className={`cartao ${styles.bloco}`}>
          <summary style={{ cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`${styles.chip} ${p.venda_aberta ? styles.chipOk : styles.chipNeutro}`}>{p.venda_aberta ? 'À venda' : 'Fechado'}</span>
            <b>{p.nome}</b><span className="suave">· {TIPOS[p.tipo]?.split(' (')[0] ?? p.tipo}{p.preco ? ` · ${p.preco}` : ''}{p.destaque ? ' · destaque' : ''}</span>
          </summary>
          <div style={{ paddingTop: 12 }}><Form p={p} editais={editais} /></div>
        </details>
      ))}
    </>
  );
}
