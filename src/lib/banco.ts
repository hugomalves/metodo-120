import type { SupabaseClient } from '@supabase/supabase-js';
import { minhasTentativas } from '@/lib/questao';
import { CHAVES, type Chave, type EditalFiltro, type Grupo } from '@/lib/filtros';
import { todasAsLinhas } from '@/lib/paginar';

// filtros que vêm na URL (mais a situação: não fiz / errei / acertei)
export type FiltroBanco = Partial<Record<Chave | 's', string>>;
export type QuestaoLista = { id: string; codigo: string; disciplina: string; assunto: string | null; nivel: string | null };
export type MinhaResposta = { questao_id: string; acertou: boolean };

const UUID = /^[0-9a-f-]{36}$/i;

// disciplinas de um edital (para filtrar o banco pelo edital)
async function disciplinasDoEdital(supabase: SupabaseClient, edital: string): Promise<string[]> {
  if (!UUID.test(edital)) return [];
  const { data } = await supabase.from('edital_disciplinas').select('disciplina').eq('edital_id', edital);
  return ((data ?? []) as { disciplina: string }[]).map((d) => d.disciplina);
}

// Questões publicadas que batem com os filtros e o resultado da última tentativa do aluno em cada uma
export async function buscarQuestoes(supabase: SupabaseClient, alunoId: string, f: FiltroBanco) {
  const discEdital = f.e ? await disciplinasDoEdital(supabase, f.e) : null;
  const montar = () => {
    let q = supabase.from('questoes').select('id, codigo, disciplina, assunto, nivel')
      .order('ano', { ascending: false, nullsFirst: false }).order('prova', { nullsFirst: false }).order('numero_prova', { nullsFirst: false })
      .order('codigo');
    if (discEdital) q = q.in('disciplina', discEdital);
    if (f.d) q = q.eq('disciplina', f.d);
    if (f.a) q = q.eq('assunto', f.a);
    if (f.b) q = q.eq('banca', f.b);
    if (f.t) q = q.eq('tipo', f.t);
    if (f.o) q = q.eq('orgao', f.o);
    if (f.c) q = q.eq('cargo', f.c);
    if (f.y && /^\d{4}$/.test(f.y)) q = q.eq('ano', parseInt(f.y, 10));
    if (f.esc) q = q.eq('escolaridade', f.esc);
    if (f.n) q = q.eq('nivel', f.n);
    if (f.or) q = q.eq('origem', f.or);
    return q;
  };
  // busca em páginas de 1000 (o Supabase corta em 1000 por chamada)
  const [data, tentativas] = await Promise.all([
    todasAsLinhas<QuestaoLista>((de, ate) => montar().range(de, ate)),
    minhasTentativas(supabase, alunoId),
  ]);
  const minhas = new Map<string, MinhaResposta>();
  tentativas.forEach((t) => { if (!minhas.has(t.questao_id)) minhas.set(t.questao_id, { questao_id: t.questao_id, acertou: t.acertou }); });
  let lista = data;
  if (f.s === 'nao_feitas') lista = lista.filter((x) => !minhas.has(x.id));
  if (f.s === 'erradas') lista = lista.filter((x) => minhas.get(x.id)?.acertou === false);
  if (f.s === 'acertadas') lista = lista.filter((x) => minhas.get(x.id)?.acertou === true);
  return { lista, minhas };
}

// combinações que existem no banco, com a contagem de cada uma (busca em páginas: são mais de 1000 linhas)
export async function contagemBanco(supabase: SupabaseClient): Promise<Grupo[]> {
  return todasAsLinhas<Grupo>((de, ate) => supabase.rpc('contagem_banco').range(de, ate));
}

// combinações que existem no banco (filtros e contagem ao vivo) e os editais publicados
export async function dadosDosFiltros(supabase: SupabaseClient): Promise<{ grupos: Grupo[]; editais: EditalFiltro[] }> {
  const [g, { data: e }] = await Promise.all([
    contagemBanco(supabase),
    supabase.from('editais').select('id, nome, data_prova, edital_disciplinas(disciplina)').eq('publicado', true).order('data_prova', { nullsFirst: false }),
  ]);
  const editais = ((e ?? []) as { id: string; nome: string; edital_disciplinas: { disciplina: string }[] }[])
    .map((x) => ({ id: x.id, nome: x.nome, disciplinas: x.edital_disciplinas.map((d) => d.disciplina) }));
  return { grupos: g, editais };
}

export function filtroDaUrl(sp: Record<string, string | undefined>): FiltroBanco {
  const limpo = (v?: string) => (v && v.length <= 80 ? v : undefined);
  const f: FiltroBanco = {};
  [...CHAVES, 's' as const].forEach((k) => { const v = limpo(sp[k]); if (v) f[k] = v; });
  return f;
}

export function urlFiltro(f: FiltroBanco, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  Object.entries({ ...f, ...extra }).forEach(([k, v]) => { if (v) p.set(k, v); });
  const t = p.toString();
  return t ? `?${t}` : '';
}
