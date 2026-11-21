'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type R = { ok?: string; erro?: string };
const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const atualizar = () => { revalidatePath('/aluno/questoes'); revalidatePath('/professor/avisos'); };

export async function salvarAviso(_: R, f: FormData): Promise<R> {
  const titulo = txt(f, 'titulo');
  const link = txt(f, 'link_url');
  if (titulo.length < 3) return { erro: 'Escreva o título do aviso.' };
  if (link && !/^(https?:\/\/|\/)/.test(link)) return { erro: 'O link precisa começar com https:// (ou com / para uma página do site).' };
  const supabase = await createClient();
  const { error } = await supabase.from('avisos_banco').insert({
    titulo: titulo.slice(0, 90), texto: txt(f, 'texto').slice(0, 300) || null,
    link_url: link || null, link_texto: txt(f, 'link_texto').slice(0, 40) || null,
    ordem: parseInt(txt(f, 'ordem'), 10) || 0, ativo: true,
  });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  atualizar();
  return { ok: 'Aviso publicado no banco de questões dos alunos.' };
}

export async function alternarAviso(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('avisos_banco').update({ ativo: txt(f, 'ativar') === 'sim' }).eq('id', txt(f, 'id'));
  atualizar();
}

export async function excluirAviso(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('avisos_banco').delete().eq('id', txt(f, 'id'));
  atualizar();
}
