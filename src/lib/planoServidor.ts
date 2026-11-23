import type { SupabaseClient } from '@supabase/supabase-js';
import { CURSO, type ConfigPlano, type ItemPlano } from '@/lib/planoCurso';

// Carrega tudo o que o cronograma personalizado precisa (usado no Início e na página do cronograma)
export async function carregarPlano(supabase: SupabaseClient, alunoId: string) {
  const { data: tem } = await supabase.rpc('tem_curso', { p_slug: CURSO });
  if (!tem) return null;
  const [{ data: its }, { data: cfgRaw }, { data: fts }, { data: pdfs }] = await Promise.all([
    supabase.from('plano_curso_itens').select('codigo, seq, tipo, sigla, disciplina, titulo, subtitulo, minutos, pdf, caderno, aula, ciclo, extra').eq('produto_slug', CURSO).order('seq'),
    supabase.from('planos_aluno').select('inicio, minutos_dia, dias_semana').eq('aluno_id', alunoId).eq('produto_slug', CURSO).maybeSingle(),
    supabase.from('plano_feitos').select('codigo, dia').eq('aluno_id', alunoId).eq('produto_slug', CURSO),
    supabase.from('pdfs_curso').select('codigo').eq('produto_slug', CURSO),
  ]);
  return {
    itens: (its ?? []) as ItemPlano[],
    cfg: cfgRaw as ConfigPlano | null,
    feitos: new Map(((fts ?? []) as { codigo: string; dia: string }[]).map((x) => [x.codigo, x.dia])),
    temPdf: new Set(((pdfs ?? []) as { codigo: string }[]).map((x) => x.codigo)),
  };
}
export type DadosPlano = NonNullable<Awaited<ReturnType<typeof carregarPlano>>>;
