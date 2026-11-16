'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  distribuir, estruturaEdital, hojeBr, INTERVALOS_PADRAO, ordenarCiclo, proximoPermitido, somarDias, valido,
} from '@/lib/cronograma';

export type Res = { ok?: string; erro?: string };
const UUID = /^[0-9a-f-]{36}$/i;

async function quem() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, id: user?.id ?? null };
}

const inteiros = (vals: FormDataEntryValue[], min: number, max: number) =>
  [...new Set(vals.map((v) => parseInt(String(v), 10)).filter((n) => Number.isInteger(n) && n >= min && n <= max))].sort((a, b) => a - b);

// "disciplina::chave" → partes (chave vazia = só a disciplina)
function conteudoDe(v: FormDataEntryValue | null) {
  const [disciplina, chave = ''] = String(v ?? '').split('::');
  return { disciplina: disciplina.trim(), chave: chave.trim() };
}

async function nomeAssunto(supabase: Awaited<ReturnType<typeof createClient>>, chave: string) {
  if (!UUID.test(chave)) return null;
  const { data } = await supabase.from('assuntos').select('nome').eq('id', chave).maybeSingle();
  return (data as { nome: string } | null)?.nome ?? null;
}

// (re)programa os conteúdos ainda não concluídos a partir de um dia
async function programar(supabase: Awaited<ReturnType<typeof createClient>>, aluno: string, edital: string, inicio: string, blocos: number, dias: number[]) {
  const [estrutura, { data: prog }] = await Promise.all([
    estruturaEdital(supabase, edital),
    supabase.from('conteudos_progresso').select('disciplina, chave, teoria').eq('aluno_id', aluno).eq('edital_id', edital),
  ]);
  const feitos = new Set(((prog ?? []) as { disciplina: string; chave: string; teoria: boolean }[]).filter((p) => p.teoria).map((p) => `${p.disciplina}::${p.chave}`));
  const ciclo = ordenarCiclo(estrutura.map((d) => ({ nome: d.nome, questoes: d.questoes, pendentes: d.folhas.filter((c) => !feitos.has(`${c.disciplina}::${c.chave}`)) })));
  const itens = distribuir(ciclo, inicio, blocos, dias);
  // apaga a programação dos pendentes (os concluídos ficam no calendário, no dia em que estavam)
  const { data: atuais } = await supabase.from('cronograma_itens').select('disciplina, chave').eq('aluno_id', aluno).eq('edital_id', edital);
  const pendentesAtuais = ((atuais ?? []) as { disciplina: string; chave: string }[]).filter((x) => !feitos.has(`${x.disciplina}::${x.chave}`));
  for (const d of new Set(pendentesAtuais.map((x) => x.disciplina))) {
    const chaves = pendentesAtuais.filter((x) => x.disciplina === d).map((x) => x.chave);
    for (let i = 0; i < chaves.length; i += 200) {
      await supabase.from('cronograma_itens').delete().eq('aluno_id', aluno).eq('edital_id', edital).eq('disciplina', d).in('chave', chaves.slice(i, i + 200));
    }
  }
  const linhas = itens.map((x) => ({ ...x, aluno_id: aluno, edital_id: edital }));
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await supabase.from('cronograma_itens').upsert(linhas.slice(i, i + 500), { onConflict: 'aluno_id,edital_id,disciplina,chave' });
    if (error) return 'Não foi possível montar o cronograma: ' + error.message;
  }
  return null;
}

// Cria (ou refaz) o cronograma do edital
export async function salvarCronograma(_: Res, f: FormData): Promise<Res> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Entre na sua conta para continuar.' };
  const edital = String(f.get('edital') ?? '');
  if (!UUID.test(edital)) return { erro: 'Escolha o edital.' };
  const blocos = Math.min(8, Math.max(1, parseInt(String(f.get('blocos') ?? '2'), 10) || 2));
  const dias = inteiros(f.getAll('dias'), 0, 6);
  if (!dias.length) return { erro: 'Marque pelo menos um dia da semana.' };
  const intervalos = inteiros(f.getAll('intervalos'), 1, 365).slice(0, 6);
  const inicioCampo = String(f.get('inicio') ?? '');
  const inicio = valido(inicioCampo) && inicioCampo >= hojeBr() ? inicioCampo : hojeBr();

  const { error } = await supabase.from('cronogramas').upsert({
    aluno_id: id, edital_id: edital, inicio, blocos_por_dia: blocos, dias_semana: dias,
    intervalos: intervalos.length ? intervalos : [1, 7, 14, 30], atualizado_em: new Date().toISOString(),
  }, { onConflict: 'aluno_id,edital_id' });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  await supabase.from('perfis').update({ edital_id: edital }).eq('id', id);
  const erro = await programar(supabase, id, edital, inicio, blocos, dias);
  if (erro) return { erro };
  revalidatePath('/aluno', 'layout');
  redirect('/aluno/cronograma');
}

