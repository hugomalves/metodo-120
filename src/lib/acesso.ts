import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { exigirLogin } from '@/lib/sessao';

// O que a pessoa pode usar:
// • curso    = matrícula ativa num curso (aulas, simulados, dúvidas…)
// • completo = banco de questões sem limite (quem tem curso ou comprou o banco completo)
// • grátis   = conta sem matrícula: banco com limite de questões por dia
export type Acesso = { curso: boolean; completo: boolean; usadasHoje: number; limiteDia: number; listaMax: number };

export const LISTA_MAX_COMPLETO = 60;

export async function lerAcesso(supabase: SupabaseClient): Promise<Acesso> {
  const [{ data: curso }, { data: sit }] = await Promise.all([
    supabase.rpc('tem_matricula_ativa'),
    supabase.rpc('banco_situacao'),
  ]);
  const temCurso = curso === true;
  const s = ((sit ?? []) as { completo: boolean; usadas_hoje: number; limite_dia: number; lista_max: number }[])[0];
  const completo = !!s?.completo || temCurso;
  return { curso: temCurso, completo, usadasHoje: s?.usadas_hoje ?? 0, limiteDia: s?.limite_dia ?? 10, listaMax: completo ? LISTA_MAX_COMPLETO : s?.lista_max ?? 10 };
}

export const acessoAtual = cache(async () => {
  const sessao = await exigirLogin();
  return { ...sessao, acesso: await lerAcesso(sessao.supabase) };
});

// páginas do curso: quem não tem o curso volta para o início
export async function exigirCurso() {
  const s = await acessoAtual();
  if (!s.acesso.curso && s.perfil.papel !== 'professor') redirect('/aluno');
  return s;
}
