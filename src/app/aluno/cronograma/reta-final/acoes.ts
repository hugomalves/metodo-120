'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hojeBr, valido } from '@/lib/cronograma';
import { CURSO } from '@/lib/planoCurso';

type R = { ok?: string; erro?: string };
const CAMINHO = '/aluno/cronograma/reta-final';
const COD = /^[A-Z0-9-]{3,40}$/;

// Cria ou ajusta o ritmo do aluno (o plano se redistribui sozinho)
export async function salvarPlano(_: R, f: FormData): Promise<R> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: 'Faça login de novo.' };
  const hoje = hojeBr();
  const inicioBruto = String(f.get('inicio') ?? '');
  const inicio = valido(inicioBruto) && inicioBruto >= hoje ? inicioBruto : hoje;
  const minutos = Math.min(600, Math.max(120, parseInt(String(f.get('minutos') ?? '120'), 10) || 120));
  const dias = f.getAll('dias').map((x) => parseInt(String(x), 10)).filter((n) => n >= 0 && n <= 6);
  if (!dias.length) return { erro: 'Escolha pelo menos um dia de estudo.' };
  const { error } = await supabase.from('planos_aluno').upsert({
    aluno_id: user.id, produto_slug: CURSO, inicio, minutos_dia: minutos, dias_semana: Array.from(new Set(dias)).sort(), atualizado_em: new Date().toISOString(),
  });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath(CAMINHO);
  redirect(CAMINHO);
}

// Marca (ou desmarca) um item como feito hoje
export async function alternarFeito(f: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const codigo = String(f.get('codigo') ?? '');
  if (!user || !COD.test(codigo)) return;
  if (f.get('desfazer') === '1') {
    await supabase.from('plano_feitos').delete().eq('aluno_id', user.id).eq('produto_slug', CURSO).eq('codigo', codigo);
  } else {
    const { data: it } = await supabase.from('plano_curso_itens').select('minutos, disciplina').eq('produto_slug', CURSO).eq('codigo', codigo).maybeSingle();
    if (!it) return;
    const { error } = await supabase.from('plano_feitos').insert({ aluno_id: user.id, produto_slug: CURSO, codigo, dia: hojeBr() });
    // conta o tempo no dia de estudo (sequência de dias e estatísticas), só na primeira vez
    if (!error) await supabase.rpc('ajustar_minutos_dia', { p_dia: hojeBr(), p_minutos: (it as { minutos: number }).minutos });
  }
  revalidatePath(CAMINHO);
}
