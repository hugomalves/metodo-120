import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Perfil = {
  id: string;
  papel: 'aluno' | 'professor';
  nome: string;
  apelido: string | null;
  ano_nascimento: number | null;
  trilha: 'gabaritar' | 'ir_bem' | null;
  turma_id: string | null;
  onboarding_ok: boolean;
  edital_id?: string | null;
  participa_ranking?: boolean;
};

// Busca quem está logado; sem login, manda para /entrar (uma vez por página)
export const exigirLogin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single<Perfil>();
  if (!perfil) redirect('/entrar');

  return { supabase, user, perfil };
});

// Leva cada tipo de usuário para a sua área
export function areaDe(perfil: Perfil): string {
  if (perfil.papel === 'professor') return '/professor';
  return perfil.onboarding_ok ? '/aluno' : '/boas-vindas';
}
