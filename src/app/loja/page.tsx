import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Cabecalho } from '@/components/Cabecalho';
import { CartaoProduto } from '@/components/CartaoProduto';
import type { Produto } from '@/lib/loja';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Loja', description: 'Cursos em PDF, simulados e mentoria do Método 120.' };

const GRUPOS: { tipo: Produto['tipo']; titulo: string; texto: string }[] = [
  { tipo: 'curso', titulo: 'Cursos em PDF', texto: 'Aulas em PDF com questões, minissimulado em cada aula, revisões e simulados, dentro do plano de 2 horas por dia.' },
  { tipo: 'simulados', titulo: 'Simulados', texto: 'Provas completas no padrão da banca, com cartão-resposta e gabarito comentado.' },
  { tipo: 'mentoria', titulo: 'Mentoria individual', texto: 'Acompanhamento individual para você cumprir o plano até o dia da prova.' },
  { tipo: 'banco', titulo: 'Banco de questões', texto: 'Questões sem limite por dia, listas maiores e impressão.' },
];

// Loja aberta a todos: os produtos à venda, por tipo (o destaque, como a Reta Final, vem primeiro)
export default async function Loja() {
  let produtos: Produto[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('produtos')
      .select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta, imagem_path')
      .eq('venda_aberta', true).order('ordem').order('nome');
    produtos = (data ?? []) as Produto[];
  } catch { /* sem conexão: mostra a loja vazia */ }

  return (
    <>
      <Cabecalho />
      <main className="container" style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '28px 0 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 760 }}>
          <span className="rotulo">Loja Método 120</span>
          <h1 className="display" style={{ margin: 0, fontSize: 'clamp(30px, 4vw, 46px)', color: 'var(--navy)' }}>Escolha o seu caminho até a aprovação</h1>
          <p className="suave" style={{ margin: 0, fontSize: 18 }}>Clique em um produto para ver tudo o que ele inclui. Ainda está decidindo? <Link href="/entrar?modo=criar">Crie a sua conta grátis</Link> e treine com o banco de questões.</p>
        </div>
        {produtos.length === 0 && <p className="suave">Os produtos serão publicados em breve.</p>}
        {GRUPOS.map((g) => {
          const lista = produtos.filter((p) => p.tipo === g.tipo).sort((a, b) => Number(b.destaque) - Number(a.destaque) || a.ordem - b.ordem);
          if (!lista.length) return null;
          return (
            <section key={g.tipo} aria-labelledby={`loja-${g.tipo}`} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h2 id={`loja-${g.tipo}`} className="display" style={{ margin: 0, fontSize: 28, color: 'var(--navy)' }}>{g.titulo}</h2>
                <p className="suave" style={{ margin: '4px 0 0' }}>{g.texto}</p>
              </div>
              <div className="loja-grade">{lista.map((p) => <CartaoProduto key={p.id} p={p} meu={false} />)}</div>
            </section>
          );
        })}
      </main>
    </>
  );
}
