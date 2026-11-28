import type { SupabaseClient } from '@supabase/supabase-js';

// Caminho válido de arquivo de redação: <id do aluno>/<data>-<nome>.(pdf|jpg|png)
export const caminhoRedacaoValido = (alunoId: string, caminho: string) =>
  caminho.startsWith(`${alunoId}/`) && /^[0-9a-f-]{36}\/\d{10,16}-[a-z0-9._-]{1,80}\.(pdf|jpg|png)$/.test(caminho);

export const ehPdf = (caminho: string) => /\.pdf$/i.test(caminho);

// Link temporário (1 hora) para ver o arquivo; a leitura respeita as regras do bucket (dono ou professor)
export async function linkArquivoRedacao(supabase: SupabaseClient, caminho: string | null): Promise<string | null> {
  if (!caminho) return null;
  const { data } = await supabase.storage.from('redacoes').createSignedUrl(caminho, 3600);
  return data?.signedUrl ?? null;
}
