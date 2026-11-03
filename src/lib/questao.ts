import type { SupabaseClient } from '@supabase/supabase-js';

export type ResolucaoQuestao = { resposta: string; comentario: string | null; video_url: string | null; minha_letra: string; acertou: boolean };
export type TextoBase = { id: string; codigo: string; texto: string; figuras: string[] };
export type QuestaoCompleta = {
  id: string; codigo: string; origem: string; tipo: string; banca: string | null; orgao: string | null; cargo: string | null;
  ano: number | null; escolaridade: string | null; prova: string | null; numero_prova: number | null;
  disciplina: string; assunto: string | null; nivel: string | null;
  enunciado: string; formato: string; alt_a: string; alt_b: string; alt_c: string; alt_d: string; alt_e: string;
  respondidas: number; acertadas: number;
  imagem: string | null;      // recorte original da prova (link temporário)
  figuras: string[];          // figuras do texto (links temporários)
  textoBase: TextoBase | null; // texto compartilhado por vários itens (certo/errado)
  resolucao: ResolucaoQuestao | null;   // só dentro de uma lista: a resposta que o aluno deu nela
  historico: Historico;                 // quantas vezes o aluno já fez a questão (banco e listas)
};
export type Historico = { vezes: number; acertos: number; ultima: boolean | null };
const SEM_HISTORICO: Historico = { vezes: 0, acertos: 0, ultima: null };

type Tentativa = { questao_id: string; acertou: boolean; lista_id?: string | null; respondida_em?: string };

// Todas as tentativas do aluno (mais recente primeiro)
export async function minhasTentativas(supabase: SupabaseClient, alunoId: string, ids?: string[]): Promise<Tentativa[]> {
  let q = supabase.from('tentativas_questoes').select('questao_id, acertou, lista_id, respondida_em').eq('aluno_id', alunoId)
    .order('respondida_em', { ascending: false }).limit(5000);
  if (ids) q = q.in('questao_id', ids);
  const { data } = await q;
  return (data ?? []) as Tentativa[];
}

export function historicoPorQuestao(tentativas: Tentativa[]): Map<string, Historico> {
  const m = new Map<string, Historico>();
  for (const t of tentativas) {   // já vem da mais recente para a mais antiga
    const h = m.get(t.questao_id) ?? { vezes: 0, acertos: 0, ultima: t.acertou };
    h.vezes += 1; if (t.acertou) h.acertos += 1;
    m.set(t.questao_id, h);
  }
  return m;
}

// Respostas dadas dentro de cada lista (questão → acertou)
export async function respostasDasListas(supabase: SupabaseClient, alunoId: string, listas: { id: string; questoes: string[] }[]) {
  const out = new Map<string, Map<string, boolean>>(listas.map((l) => [l.id, new Map()]));
  if (!listas.length) return out;
  const { data } = await supabase.from('tentativas_questoes').select('lista_id, questao_id, acertou')
    .eq('aluno_id', alunoId).in('lista_id', listas.map((l) => l.id));
  ((data ?? []) as { lista_id: string; questao_id: string; acertou: boolean }[]).forEach((t) => out.get(t.lista_id)?.set(t.questao_id, t.acertou));
  return out;
}

const CAMPOS = 'id, codigo, origem, tipo, banca, orgao, cargo, ano, escolaridade, prova, numero_prova, disciplina, assunto, nivel, enunciado, formato, imagem_path, figuras, texto_base_id, alt_a, alt_b, alt_c, alt_d, alt_e, respondidas, acertadas';

async function links(supabase: SupabaseClient, caminhos: string[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(caminhos.filter(Boolean)));
  if (!unicos.length) return new Map();
  const { data } = await supabase.storage.from('materiais').createSignedUrls(unicos, 3600);
  const itens = (data ?? []) as { path: string | null; signedUrl: string }[];
  return new Map(itens.filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

// Carrega as questões (na ordem dos ids) com figuras, texto-base e o histórico do aluno.
// No banco livre a questão sempre volta em branco; numa lista, volta com a resposta dada nela.
export async function carregarQuestoes(supabase: SupabaseClient, alunoId: string, ids: string[], listaId?: string | null): Promise<QuestaoCompleta[]> {
  if (!ids.length) return [];
  const { data } = await supabase.from('questoes').select(CAMPOS).in('id', ids);
  type Linha = Omit<QuestaoCompleta, 'imagem' | 'figuras' | 'textoBase' | 'resolucao' | 'historico'> & { imagem_path: string | null; figuras: string[] | null; texto_base_id: string | null };
  const linhas = (data ?? []) as unknown as Linha[];

  const idsTextos = Array.from(new Set(linhas.map((l) => l.texto_base_id).filter((x): x is string => !!x)));
  const { data: tb } = idsTextos.length
    ? await supabase.from('textos_base').select('id, codigo, texto, figuras').in('id', idsTextos)
    : { data: [] };
  const textos = (tb ?? []) as TextoBase[];

  const [mapa, tentativas, resolucoes] = await Promise.all([
    links(supabase, [...linhas.flatMap((l) => [l.imagem_path ?? '', ...(l.figuras ?? [])]), ...textos.flatMap((t) => t.figuras ?? [])]),
    minhasTentativas(supabase, alunoId, ids),
    listaId ? resolucoesDaLista(supabase, listaId) : Promise.resolve(new Map<string, ResolucaoQuestao>()),
  ]);
  const historicos = historicoPorQuestao(tentativas);
  const textoPorId = new Map(textos.map((t) => [t.id, { ...t, figuras: (t.figuras ?? []).map((f) => mapa.get(f) ?? '') }]));

  const porId = new Map(linhas.map((l) => {
    const { imagem_path, figuras, texto_base_id, ...resto } = l;
    return [l.id, {
      ...resto,
      imagem: imagem_path ? mapa.get(imagem_path) ?? null : null,
      figuras: (figuras ?? []).map((f) => mapa.get(f) ?? ''),
      textoBase: texto_base_id ? textoPorId.get(texto_base_id) ?? null : null,
      resolucao: resolucoes.get(l.id) ?? null,
      historico: historicos.get(l.id) ?? SEM_HISTORICO,
    } satisfies QuestaoCompleta];
  }));
  return ids.map((id) => porId.get(id)).filter((q): q is QuestaoCompleta => !!q);
}

async function resolucoesDaLista(supabase: SupabaseClient, listaId: string): Promise<Map<string, ResolucaoQuestao>> {
  const { data } = await supabase.rpc('ver_resolucoes_lista', { p_lista: listaId });
  return new Map(((data ?? []) as (ResolucaoQuestao & { questao_id: string })[]).map((r) => [r.questao_id, r]));
}

export const POR_PAGINA_OPCOES = [1, 5, 10] as const;
export function porPagina(valor: string | undefined, cookie: string | undefined): number {
  const n = parseInt(valor ?? cookie ?? '', 10);
  return (POR_PAGINA_OPCOES as readonly number[]).includes(n) ? n : 1;
}
