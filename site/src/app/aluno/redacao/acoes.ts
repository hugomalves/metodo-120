'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { caminhoRedacaoValido } from '@/lib/redacaoArquivo';
import { propostaPorSlug } from '@/lib/redacao';
import { iaConfigurada, preCorrigir } from '@/lib/redacaoIA';

export type ResRedacao = { erro?: string };

async function quem() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, id: user?.id ?? null };
}

// Envia uma redação: digitada ou em arquivo (o arquivo já foi enviado pelo navegador para a pasta do aluno)
export async function enviarRedacao(_: ResRedacao, f: FormData): Promise<ResRedacao> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const slug = String(f.get('proposta') ?? '').trim();
  const proposta = propostaPorSlug(slug);
  const tema = (proposta?.tema ?? String(f.get('tema') ?? '')).trim().slice(0, 200);
  const texto = String(f.get('texto') ?? '').replace(/\r/g, '').trim();
  const arquivo = String(f.get('arquivo_path') ?? '').trim();
  if (tema.length < 3) return { erro: 'Escolha uma proposta ou escreva o tema da redação.' };
  if (arquivo) {
    if (!caminhoRedacaoValido(id, arquivo)) return { erro: 'Arquivo inválido. Escolha o arquivo de novo.' };
    const pasta = arquivo.slice(0, arquivo.indexOf('/')), nome = arquivo.slice(arquivo.indexOf('/') + 1);
    const { data: achados, error: eA } = await supabase.storage.from('redacoes').list(pasta, { search: nome, limit: 1 });
    if (eA || !achados?.some((x) => x.name === nome)) return { erro: 'O arquivo não chegou. Tente enviar de novo.' };
  } else {
    if (texto.length < 200) return { erro: 'A redação está muito curta. Escreva o texto completo (de 15 a 20 linhas).' };
    if (texto.length > 6000) return { erro: 'O texto passou do limite de 6000 caracteres.' };
  }

  // o limite do mês é conferido pelo próprio banco; aqui só antecipamos a mensagem
  const [{ data: lim }, { data: usadas }] = await Promise.all([supabase.rpc('redacoes_limite'), supabase.rpc('redacoes_no_mes')]);
  if (typeof lim === 'number' && typeof usadas === 'number' && usadas >= lim) return { erro: `Você já enviou ${lim} redações neste mês. O limite volta no dia 1º.` };

  const linha = { aluno_id: id, tema, proposta: proposta?.slug ?? null, texto: arquivo ? null : texto, arquivo_path: arquivo || null };
  const { data, error } = await supabase.from('redacoes').insert(linha).select('id').single();
  if (error && /LIMITE_REDACOES/.test(error.message)) return { erro: 'Você já usou todas as redações deste mês. O limite volta no dia 1º.' };
  if (error && /row-level security/i.test(error.message)) return { erro: 'A correção de redação é para quem tem curso ou mentoria ativa.' };
  if (error && /redacoes/.test(error.message) && /exist/.test(error.message)) return { erro: 'A redação ainda não foi ativada. Avise a equipe.' };
  if (error || !data) return { erro: 'Não foi possível enviar: ' + (error?.message ?? '') };
  // pré-correção por IA para o professor, depois da resposta (o aluno não espera e nunca vê a pré-correção)
  if (!arquivo && iaConfigurada()) after(() => preCorrigir(data.id));
  revalidatePath('/aluno/redacao', 'layout');
  revalidatePath('/professor/redacoes');
  redirect(`/aluno/redacao/${data.id}?enviada=1`);
}

// Apaga uma redação que ainda não foi corrigida (não devolve o envio do mês)
export async function apagarRedacao(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  const { data: apagada } = await supabase.from('redacoes').delete().eq('id', String(f.get('id') ?? '')).eq('aluno_id', id).eq('status', 'enviada').select('arquivo_path').maybeSingle();
  if (apagada?.arquivo_path) await supabase.storage.from('redacoes').remove([apagada.arquivo_path]);
  revalidatePath('/aluno/redacao', 'layout');
  redirect('/aluno/redacao/minhas');
}
