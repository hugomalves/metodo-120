'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const COD = /^[A-Z]{2}-(AULA\d{2}|PROP\d)(-B\d+)?$/;

// registra no site os PDFs que o navegador acabou de enviar para o Storage
export async function registrarPdfs(lista: { codigo: string; caminho: string; bytes: number; nome: string }[]): Promise<{ ok: number; erro?: string }> {
  const supabase = await createClient();
  const { data: prof } = await supabase.rpc('eh_professor');
  if (!prof) return { ok: 0, erro: 'Só o professor pode enviar.' };
  const linhas = lista.filter((x) => COD.test(x.codigo) && x.caminho.startsWith('curso/reta-final-pmpe/')).slice(0, 500)
    .map((x) => ({ produto_slug: 'reta-final-pmpe', codigo: x.codigo, caminho: x.caminho, bytes: Math.round(x.bytes), nome_arquivo: x.nome.slice(0, 200), enviado_em: new Date().toISOString() }));
  if (!linhas.length) return { ok: 0 };
  const { error } = await supabase.from('pdfs_curso').upsert(linhas);
  if (error) return { ok: 0, erro: error.message };
  revalidatePath('/professor/pdfs-curso');
  revalidatePath('/aluno/cronograma/reta-final');
  return { ok: linhas.length };
}
