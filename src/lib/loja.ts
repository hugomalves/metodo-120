import type { SupabaseClient } from '@supabase/supabase-js';

// Produtos à venda (cadastrados no painel) e o que o aluno já comprou
export type Produto = {
  id: string; slug: string; nome: string; tipo: 'curso' | 'banco' | 'mentoria' | 'simulados';
  descricao: string | null; preco: string | null; beneficios: string[]; edital_id: string | null;
  destaque: boolean; selo: string | null; ordem: number; checkout_url: string | null; venda_aberta: boolean;
};

export async function carregarLoja(supabase: SupabaseClient, alunoId: string) {
  const [{ data: p }, { data: m }] = await Promise.all([
    supabase.from('produtos').select('id, slug, nome, tipo, descricao, preco, beneficios, edital_id, destaque, selo, ordem, checkout_url, venda_aberta').order('ordem').order('nome'),
    supabase.from('matriculas').select('produto_id').eq('aluno_id', alunoId).eq('status', 'ativa'),
  ]);
  const meus = new Set(((m ?? []) as { produto_id: string }[]).map((x) => x.produto_id));
  const produtos = ((p ?? []) as Produto[]).filter((x) => x.venda_aberta || meus.has(x.id));
  return { produtos, meus };
}

// link de compra: o checkout da Kiwify (ou a página da loja, se o link ainda não foi cadastrado)
export const linkCompra = (p: Produto | undefined | null) => p?.checkout_url || '/aluno/cursos';

// o produto que libera um tipo de conteúdo (de preferência do mesmo edital)
export function produtoQueLibera(produtos: Produto[], tipo: Produto['tipo'], edital?: string | null) {
  return produtos.find((p) => p.tipo === tipo && p.venda_aberta && (!edital || p.edital_id === edital))
    ?? produtos.find((p) => p.tipo === tipo && p.venda_aberta);
}

// Quadrados de simulados gerais (sem aula): o que abre, o que está com cadeado e para onde cada um leva
export type QuadroSimulado = { id: string; titulo: string; n: number; pode: boolean; href: string; externo: boolean; selo: string; preco: string | null; num: number };

export async function quadrosSimulados(supabase: SupabaseClient, alunoId: string, produtos: Produto[], limite?: number): Promise<QuadroSimulado[]> {
  let q = supabase.from('simulados').select('id, codigo, titulo, n_questoes, gratuito, ordem, edital_id').is('aula_id', null).eq('liberado', true).order('ordem').order('codigo');
  if (limite) q = q.limit(limite);
  const [{ data }, { data: env }] = await Promise.all([
    q, supabase.from('envios').select('simulado_id, acertos').eq('aluno_id', alunoId).eq('conta_evolucao', true),
  ]);
  type Sim = { id: string; titulo: string | null; n_questoes: number; gratuito: boolean; edital_id: string | null };
  const sims = (data ?? []) as Sim[];
  const feitos = new Map(((env ?? []) as { simulado_id: string; acertos: number }[]).map((e) => [e.simulado_id, e.acertos]));
  const abre = await Promise.all(sims.map((x) => supabase.rpc('pode_abrir_simulado', { p_simulado: x.id }).then((r) => r.data === true)));
  return sims.map((x, i) => {
    const pode = abre[i];
    const prod = produtoQueLibera(produtos, 'simulados', x.edital_id) ?? produtoQueLibera(produtos, 'curso', x.edital_id);
    const href = pode ? `/aluno/simulado/${x.id}` : linkCompra(prod);
    return {
      id: x.id, titulo: x.titulo ?? `Simulado ${i + 1}`, n: x.n_questoes, pode, href, externo: !pode && href.startsWith('http'), num: i + 1,
      selo: feitos.has(x.id) ? `Feito: ${feitos.get(x.id)}/${x.n_questoes}` : x.gratuito ? 'Grátis' : pode ? 'Liberado' : 'Bloqueado',
      preco: !pode ? prod?.preco ?? null : null,
    };
  });
}