// Reprograma os conteúdos atrasados e os próximos a partir de hoje
export async function replanejar(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const edital = String(f.get('edital') ?? '');
  if (!id || !UUID.test(edital)) return;
  const { data } = await supabase.from('cronogramas').select('blocos_por_dia, dias_semana').eq('aluno_id', id).eq('edital_id', edital).maybeSingle();
  const cfg = data as { blocos_por_dia: number; dias_semana: number[] } | null;
  if (!cfg) return;
  await supabase.from('cronogramas').update({ inicio: hojeBr(), atualizado_em: new Date().toISOString() }).eq('aluno_id', id).eq('edital_id', edital);
  await programar(supabase, id, edital, hojeBr(), cfg.blocos_por_dia, cfg.dias_semana);
  revalidatePath('/aluno/cronograma');
}

// Registrar estudo (o quadro "Registrar estudo")
export async function registrarEstudo(_: Res, f: FormData): Promise<Res> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Entre na sua conta para continuar.' };
  const editalCampo = String(f.get('edital') ?? '');
  const edital = UUID.test(editalCampo) ? editalCampo : null;
  const { disciplina, chave } = conteudoDe(f.get('conteudo'));
  if (!disciplina) return { erro: 'Escolha a disciplina.' };
  const horas = Math.max(0, parseInt(String(f.get('horas') ?? '0'), 10) || 0);
  const mins = Math.max(0, parseInt(String(f.get('minutos') ?? '0'), 10) || 0);
  const minutos = horas * 60 + mins;
  if (minutos > 1440) return { erro: 'O tempo passa de 24 horas.' };
  const dia = String(f.get('dia') ?? '');
  if (!valido(dia) || dia > hojeBr()) return { erro: 'Escolha uma data até hoje.' };
  const tipoCampo = String(f.get('tipo') ?? 'misto');
  const tipo = ['teoria', 'questoes', 'revisao', 'leitura', 'misto'].includes(tipoCampo) ? tipoCampo : 'misto';
  const finalizou = f.get('situacao') === 'finalizei';
  if (minutos === 0 && !finalizou) return { erro: 'Informe quanto tempo você estudou.' };
  const obs = String(f.get('observacoes') ?? '').trim().slice(0, 1000) || null;
  const assunto_nome = await nomeAssunto(supabase, chave);
  const conteudo = { disciplina, chave: chave || null, assunto_id: UUID.test(chave) ? chave : null, assunto_nome };

  const { error } = await supabase.from('estudos').insert({ aluno_id: id, edital_id: edital, ...conteudo, dia, minutos, tipo, observacoes: obs });
  if (error) return { erro: 'Não foi possível registrar: ' + error.message };
  if (minutos > 0) await supabase.rpc('ajustar_minutos_dia', { p_dia: dia, p_minutos: minutos });

  if (finalizou && edital && chave) {
    await supabase.from('conteudos_progresso').upsert({
      aluno_id: id, edital_id: edital, disciplina, chave, assunto_id: conteudo.assunto_id, teoria: true, atualizado_em: new Date().toISOString(),
    }, { onConflict: 'aluno_id,edital_id,disciplina,chave' });
  }

  // estudou uma revisão: dá baixa na revisão pendente mais antiga deste conteúdo
  if (tipo === 'revisao' && chave) {
    const { data: pend } = await supabase.from('revisoes').select('id').eq('aluno_id', id).eq('disciplina', disciplina).eq('chave', chave)
      .is('feita_em', null).lte('dia', hojeBr()).order('dia').limit(1);
    const r = (pend ?? [])[0] as { id: number } | undefined;
    if (r) await supabase.from('revisoes').update({ feita_em: new Date().toISOString() }).eq('id', r.id).eq('aluno_id', id);
  }

  if (f.get('gerar') === 'on' && chave) {
    const intervalos = inteiros(f.getAll('intervalos'), 1, 365).filter((n) => INTERVALOS_PADRAO.includes(n)).slice(0, 6);
    const dias = inteiros(f.getAll('dias_rev'), 0, 6);
    if (intervalos.length) {
      // o ciclo de revisões recomeça: as pendentes deste conteúdo dão lugar às novas
      await supabase.from('revisoes').delete().eq('aluno_id', id).eq('disciplina', disciplina).eq('chave', chave).is('feita_em', null).gt('dia', dia);
      const novas = intervalos.map((n, i) => ({
        aluno_id: id, edital_id: edital, ...conteudo, numero: i + 1, dia: proximoPermitido(somarDias(dia, n), dias),
      }));
      const r = await supabase.from('revisoes').insert(novas);
      if (r.error) return { erro: 'Estudo registrado, mas as revisões não foram criadas: ' + r.error.message };
    }
  }
  revalidatePath('/aluno/cronograma');
  return { ok: 'Estudo registrado.' };
}

