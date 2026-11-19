import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '@/lib/supabase/env';
import type { ImagemAssunto } from '@/lib/noticiasConcursos';

export const urlImagemNoticia = (caminho: string | null | undefined) => caminho ? (caminho.startsWith('/') ? caminho : `${SUPABASE_URL}/storage/v1/object/public/vitrine/${caminho}`) : null;

export async function carregarImagensAssunto(supabase: SupabaseClient): Promise<ImagemAssunto[]> {
  const { data } = await supabase.from('noticias_imagens').select('palavras, carreira, imagem_path');
  return (data ?? []) as ImagemAssunto[];
}
