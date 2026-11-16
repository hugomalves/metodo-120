import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { PLANOS, totalPlano, type Plano } from '@/lib/planos';
import s from './planos.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Planos', description: 'Planos de assinatura do Método 120 para carreiras policiais.' };

type ProdutoPlano = { slug: string; nome: string; checkout_url: string | null; venda_aberta: boolean; edital_id: string | null; editais: { nome: string } | null };

// Planos de assinatura: Básico, Até a prova (um produto por concurso) e Todos os cursos
export default async function Planos() {
  let produtos: ProdutoPlano[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('produtos').select('slug, nome, checkout_url, venda_aberta, edital_id, editais(nome)')
      .like('slug', 'plano-%').eq('venda_aberta', true).order('ordem');
    produtos = (data ?? []) as unknown as ProdutoPlano[];
  } catch { /* sem conexão: botões "em breve" */ }

  const nomeOpcao = (x: ProdutoPlano) =>
    x.editais?.nome ?? x.nome.replace(/^plano\s+(b[aá]sico|at[eé] a prova|todos os cursos)\s*[·:-]?\s*/i, '') ?? x.nome;
  const botoes = (p: Plano) => {
    const lista = produtos.filter((x) => (x.slug === p.slug || x.slug.startsWith(p.slug + '-')) && x.checkout_url);
    if (!lista.length) return <span className={s.breve}>Em breve</span>;
    if (p.escolha && (lista.length > 1 || lista[0].slug !== p.slug)) {
      return (
        <div className={s.concursos}>
          <span className={s.escolha}>{p.escolha}</span>
          {lista.map((x) => (
            <a key={x.slug} href={x.checkout_url!} target="_blank" rel="noopener" className="btn btn-linha">{nomeOpcao(x) || x.nome}</a>
          ))}
        </div>
      );
    }
    return <a href={lista[0].checkout_url!} target="_blank" rel="noopener" className={`btn ${p.destaque ? s.btnDestaque : 'btn-azul'}`}>Assinar o {p.nome}</a>;
  };

  return (
    <>
      <Cabecalho />
      <main className={s.pagina}>
        <div className="container">
          <div className={s.cabeca}>
            <span className={s.rotulo}>Planos de assinatura</span>
            <h1 className={s.titulo}>Um plano para cada momento da sua preparação</h1>
            <p className={s.sub}>Todos os planos valem por 1 ano, com preço fechado em até 12x. Comece pelo extensivo, foque em um concurso até a prova ou leve todos os cursos policiais. Sem conta ainda? <Link href="/entrar?modo=criar">Crie a sua grátis</Link> e teste o banco de questões.</p>
          </div>
          <div className={s.grade}>
            {PLANOS.map((p) => (
              <section key={p.chave} className={`${s.plano} ${p.destaque ? s.destaque : ''}`} aria-labelledby={`plano-${p.chave}`}>
                {p.selo && <span className={s.selo}>{p.selo}</span>}
                <h2 id={`plano-${p.chave}`} className={s.nome}>{p.nome}</h2>
                <p className={s.resumo}>{p.resumo}</p>
                <div className={s.preco}>
                  <span className={s.vezes}>{p.parcelas}x de</span>
                  <span className={s.valor}><small>R$</small>{p.parcela}</span>
                  <span className={s.total}>Preço fechado de R$ {totalPlano(p)} por 1 ano</span>
                </div>
                <ul className={s.itens}>
                  {p.itens.map((i) => (
                    <li key={i.texto} className={i.emBreve ? s.itemBreve : undefined}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                      <span>{i.texto}{i.emBreve && <em> · em breve</em>}</span>
                    </li>
                  ))}
                </ul>
                <div className={s.acao}>{botoes(p)}</div>
              </section>
            ))}
          </div>
          <p className={s.nota}>Pagamento processado pela Kiwify. Material de preparação independente, sem vínculo com as instituições ou bancas dos concursos.</p>
        </div>
      </main>
    </>
  );
}