// Marcar/desmarcar teoria ou revisão no edital verticalizado (chamado pelo navegador)
export async function marcarConteudo(edital: string, disciplina: string, chave: string, campo: 'teoria' | number, valor: boolean): Promise<Res> {
  const { supabase, id } = await quem();
  if (!id || !UUID.test(edital) || !disciplina || !chave) return { erro: 'Não foi possível marcar.' };
  const { data } = await supabase.from('conteudos_progresso').select('teoria, revisoes').eq('aluno_id', id).eq('edital_id', edital)
    .eq('disciplina', disciplina).eq('chave', chave).maybeSingle();
  const atual = (data as { teoria: boolean; revisoes: boolean[] } | null) ?? { teoria: false, revisoes: [false, false, false, false, false, false] };
  const revisoes = [...atual.revisoes, false, false, false, false, false, false].slice(0, 6);
  if (typeof campo === 'number') {
    if (campo < 0 || campo > 5) return { erro: 'Revisão inválida.' };
    revisoes[campo] = valor;
  }
  const { error } = await supabase.from('conteudos_progresso').upsert({
    aluno_id: id, edital_id: edital, disciplina, chave, assunto_id: UUID.test(chave) ? chave : null,
    teoria: campo === 'teoria' ? valor : atual.teoria, revisoes, atualizado_em: new Date().toISOString(),
  }, { onConflict: 'aluno_id,edital_id,disciplina,chave' });
  if (error) return { erro: 'Não foi possível marcar: ' + error.message };
  revalidatePath('/aluno/cronograma');
  return { ok: 'ok' };
}

// Concluir (ou reabrir) uma revisão
export async function concluirRevisao(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const rid = parseInt(String(f.get('id') ?? ''), 10);
  if (!id || !Number.isInteger(rid)) return;
  const feita = f.get('feita') !== 'nao';
  const { data } = await supabase.from('revisoes').update({ feita_em: feita ? new Date().toISOString() : null }).eq('id', rid).eq('aluno_id', id)
    .select('edital_id, disciplina, chave, numero').maybeSingle();
  const r = data as { edital_id: string | null; disciplina: string; chave: string | null; numero: number | null } | null;
  if (r?.edital_id && r.chave && r.numero) await marcarConteudo(r.edital_id, r.disciplina, r.chave, r.numero - 1, feita);
  revalidatePath('/aluno/cronograma');
}

// Nova revisão, criada à mão
export async function novaRevisao(_: Res, f: FormData): Promise<Res> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Entre na sua conta para continuar.' };
  const editalCampo = String(f.get('edital') ?? '');
  const { disciplina, chave } = conteudoDe(f.get('conteudo'));
  if (!disciplina) return { erro: 'Escolha a disciplina.' };
  const dia = String(f.get('dia') ?? '');
  if (!valido(dia)) return { erro: 'Escolha a data da revisão.' };
  const { error } = await supabase.from('revisoes').insert({
    aluno_id: id, edital_id: UUID.test(editalCampo) ? editalCampo : null, disciplina, chave: chave || null,
    assunto_id: UUID.test(chave) ? chave : null, assunto_nome: await nomeAssunto(supabase, chave), dia,
  });
  if (error) return { erro: 'Não foi possível criar: ' + error.message };
  revalidatePath('/aluno/cronograma');
  return { ok: 'Revisão agendada.' };
}

export async function apagarRevisao(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const rid = parseInt(String(f.get('id') ?? ''), 10);
  if (!id || !Number.isInteger(rid)) return;
  await supabase.from('revisoes').delete().eq('id', rid).eq('aluno_id', id);
  revalidatePath('/aluno/cronograma');
}

export async function apagarEstudo(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const eid = parseInt(String(f.get('id') ?? ''), 10);
  if (!id || !Number.isInteger(eid)) return;
  const { data } = await supabase.from('estudos').delete().eq('id', eid).eq('aluno_id', id).select('dia, minutos').maybeSingle();
  const e = data as { dia: string; minutos: number } | null;
  if (e && e.minutos > 0) await supabase.rpc('ajustar_minutos_dia', { p_dia: e.dia, p_minutos: -e.minutos });
  revalidatePath('/aluno/cronograma');
}
