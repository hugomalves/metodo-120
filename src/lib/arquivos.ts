import type { SupabaseClient } from '@supabase/supabase-js';

// Link temporário (1 hora) para um arquivo do bucket privado; null se a pessoa não tiver permissão
export async function linkPdf(supabase: SupabaseClient, caminho: string | null): Promise<string | null> {
  if (!caminho) return null;
  const { data, error } = await supabase.storage.from('materiais').createSignedUrl(caminho, 3600);
  return error ? null : data.signedUrl;
}

export const linkArquivo = linkPdf;
