import type { SupabaseClient } from '@supabase/supabase-js';
import type { Perfil } from '@/lib/sessao';

export type AulaT = {
  id: string; numero: number; tipo: 'aula' | 'revisao'; titulo: string; video_url: string | null;
  pdf_path: string | null; habilidades: string[]; trilha: 'ambas' | 'gabaritar' | 'ir_bem'; duracao_min: number;
  concluida: boolean;
};
export type ModuloT = { id: string; numero: number; titulo: string; extra: boolean; disciplina: string | null; capa_path?: string | null; aulas: AulaT[] };

export type Trilha = {
  modulos: ModuloT[];
  total: number;
  concluidas: number;
  proxima: { aula: AulaT; modulo: ModuloT } | null;
};

// Módulos e aulas publicadas, com o que o aluno já concluiu
export async function carregarTrilha(supabase: SupabaseClient, perfil: Perfil): Promise<Trilha> {
  const [{ data: mods }, { data: feitas }] = await Promise.all([
    supabase
      .from('modulos')
      .select('*, aulas(id, numero, tipo, titulo, video_url, pdf_path, habilidades, trilha, duracao_min)')
      .order('numero')
      .order('numero', { referencedTable: 'aulas' }),
    supabase.from('progresso_aulas').select('aula_id').eq('aluno_id', perfil.id),
  ]);
  const ok = new Set(((feitas ?? []) as { aula_id: string }[]).map((f) => f.aula_id));

  type Bruto = Omit<ModuloT, 'aulas'> & { aulas: Omit<AulaT, 'concluida'>[] };
  const modulos: ModuloT[] = ((mods ?? []) as Bruto[])
    .map((m) => ({ ...m, aulas: m.aulas.map((a) => ({ ...a, concluida: ok.has(a.id) })) }));

  let proxima: Trilha['proxima'] = null;
  for (const m of modulos) {
    const a = m.aulas.find((x) => !x.concluida);
    if (a) { proxima = { aula: a, modulo: m }; break; }
  }
  const total = modulos.reduce((s, m) => s + m.aulas.length, 0);
  const concluidas = modulos.reduce((s, m) => s + m.aulas.filter((a) => a.concluida).length, 0);
  return { modulos, total, concluidas, proxima };
}

export const rotuloAula = (a: Pick<AulaT, 'tipo' | 'numero'>) => (a.tipo === 'revisao' ? 'Revisão' : `Aula ${a.numero}`);
