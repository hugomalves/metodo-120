'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { atualizarNoticias, resumirPendentes } from '@/lib/noticiasConcursos';

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

export async function escreverResumosAgora(): Promise<void> {
  await exigirProfessor();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY; const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!chave || !url) redirect('/professor/noticias-concurso?r=' + encodeURIComponent('Falta a variável SUPABASE_SERVICE_ROLE_KEY na Vercel.'));
  const r = await resumirPendentes(createAdmin(url!, chave!, { auth: { persistSession: false } }));
  atualizar();
  redirect('/professor/noticias-concurso?r=' + encodeURIComponent(r.aviso ?? `${r.feitos} resumo(s) escrito(s).`));
}

export async function salvarTextoNoticia(f: FormData): Promise<void> {
  const supabase = await exigirProfessor();
  await supabase.from('noticias_concursos').update({ resumo: txt(f, 'resumo').slice(0, 220) || null, texto: txt(f, 'texto').slice(0, 1200) || null }).eq('id', txt(f, 'id'));
  atualizar();
}

export async function salvarImagemNoticia(_: { ok?: string; erro?: string }, f: FormData): Promise<{ ok?: string; erro?: string }> {
  const supabase = await exigirProfessor();
  const rotulo = txt(f, 'rotulo'); const caminho = txt(f, 'imagem_path');
  const palavras = txt(f, 'palavras').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
  const carreira = CARREIRAS.includes(txt(f, 'carreira')) ? txt(f, 'carreira') : null;
  if (rotulo.length < 2) return { erro: 'Dê um nome à imagem (ex.: PRF).' };
  if (!caminho) return { erro: 'Escolha a imagem e espere o aviso "Imagem enviada".' };
  if (!palavras.length && !carreira) return { erro: 'Informe as palavras do título (ex.: PRF, Rodoviária Federal) ou escolha o quadrado para ser a imagem padrão dele.' };
  const { error } = await supabase.from('noticias_imagens').insert({ rotulo: rotulo.slice(0, 60), palavras, carreira, imagem_path: caminho });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  atualizar();
  return { ok: 'Imagem salva. Vale para as notícias novas e antigas.' };
}

export async function excluirImagemNoticia(f: FormData): Promise<void> {
  const supabase = await exigirProfessor();
  await supabase.from('noticias_imagens').delete().eq('id', txt(f, 'id'));
  atualizar();
}
