'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buscarQuestoes, type FiltroBanco } from '@/lib/banco';
import { CHAVES } from '@/lib/filtros';

type Estado = { ok?: string; erro?: string };
const UUID = /^[0-9a-f-]{36}$/i;
const tira = () => revalidatePath('/aluno/questoes', 'layout');

async function quem() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, id: user?.id ?? null };
}
const msg = (e: { message?: string } | null | undefined, padrao: string) => e?.message?.replace(/^.*?:\s*/, '') || padrao;

// ---------- Pastas ----------
export async function criarPasta(_: Estado, f: FormData): Promise<Estado> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const nome = String(f.get('nome') ?? '').trim().replace(/\s+/g, ' ');
  const pai = String(f.get('pai') ?? '');
  if (!nome) return { erro: 'Dê um nome à pasta.' };
  if (nome.length > 80) return { erro: 'Nome muito longo (até 80 letras).' };
  const { error } = await supabase.from('pastas_cadernos').insert({ aluno_id: id, nome, pai_id: UUID.test(pai) ? pai : null });
  if (error) return { erro: msg(error, 'Não foi possível criar a pasta.') };
  tira();
  return { ok: 'Pasta criada.' };
}

export async function renomearPasta(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const nome = String(f.get('nome') ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const pasta = String(f.get('id') ?? '');
  if (!id || !nome || !UUID.test(pasta)) return;
  await supabase.from('pastas_cadernos').update({ nome }).eq('id', pasta).eq('aluno_id', id);
  tira();
}

// apagar a pasta apaga as pastas de dentro; os cadernos não são apagados: voltam para "sem pasta"
export async function excluirPasta(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const pasta = String(f.get('id') ?? '');
  const pai = String(f.get('pai') ?? '');
  if (!id || !UUID.test(pasta)) return;
  await supabase.from('pastas_cadernos').delete().eq('id', pasta).eq('aluno_id', id);
  tira();
  redirect(`/aluno/questoes/cadernos${UUID.test(pai) ? `?pasta=${pai}` : ''}`);
}

// ---------- Cadernos ----------
export async function renomearCaderno(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const caderno = String(f.get('id') ?? '');
  if (!id || !UUID.test(caderno)) return;
  await supabase.rpc('renomear_caderno', { p_id: caderno, p_titulo: String(f.get('titulo') ?? '') });
  tira();
}

export async function moverCaderno(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const caderno = String(f.get('id') ?? '');
  const pasta = String(f.get('pasta') ?? '');
  if (!id || !UUID.test(caderno)) return;
  await supabase.rpc('mover_caderno', { p_id: caderno, p_pasta: UUID.test(pasta) ? pasta : null });
  tira();
}

export async function apagarCaderno(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('listas_questoes').delete().eq('id', String(f.get('id') ?? '')).eq('aluno_id', id);
  tira();
}

// descobre (ou cria) a pasta onde o caderno vai ficar
async function pastaDoCaderno(supabase: Awaited<ReturnType<typeof createClient>>, alunoId: string, f: FormData): Promise<{ pasta?: string; erro?: string }> {
  const escolha = String(f.get('pasta') ?? '');
  if (escolha === 'nova') {
    const nome = String(f.get('nova_pasta') ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!nome) return { erro: 'Escreva o nome da nova pasta.' };
    const { data, error } = await supabase.from('pastas_cadernos').insert({ aluno_id: alunoId, nome }).select('id').single();
    if (error || !data) return { erro: msg(error, 'Não foi possível criar a pasta.') };
    return { pasta: (data as { id: string }).id };
  }
  if (!UUID.test(escolha)) return { erro: 'Escolha a pasta do caderno.' };
  return { pasta: escolha };
}

const CHAVES_OK: string[] = [...CHAVES, 's', 'm'];
function lerFiltro(texto: string): FiltroBanco {
  try {
    const bruto = JSON.parse(texto) as Record<string, unknown>;
    const f: FiltroBanco = {};
    for (const k of CHAVES_OK) { const v = bruto[k]; if (typeof v === 'string' && v && v.length <= 3000) (f as Record<string, string>)[k] = v; }
    return f;
  } catch { return {}; }
}

// Cria o caderno com as questões do filtro, dentro de uma pasta, e abre o caderno
export async function criarCaderno(_: Estado, f: FormData): Promise<Estado> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const filtro = lerFiltro(String(f.get('filtros') ?? '{}'));
  const { pasta, erro } = await pastaDoCaderno(supabase, id, f);
  if (erro || !pasta) return { erro: erro ?? 'Escolha a pasta do caderno.' };
  const { lista } = await buscarQuestoes(supabase, id, filtro);
  const qtd = parseInt(String(f.get('qtd') ?? '0'), 10) || 0;
  const ids = (qtd > 0 ? lista.slice(0, qtd) : lista).map((q) => q.id);
  if (!ids.length) return { erro: 'Nenhuma questão com esses filtros. Tente tirar algum filtro.' };
  const titulo = String(f.get('titulo') ?? '').trim().slice(0, 200) || `Caderno de ${new Date().toLocaleDateString('pt-BR')}`;
  const { data, error } = await supabase.rpc('criar_caderno', { p_titulo: titulo, p_pasta: pasta, p_filtros: filtro, p_ids: ids });
  if (error || !data) return { erro: msg(error, 'Não foi possível criar o caderno.') };
  tira();
  redirect(`/aluno/questoes/lista/${data}`);
}

// Caderno de erros: reúne as questões que o aluno errou (de uma disciplina ou de todas), numa pasta "Cadernos de erros"
export async function criarCadernoDeErros(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  const disciplina = String(f.get('disciplina') ?? '').slice(0, 120);
  const filtro: FiltroBanco = { s: 'erradas' };
  if (disciplina) filtro.d = disciplina;
  const { lista } = await buscarQuestoes(supabase, id, filtro);
  if (!lista.length) redirect('/aluno/questoes/erros');
  let pasta: string | undefined;
  const { data: ja } = await supabase.from('pastas_cadernos').select('id').eq('aluno_id', id).is('pai_id', null).eq('nome', 'Cadernos de erros').maybeSingle();
  pasta = (ja as { id: string } | null)?.id;
  if (!pasta) {
    const { data: nova } = await supabase.from('pastas_cadernos').insert({ aluno_id: id, nome: 'Cadernos de erros' }).select('id').single();
    pasta = (nova as { id: string } | null)?.id;
  }
  if (!pasta) redirect('/aluno/questoes/erros');
  const titulo = `Erros · ${disciplina || 'todas as disciplinas'} · ${new Date().toLocaleDateString('pt-BR')}`;
  const { data } = await supabase.rpc('criar_caderno', { p_titulo: titulo, p_pasta: pasta, p_filtros: filtro, p_ids: lista.map((q) => q.id) });
  tira();
  redirect(data ? `/aluno/questoes/lista/${data}` : '/aluno/questoes/erros?limite=1');
}
