import type { SupabaseClient } from '@supabase/supabase-js';

// Links temporários (1 hora) das capas enviadas pelo professor; caminho → link
export async function linksCapas(supabase: SupabaseClient, caminhos: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(caminhos.filter((c): c is string => !!c)));
  if (!unicos.length) return new Map();
  const { data } = await supabase.storage.from('materiais').createSignedUrls(unicos, 3600);
  const itens = (data ?? []) as { path: string | null; signedUrl: string }[];
  return new Map(itens.filter((d) => d.path && d.signedUrl).map((d) => [d.path as string, d.signedUrl]));
}

export const doisDigitos = (n: number) => String(n).padStart(2, '0');

// Número grande da capa de um simulado: a semana, ou o último número do código (ex.: SC-03 → 03)
export function destaqueSimulado(codigo: string, semana: number | null | undefined): string {
  if (semana) return doisDigitos(semana);
  const m = codigo.match(/(\d+)(?!.*\d)/);
  return m ? doisDigitos(Number(m[1]) % 1000) : '';
}
