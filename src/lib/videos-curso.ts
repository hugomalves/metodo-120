import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '@/lib/supabase/env';

// Os três vídeos curtos (iguais para todos os cursos) da página de cada curso.
// O arquivo fica no bucket público 'vitrine' (pasta videos/) e o caminho em 'configuracoes'.
export const VIDEOS_CURSO = [
  { chave: 'video_curso_pdf', rotulo: 'PDF', titulo: 'PDF detalhado', texto: 'Teoria completa com questões em cada aula, para estudar e revisar.', ajuda: 'Gravação da tela rolando um PDF de aula.' },
  { chave: 'video_curso_banco', rotulo: 'Questões', titulo: 'Banco de questões focado na banca', texto: 'Questões no estilo da banca do seu concurso, com filtros por disciplina e assunto.', ajuda: 'Gravação da tela passando pelas questões do banco.' },
  { chave: 'video_curso_impressao', rotulo: 'Impressão', titulo: 'Material impresso ilimitado', texto: 'Imprima as listas de questões quantas vezes quiser.', ajuda: 'Vídeo da impressora imprimindo uma lista.' },
] as const;

export const urlVideoCurso = (caminho: string | null | undefined) =>
  caminho ? `${SUPABASE_URL}/storage/v1/object/public/vitrine/${caminho}` : null;

// caminho de cada vídeo cadastrado (vazio = ainda não enviado)
export async function carregarVideosCurso(supabase: SupabaseClient): Promise<Record<string, string | null>> {
  const saida: Record<string, string | null> = Object.fromEntries(VIDEOS_CURSO.map((v) => [v.chave, null]));
  try {
    const { data } = await supabase.from('configuracoes').select('chave, valor').in('chave', VIDEOS_CURSO.map((v) => v.chave));
    for (const l of (data ?? []) as { chave: string; valor: unknown }[]) {
      if (typeof l.valor === 'string' && l.valor) saida[l.chave] = l.valor;
    }
  } catch { /* sem conexão: página sem vídeos */ }
  return saida;
}
