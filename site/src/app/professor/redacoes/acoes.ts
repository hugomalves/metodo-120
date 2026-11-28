'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MOTIVOS_ZERO } from '@/lib/redacao';
import { corrigirTexto, preCorrigir, type PreCorrecao } from '@/lib/redacaoIA';
import type { Resultado } from '../actions';

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const ehId = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

async function professor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false };
  const { data } = await supabase.from('perfis').select('papel').eq('id', user.id).maybeSingle();
  return { supabase, ok: data?.papel === 'professor' };
}

function atualizar(id?: string) {
  revalidatePath('/professor/redacoes');
  if (id) revalidatePath(`/professor/redacoes/${id}`);
  revalidatePath('/aluno/redacao', 'layout');
}

// ---------- Correção (4 critérios de 0 a 10, ou zerada com motivo) ----------
export async function corrigirRedacao(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, ok } = await professor();
  if (!ok) return { erro: 'Só o professor pode corrigir.' };
  const id = txt(f, 'id');
  if (!ehId(id)) return { erro: 'Redação inválida.' };
  const zerada = f.get('zerada') === 'on';
  const motivo = txt(f, 'motivo_zero').slice(0, 300);
  if (zerada && !motivo) return { erro: 'Escolha o motivo da nota zero.' };
  if (zerada && !(MOTIVOS_ZERO as readonly string[]).includes(motivo) && motivo.length < 5) return { erro: 'Explique o motivo da nota zero.' };
  const notas = [1, 2, 3, 4].map((i) => parseInt(txt(f, 'c' + i), 10));
  if (!zerada && notas.some((n) => !Number.isInteger(n) || n < 0 || n > 10)) return { erro: 'Cada critério vale de 0 a 10.' };
  const comentarios = Object.fromEntries([1, 2, 3, 4].map((i) => ['c' + i, txt(f, 'com' + i).slice(0, 1200)]).filter(([, v]) => v));
  const [c1, c2, c3, c4] = zerada ? [0, 0, 0, 0] : notas;
  const { error } = await supabase.from('redacoes').update({
    c1, c2, c3, c4, nota: c1 + c2 + c3 + c4, zerada, motivo_zero: zerada ? motivo : null,
    pontos_fortes: txt(f, 'pontos_fortes').slice(0, 2000) || null, pontos_melhorar: txt(f, 'pontos_melhorar').slice(0, 2000) || null,
    comentarios, status: 'corrigida', corrigida_em: new Date().toISOString(),
  }).eq('id', id);
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  atualizar(id);
  return { ok: 'Correção enviada ao aluno.' };
}

// ---------- Pré-correção por IA ----------
export async function gerarPreCorrecao(_: Resultado, f: FormData): Promise<Resultado> {
  const { ok } = await professor();
  if (!ok) return { erro: 'Só o professor pode pedir a pré-correção.' };
  const id = txt(f, 'id');
  if (!ehId(id)) return { erro: 'Redação inválida.' };
  const r = await preCorrigir(id);
  atualizar(id);
  return r.ok ? { ok: 'Pré-correção pronta. O formulário foi preenchido com ela: revise antes de enviar.' } : { erro: 'A IA não conseguiu corrigir: ' + r.erro };
}

// ---------- Limite de redações por mês ----------
export async function salvarLimite(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, ok } = await professor();
  if (!ok) return { erro: 'Só o professor pode mudar o limite.' };
  const n = parseInt(txt(f, 'limite'), 10);
  if (!Number.isInteger(n) || n < 1 || n > 60) return { erro: 'Escolha um número de 1 a 60.' };
  const { error } = await supabase.from('configuracoes').upsert({ chave: 'redacoes_por_mes', valor: n, atualizado_em: new Date().toISOString() });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  atualizar();
  return { ok: `Pronto: cada aluno pode enviar ${n} redações por mês.` };
}

// ---------- Redações-modelo ----------
export async function salvarModelo(_: Resultado, f: FormData): Promise<Resultado> {
  const { supabase, ok } = await professor();
  if (!ok) return { erro: 'Só o professor pode fazer isso.' };
  const tema = txt(f, 'tema'), texto = txt(f, 'texto').replace(/\r/g, '');
  if (tema.length < 3 || texto.length < 100) return { erro: 'Preencha o tema e o texto da redação.' };
  const nota = txt(f, 'nota') ? parseInt(txt(f, 'nota'), 10) : null;
  if (nota !== null && (!Number.isInteger(nota) || nota < 0 || nota > 40)) return { erro: 'A nota vai de 0 a 40.' };
  const linha = {
    tema: tema.slice(0, 200), texto: texto.slice(0, 6000), nota, comentario: txt(f, 'comentario').slice(0, 2000) || null,
    publicada: f.get('publicada') === 'on', ordem: parseInt(txt(f, 'ordem'), 10) || 0,
  };
  const id = txt(f, 'id');
  const { error } = id && ehId(id) ? await supabase.from('redacoes_exemplares').update(linha).eq('id', id) : await supabase.from('redacoes_exemplares').insert(linha);
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/redacoes/modelos');
  revalidatePath('/aluno/redacao/modelos');
  return { ok: id ? 'Redação-modelo atualizada.' : 'Redação-modelo salva.' };
}

export async function alternarModelo(f: FormData): Promise<void> {
  const { supabase, ok } = await professor();
  if (!ok) return;
  const id = txt(f, 'id');
  if (!ehId(id)) return;
  if (txt(f, 'acao') === 'apagar') await supabase.from('redacoes_exemplares').delete().eq('id', id);
  else await supabase.from('redacoes_exemplares').update({ publicada: txt(f, 'publicar') === 'sim' }).eq('id', id);
  revalidatePath('/professor/redacoes/modelos');
  revalidatePath('/aluno/redacao/modelos');
}

// ---------- Testar a IA (nada é salvo) ----------
export type ResTeste = { erro?: string; resultado?: PreCorrecao & { modelo: string; segundos: number } };
export async function testarIA(_: ResTeste, f: FormData): Promise<ResTeste> {
  const { ok } = await professor();
  if (!ok) return { erro: 'Só o professor pode testar a IA.' };
  const tema = txt(f, 'tema'), texto = txt(f, 'texto');
  if (tema.length < 3) return { erro: 'Escreva o tema.' };
  if (texto.length < 200 || texto.length > 6000) return { erro: 'Cole o texto completo da redação (de 200 a 6000 caracteres).' };
  const ini = Date.now();
  try {
    const { correcao, modelo } = await corrigirTexto(tema, texto);
    return { resultado: { ...correcao, modelo, segundos: Math.round((Date.now() - ini) / 1000) } };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'A IA não respondeu.' };
  }
}
