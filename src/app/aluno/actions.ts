'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cpfValido, formatarCpf, formatarTelefone, soDigitos, telefoneValido } from '@/lib/documentos';

async function quem() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, id: user?.id ?? null };
}

// O aluno marca a aula como concluída; o dia conta como dia de estudo
export async function concluirAula(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  const aula = String(f.get('aula_id') ?? '');
  const minutos = parseInt(String(f.get('minutos') ?? '15'), 10) || 15;
  const { error } = await supabase.from('progresso_aulas').insert({ aluno_id: id, aula_id: aula });
  if (!error) await supabase.rpc('registrar_estudo', { p_minutos: minutos });
  revalidatePath('/aluno', 'layout');
}

export async function desmarcarAula(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('progresso_aulas').delete().eq('aluno_id', id).eq('aula_id', String(f.get('aula_id') ?? ''));
  revalidatePath('/aluno', 'layout');
}

export async function trocarTrilha(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const trilha = String(f.get('trilha') ?? '');
  if (!id || (trilha !== 'gabaritar' && trilha !== 'ir_bem')) return;
  await supabase.from('perfis').update({ trilha }).eq('id', id);
  revalidatePath('/aluno', 'layout');
}

// ---------- Dúvidas (só o professor vê) ----------
export type ResAluno = { ok?: string; erro?: string };

export async function enviarDuvida(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const aula = String(f.get('aula_id') ?? '');
  const { error } = await supabase.rpc('enviar_duvida', {
    p_aula: aula || null,
    p_texto: String(f.get('texto') ?? ''),
    p_contexto: String(f.get('contexto') ?? '') || null,
  });
  if (error) return { erro: error.message };
  revalidatePath('/aluno/duvidas');
  return { ok: 'Dúvida enviada ao professor. A resposta aparece em "Minhas dúvidas".' };
}

export async function avaliarResposta(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const entendeu = f.get('entendeu') === 'sim';
  const { error } = await supabase.rpc('avaliar_resposta', {
    p_duvida: String(f.get('duvida_id') ?? ''),
    p_entendeu: entendeu,
    p_texto: String(f.get('texto') ?? '') || null,
  });
  if (error) return { erro: error.message };
  revalidatePath('/aluno', 'layout');
  return { ok: entendeu ? 'Que bom! Dúvida marcada como sanada.' : 'Avisamos o professor que a resposta ainda não ficou clara.' };
}

// ---------- Banco de questões ----------
export type Correcao = { acertou: boolean; resposta: string; comentario: string | null; video_url: string | null; primeira: boolean; vezes?: number; acertos?: number };

export async function responderQuestao(questao: string, letra: string, lista?: string | null): Promise<{ erro?: string; correcao?: Correcao }> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const { data, error } = await supabase.rpc('responder_questao', { p_questao: questao, p_letra: letra, p_lista: lista ?? null });
  if (error) return { erro: error.message };
  const correcao = ((data ?? []) as Correcao[])[0];
  revalidatePath('/aluno/questoes', 'layout');
  return { correcao };
}

export async function alternarRanking(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('perfis').update({ participa_ranking: f.get('participar') === 'sim' }).eq('id', id);
  revalidatePath('/aluno', 'layout');
}

// ---------- Simulados do edital ----------
export async function gerarProva(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const edital = String(f.get('edital') ?? '');
  const { data, error } = await supabase.rpc('gerar_prova_edital', { p_edital: edital, p_tipo: f.get('tipo') === 'completo' ? 'completo' : 'mini' });
  if (error || !data) return { erro: error?.message ?? 'Não foi possível gerar o simulado.' };
  revalidatePath('/aluno/provas');
  redirect(`/aluno/provas/${data}`);
}

export async function salvarProva(prova: string, respostas: string): Promise<{ erro?: string }> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const { error } = await supabase.rpc('salvar_prova', { p_prova: prova, p_respostas: respostas });
  return error ? { erro: error.message } : {};
}

export async function entregarProva(prova: string, respostas: string): Promise<{ erro?: string }> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const { error } = await supabase.rpc('finalizar_prova', { p_prova: prova, p_respostas: respostas });
  if (error) return { erro: error.message };
  revalidatePath('/aluno/provas', 'layout');
  return {};
}

// ---------- Edital que o aluno segue ----------
export async function seguirEdital(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  const edital = String(f.get('edital') ?? '');
  await supabase.from('perfis').update({ edital_id: /^[0-9a-f-]{36}$/i.test(edital) ? edital : null }).eq('id', id);
  revalidatePath('/aluno', 'layout');
}

// ---------- Listas sob medida ----------
export async function criarLista(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const v = (k: string) => String(f.get(k) ?? '').trim() || null;
  const edital = v('e');
  const ano = v('y');
  const { data, error } = await supabase.rpc('gerar_lista', {
    p_qtd: parseInt(v('qtd') ?? '10', 10) || 10,
    p_edital: edital && /^[0-9a-f-]{36}$/i.test(edital) ? edital : null,
    p_banca: v('b'), p_orgao: v('o'), p_cargo: v('c'), p_ano: ano && /^\d{4}$/.test(ano) ? parseInt(ano, 10) : null,
    p_escolaridade: v('esc'), p_disciplina: v('d'), p_assunto: v('a'), p_tipo: v('t'), p_nivel: v('n'), p_origem: v('or'),
    p_somente_novas: f.get('novas') === 'on',
  });
  if (error || !data) return { erro: error?.message ?? 'Não foi possível montar a lista.' };
  revalidatePath('/aluno/questoes', 'layout');
  redirect(`/aluno/questoes/lista/${data}`);
}

export async function apagarLista(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('listas_questoes').delete().eq('id', String(f.get('id') ?? '')).eq('aluno_id', id);
  revalidatePath('/aluno/questoes', 'layout');
}

// Se a Kiwify não mandou o CPF e o telefone da compra, o aluno informa uma vez para liberar o PDF com a marca d'água
export async function salvarDadosComprador(_: { ok?: string; erro?: string }, f: FormData): Promise<{ ok?: string; erro?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: 'Entre na sua conta para continuar.' };
  const nome = String(f.get('nome') ?? '').trim().replace(/\s+/g, ' ');
  const cpf = String(f.get('cpf') ?? '');
  const telefone = String(f.get('telefone') ?? '');
  if (nome.length < 8 || !nome.includes(' ')) return { erro: 'Escreva o nome completo, como está no seu documento.' };
  if (!cpfValido(cpf)) return { erro: 'CPF inválido. Confira os números.' };
  if (!telefoneValido(telefone)) return { erro: 'Telefone inválido. Use DDD + número.' };
  const { error } = await supabase.from('dados_comprador').insert({
    email: user.email.toLowerCase(), nome, cpf: soDigitos(cpf), telefone: soDigitos(telefone), origem: 'aluno',
  });
  if (error) return { erro: 'Não foi possível salvar. Se você já informou antes, escreva para o suporte para corrigir.' };
  revalidatePath('/aluno/material', 'layout');
  return { ok: `Dados salvos: ${formatarCpf(cpf)} · ${formatarTelefone(telefone)}.` };
}
