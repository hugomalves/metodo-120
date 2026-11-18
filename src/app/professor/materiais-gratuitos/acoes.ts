'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type R = { ok?: string; erro?: string };
const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const atualizar = () => { revalidatePath('/materiais'); revalidatePath('/professor/materiais-gratuitos'); };

export async function salvarMaterialGratuito(_: R, f: FormData): Promise<R> {
  const titulo = txt(f, 'titulo');
  const pdf = txt(f, 'pdf_path');
  if (titulo.length < 3) return { erro: 'Dê um título ao material.' };
  if (!pdf) return { erro: 'Escolha o PDF e espere o aviso "PDF enviado".' };
  const supabase = await createClient();
  const { error } = await supabase.from('materiais_gratuitos').insert({
    titulo: titulo.slice(0, 140), descricao: txt(f, 'descricao').slice(0, 400) || null, pdf_path: pdf, nome_arquivo: txt(f, 'pdf_nome') || null,
    ordem: parseInt(txt(f, 'ordem'), 10) || 0, publicado: f.get('publicado') === 'on',
  });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  atualizar();
  return { ok: 'Material salvo.' };
}

export async function alternarMaterialGratuito(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('materiais_gratuitos').update({ publicado: txt(f, 'publicar') === 'sim' }).eq('id', txt(f, 'id'));
  atualizar();
}

export async function excluirMaterialGratuito(f: FormData): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.from('materiais_gratuitos').select('pdf_path').eq('id', txt(f, 'id')).maybeSingle();
  await supabase.from('materiais_gratuitos').delete().eq('id', txt(f, 'id'));
  if (data?.pdf_path) await supabase.storage.from('produtos-pdf').remove([data.pdf_path as string]);
  atualizar();
}
