'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { atualizarNoticias } from '@/lib/noticiasConcursos';

const CARREIRAS = ['federais', 'civis', 'militares', 'guardas'];
const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

// só o professor passa daqui (as políticas do banco também exigem)
async function exigirProfessor() {
  const supabase = await createClient();
  const { data: ok } = await supabase.rpc('eh_professor');
  if (!ok) redirect('/entrar');
  return supabase;
}
const atualizar = () => { revalidatePath('/noticias', 'layout'); revalidatePath('/professor/noticias-concurso'); };

export async function buscarNoticiasAgora(): Promise<void> {
  await exigirProfessor();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY; const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!chave || !url) redirect('/professor/noticias-concurso?r=' + encodeURIComponent('Falta a variável SUPABASE_SERVICE_ROLE_KEY na Vercel.'));
  const r = await atualizarNoticias(createAdmin(url!, chave!, { auth: { persistSession: false } }));
  atualizar();
  const total = Object.values(r.novas).reduce((a, b) => a + b, 0);
  redirect('/professor/noticias-concurso?r=' + encodeURIComponent(`Busca feita: ${total} notícia(s) nova(s).` + (r.erros.length ? ` Avisos: ${r.erros.join('; ')}` : '')));
}

export async function ocultarNoticiaConcurso(f: FormData): Promise<void> {
  const supabase = await exigirProfessor();
  await supabase.from('noticias_concursos').update({ oculta: txt(f, 'oculta') === 'sim' }).eq('id', txt(f, 'id'));
  atualizar();
}

export async function excluirNoticiaConcurso(f: FormData): Promise<void> {
  const supabase = await exigirProfessor();
  await supabase.from('noticias_concursos').delete().eq('id', txt(f, 'id'));
  atualizar();
}

export async function adicionarNoticiaConcurso(f: FormData): Promise<void> {
  const supabase = await exigirProfessor();
  const url = txt(f, 'url'); const titulo = txt(f, 'titulo').slice(0, 200); const carreira = txt(f, 'carreira');
  if (!/^https?:\/\//.test(url) || titulo.length < 5 || !CARREIRAS.includes(carreira)) redirect('/professor/noticias-concurso?r=' + encodeURIComponent('Confira título, carreira e o link (https://…).'));
  const { error } = await supabase.from('noticias_concursos').insert({ carreira, titulo, url, fonte: txt(f, 'fonte').slice(0, 60) || null, origem: 'manual' });
  atualizar();
  redirect('/professor/noticias-concurso?r=' + encodeURIComponent(error ? 'Não foi possível salvar (link repetido?).' : 'Notícia acrescentada.'));
}
