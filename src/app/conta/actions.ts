'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ResConta = { ok?: string; erro?: string; link?: string };

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

// ---------- Apelido e ranking ----------
const APELIDO = /^[\p{L}\p{N}_.-]{3,20}$/u;

export async function participarRanking(_: ResConta, f: FormData): Promise<ResConta> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: 'Faça login de novo.' };
  const apelido = txt(f, 'apelido');
  const participar = f.get('participar') !== 'nao';

  const mudanca: Record<string, unknown> = { participa_ranking: participar };
  if (apelido) {
    if (!APELIDO.test(apelido)) return { erro: 'O apelido precisa ter de 3 a 20 letras ou números, sem espaços.' };
    mudanca.apelido = apelido;
  }
  const { error } = await supabase.from('perfis').update(mudanca).eq('id', user.id);
  if (error) {
    if (error.code === '23505') return { erro: 'Esse apelido já está em uso. Escolha outro.' };
    return { erro: 'Não foi possível salvar: ' + error.message };
  }
  revalidatePath('/aluno', 'layout');
  return { ok: participar ? 'Pronto, você está no ranking.' : 'Você saiu do ranking.' };
}

// ---------- Excluir a própria conta ----------
export async function excluirConta(_: ResConta, f: FormData): Promise<ResConta> {
  if (txt(f, 'confirmacao').toUpperCase() !== 'EXCLUIR') return { erro: 'Digite EXCLUIR para confirmar.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: 'Faça login de novo.' };

  // confirma que é a própria pessoa
  const { error: errSenha } = await supabase.auth.signInWithPassword({ email: user.email, password: String(f.get('senha') ?? '') });
  if (errSenha) return { erro: 'Senha incorreta.' };

  const { error } = await supabase.rpc('excluir_minha_conta');
  if (error) return { erro: error.message };

  try { await supabase.auth.signOut(); } catch { /* a conta já não existe */ }
  const jar = await cookies();
  jar.getAll().filter((c) => c.name.startsWith('sb-')).forEach((c) => jar.delete(c.name));
  redirect('/conta-excluida');
}
