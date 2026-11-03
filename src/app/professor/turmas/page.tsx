import { createClient } from '@/lib/supabase/server';
import { Caminho, PAINEL_PROFESSOR } from '@/components/Caminho';
import { criarTurma, salvarLimitesBanco, salvarProduto } from '../actions';
import { FormAcao } from '../FormAcao';
import styles from '../professor.module.css';

export const metadata = { title: 'Turmas e vendas · Painel do professor' };

type Produto = { id: string; slug: string; nome: string; dias_curso: number | null; venda_aberta: boolean; venda_fecha_em: string | null; checkout_url: string | null; kiwify_product_id: string | null; acesso_ate: string | null; tipo?: string };
type Evento = { id: string; order_id: string | null; evento: string | null; email: string | null; produto_kiwify: string | null; resultado: string | null; recebido_em: string };
type Turma = { id: string; nome: string; inicio: string; semanas: number; produto_id: string; matriculas: { count: number }[] };

const data = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

export default async function Turmas() {
  const supabase = await createClient();
  const [{ data: prods }, { data: tur }, { data: evs }, { data: cfg }] = await Promise.all([
    supabase.from('produtos').select('*').order('criado_em'),
    supabase.from('turmas').select('id, nome, inicio, semanas, produto_id, matriculas(count)').order('inicio'),
    supabase.from('eventos_kiwify').select('id, order_id, evento, email, produto_kiwify, resultado, recebido_em').order('recebido_em', { ascending: false }).limit(15),
    supabase.from('configuracoes').select('chave, valor'),
  ]);
  const config = new Map(((cfg ?? []) as { chave: string; valor: unknown }[]).map((c) => [c.chave, Number(c.valor)]));
  const eventos = (evs as Evento[] | null) ?? [];
  const produtoDoId = (kid: string | null) => produtos.find((p) => kid && p.kiwify_product_id === kid)?.nome ?? null;
  // e-mail parcialmente escondido (só para conferência)
  const mascara = (e: string | null) => (e && e.includes('@') ? `${e.slice(0, 2)}***@${e.split('@')[1]}` : '–');
  const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const produtos = (prods as Produto[] | null) ?? [];
  const turmas = (tur as Turma[] | null) ?? [];
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Caminho passos={[PAINEL_PROFESSOR, { rotulo: 'Turmas e vendas' }]} />
      <h1 className={`display ${styles.titulo}`}>Turmas e vendas</h1>

      {produtos.map((p) => (
        <section key={p.id} className={`cartao ${styles.bloco}`}>
          <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
            <h2 className="display">{p.nome}</h2>
            <span className="linha-flex" style={{ gap: 6 }}>
              {p.tipo && <span className={`${styles.chip} ${styles.chipNeutro}`}>{p.tipo === 'banco' ? 'Libera: só o banco' : 'Libera: curso + banco'}</span>}
              <span className={`${styles.chip} ${p.venda_aberta ? styles.chipOk : styles.chipNeutro}`}>{p.venda_aberta ? 'À venda' : 'Vendas fechadas'}</span>
            </span>
          </div>
          {p.dias_curso && (
            <p className="suave" style={{ margin: 0, fontSize: 14 }}>
              Curso de {p.dias_curso} dias. A data-limite de venda é a da última turma que termina com 2 a 3 semanas de folga antes da prova de Matemática.
            </p>
          )}
          <FormAcao acao={salvarProduto} botao="Salvar">
            {/* a chave refaz os campos com os valores salvos (o React volta os campos ao valor inicial depois de salvar) */}
            <div key={[p.tipo, p.venda_aberta, p.venda_fecha_em, p.acesso_ate, p.checkout_url, p.kiwify_product_id].join('|')} style={{ display: 'contents' }}>
            <input type="hidden" name="id" value={p.id} />
            <div className={styles.campos}>
              <div className="campo">
                <label htmlFor={`fecha-${p.id}`}>Vendas fecham em (em branco = sem data)</label>
                <input id={`fecha-${p.id}`} name="venda_fecha_em" type="date" defaultValue={p.venda_fecha_em ?? ''} />
              </div>
              <div className="campo">
                <label htmlFor={`ate-${p.id}`}>Acesso dos alunos até (em branco = sem fim)</label>
                <input id={`ate-${p.id}`} name="acesso_ate" type="date" defaultValue={p.acesso_ate ?? ''} />
              </div>
              <div className="campo" style={{ gridColumn: 'span 2' }}>
                <label htmlFor={`link-${p.id}`}>Link do checkout na Kiwify</label>
                <input id={`link-${p.id}`} name="checkout_url" type="url" defaultValue={p.checkout_url ?? ''} placeholder="https://pay.kiwify.com.br/..." />
              </div>
              <div className="campo">
                <label htmlFor={`kw-${p.id}`}>ID do produto na Kiwify</label>
                <input id={`kw-${p.id}`} name="kiwify_product_id" type="text" defaultValue={p.kiwify_product_id ?? ''} className="mono" />
              </div>
              {p.tipo && (
                <div className="campo">
                  <label htmlFor={`tipo-${p.id}`}>O que este produto libera</label>
                  <select id={`tipo-${p.id}`} name="tipo" defaultValue={p.tipo}>
                    <option value="curso">Curso completo (inclui o banco)</option>
                    <option value="banco">Só o banco de questões completo</option>
                  </select>
                </div>
              )}
            </div>
            <p className="suave" style={{ margin: 0, fontSize: 14 }}>
              Depois do “acesso até”, o aluno perde o acesso ao conteúdo. Seis meses depois disso (e sem entrar no site), a conta é apagada automaticamente. Deixe em branco para não ter data de término.
            </p>
            <label className={styles.check}>
              <input type="checkbox" name="venda_aberta" defaultChecked={p.venda_aberta} /> Aberto para venda (aparece na vitrine)
            </label>
            </div>
          </FormAcao>
        </section>
      ))}

      <section aria-labelledby="turmas" className={`cartao ${styles.bloco}`}>
        <h2 id="turmas" className="display">Turmas</h2>
        {turmas.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nenhuma turma criada ainda.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Turma</th><th>Produto</th><th>Início</th><th>Alunos</th><th>Situação</th></tr></thead>
              <tbody>
                {turmas.map((t) => {
                  const fim = new Date(new Date(t.inicio + 'T12:00:00').getTime() + t.semanas * 7 * 86400000).toISOString().slice(0, 10);
                  const situacao = t.inicio > hoje ? 'Inscrições abertas' : fim < hoje ? 'Encerrada' : 'Em andamento';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.nome}</td>
                      <td>{produtos.find((p) => p.id === t.produto_id)?.nome ?? '–'}</td>
                      <td className="mono">{data(t.inicio)}</td>
                      <td>{t.matriculas?.[0]?.count ?? 0}</td>
                      <td><span className={`${styles.chip} ${situacao === 'Em andamento' ? styles.chipOk : styles.chipNeutro}`}>{situacao}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <h3 className="display" style={{ margin: '8px 0 0', fontSize: 17 }}>Nova turma</h3>
        <FormAcao acao={criarTurma} botao="Criar turma">
          <div className={styles.campos}>
            <div className="campo"><label htmlFor="tnome">Nome</label><input id="tnome" name="nome" type="text" required placeholder="Turma de abril" /></div>
            <div className="campo">
              <label htmlFor="tprod">Produto</label>
              <select id="tprod" name="produto_id" required>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <div className="campo"><label htmlFor="tini">Início</label><input id="tini" name="inicio" type="date" required /></div>
          </div>
        </FormAcao>
      </section>
      <section aria-labelledby="gratis" className={`cartao ${styles.bloco}`}>
        <h2 id="gratis" className="display">Banco de questões: plano grátis</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          Quem cria conta sem comprar usa o banco com estes limites. Quem tem o curso ou o banco completo não tem limite.
        </p>
        <FormAcao acao={salvarLimitesBanco} botao="Salvar limites">
          <div className={styles.campos}>
            <div className="campo"><label htmlFor="lpd">Questões por dia</label><input id="lpd" name="por_dia" type="number" min={0} max={200} defaultValue={config.get('banco_gratis_por_dia') ?? 10} /></div>
            <div className="campo"><label htmlFor="llm">Tamanho máximo das listas</label><input id="llm" name="lista_max" type="number" min={5} max={45} defaultValue={config.get('banco_gratis_lista_max') ?? 10} /></div>
          </div>
        </FormAcao>
      </section>

      <section aria-labelledby="avisos" className={`cartao ${styles.bloco}`}>
        <h2 id="avisos" className="display">Avisos da Kiwify</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          Os últimos avisos de compra que chegaram ao site. Se aparecer &quot;produto desconhecido&quot;, copie o ID do produto mostrado aqui para o campo &quot;ID do produto na Kiwify&quot; acima.
        </p>
        {eventos.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Nenhum aviso recebido ainda.</p>
        ) : (
          <div className={styles.tabelaCaixa}>
            <table className={styles.tabela}>
              <thead><tr><th>Quando</th><th>Evento</th><th>Comprador</th><th>ID do produto</th><th>Resultado</th></tr></thead>
              <tbody>
                {eventos.map((e) => {
                  const ok = /liberado|encerrado|já processado|aguardando/.test(e.resultado ?? '');
                  return (
                    <tr key={e.id}>
                      <td className="mono">{quando(e.recebido_em)}</td>
                      <td>{e.evento || '–'}</td>
                      <td className="mono">{mascara(e.email)}</td>
                      <td className="mono" style={{ fontSize: 13, wordBreak: 'break-all' }}>{e.produto_kiwify || '–'}{produtoDoId(e.produto_kiwify) ? ` (${produtoDoId(e.produto_kiwify)})` : ''}</td>
                      <td><span className={`${styles.chip} ${ok ? styles.chipOk : styles.chipAlerta}`}>{e.resultado || '–'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
