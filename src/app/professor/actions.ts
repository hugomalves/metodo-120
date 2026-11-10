'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Resultado = { ok?: string; erro?: string };

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const ouNulo = (v: string) => (v === '' ? null : v);

// ---------- Recado da semana ----------
export async function publicarRecado(_: Resultado, f: FormData): Promise<Resultado> {
  const texto = txt(f, 'texto');
  if (!texto) return { erro: 'Escreva o recado.' };
  if (texto.length > 140) return { erro: 'O recado pode ter até 140 caracteres.' };
  const supabase = await createClient();
  const { error } = await supabase.from('recados').insert({
    texto,
    video_url: ouNulo(txt(f, 'video')),
    turma_id: ouNulo(txt(f, 'turma')),
  });
  if (error) return { erro: 'Não foi possível publicar: ' + error.message };
  revalidatePath('/professor');
  revalidatePath('/aluno');
  return { ok: 'Recado publicado.' };
}

// ---------- Módulos e aulas ----------
export async function salvarModulo(_: Resultado, f: FormData): Promise<Resultado> {
  const numero = parseInt(txt(f, 'numero'), 10);
  const titulo = txt(f, 'titulo');
  if (!numero || numero < 1) return { erro: 'Informe o número do módulo.' };
  if (!titulo) return { erro: 'Informe o título do módulo.' };
  const disciplina = txt(f, 'disciplina');
  const supabase = await createClient();
  if (disciplina) await supabase.from('disciplinas').upsert({ nome: disciplina }, { onConflict: 'nome', ignoreDuplicates: true });
  const { error } = await supabase
    .from('modulos')
    .upsert({ numero, titulo, extra: false, disciplina: disciplina || null }, { onConflict: 'numero' });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/aulas');
  return { ok: `Módulo ${numero} salvo.` };
}

export async function salvarAula(_: Resultado, f: FormData): Promise<Resultado> {
  const modulo_id = txt(f, 'modulo_id');
  const numero = parseInt(txt(f, 'numero'), 10);
  const titulo = txt(f, 'titulo');
  if (!modulo_id) return { erro: 'Escolha o módulo.' };
  if (!numero) return { erro: 'Escolha o número da aula.' };
  if (!titulo) return { erro: 'Informe o título da aula.' };

  const duracao = parseInt(txt(f, 'duracao_min'), 10);
  const linha: Record<string, unknown> = {
    modulo_id,
    numero,
    tipo: txt(f, 'tipo') === 'revisao' ? 'revisao' : 'aula',
    titulo,
    video_url: ouNulo(txt(f, 'video_url')),
    duracao_min: duracao > 0 && duracao <= 240 ? duracao : 30,
    trilha: 'ambas',
    publicada: f.get('publicada') === 'on',
  };
  const pdf = txt(f, 'pdf_path');
  if (pdf) linha.pdf_path = pdf;

  const supabase = await createClient();
  const { error } = await supabase.from('aulas').upsert(linha, { onConflict: 'modulo_id,numero' });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/aulas');
  revalidatePath('/aluno');
  return { ok: linha.publicada ? 'Aula publicada. Ela já aparece para os alunos.' : 'Aula salva como rascunho.' };
}

export async function alternarAula(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('aulas').update({ publicada: f.get('publicar') === 'sim' }).eq('id', txt(f, 'id'));
  revalidatePath('/professor/aulas');
  revalidatePath('/aluno');
}

// ---------- Simulados e gabaritos ----------
export async function salvarSimulado(_: Resultado, f: FormData): Promise<Resultado> {
  const codigo = txt(f, 'codigo').toUpperCase();
  const n = parseInt(txt(f, 'n_questoes'), 10);
  const gabarito = txt(f, 'gabarito').toUpperCase().replace(/\s/g, '');
  const habs = txt(f, 'habilidades').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);

  if (!/^[A-Z0-9-]{3,20}$/.test(codigo)) return { erro: 'Use um código como MS-03-GAB ou SC-02.' };
  if (!n || n < 1 || n > 90) return { erro: 'Informe o número de questões (1 a 90).' };
  if (!/^[A-E]+$/.test(gabarito)) return { erro: 'O gabarito só pode ter as letras A, B, C, D e E.' };
  if (gabarito.length !== n) return { erro: `O gabarito tem ${gabarito.length} letras, mas o simulado tem ${n} questões.` };
  if (habs.length && habs.length !== n) return { erro: `Informe uma disciplina por questão (${n}) ou deixe o campo vazio.` };

  const supabase = await createClient();
  const { data: sim, error } = await supabase
    .from('simulados')
    .insert({
      codigo,
      tipo: txt(f, 'tipo') === 'completo' ? 'completo' : 'mini',
      titulo: ouNulo(txt(f, 'titulo').slice(0, 120)),
      gratuito: f.get('gratuito') === 'on',
      ordem: parseInt(txt(f, 'ordem'), 10) || 0,
      edital_id: /^[0-9a-f-]{36}$/i.test(txt(f, 'edital_id')) ? txt(f, 'edital_id') : null,
      aula_id: /^[0-9a-f-]{36}$/i.test(txt(f, 'aula_id')) ? txt(f, 'aula_id') : null,
      n_questoes: n,
      prova_pdf_path: ouNulo(txt(f, 'prova_pdf_path')),
      gabarito_pdf_path: ouNulo(txt(f, 'gabarito_pdf_path')),
      correcao_video_url: ouNulo(txt(f, 'correcao_video_url')),
      liberado: f.get('liberado') === 'on',
    })
    .select('id')
    .single();
  if (error || !sim) {
    if (error?.code === '23505') return { erro: `Já existe um simulado com o código ${codigo}.` };
    return { erro: 'Não foi possível salvar: ' + (error?.message ?? 'erro desconhecido') };
  }

  const { error: eg } = await supabase
    .from('gabaritos')
    .insert({ simulado_id: sim.id, respostas: gabarito, habilidades: habs });
  if (eg) {
    await supabase.from('simulados').delete().eq('id', sim.id);
    return { erro: 'Não foi possível salvar o gabarito: ' + eg.message };
  }
  revalidatePath('/professor/simulados');
  return { ok: `Simulado ${codigo} salvo${f.get('liberado') === 'on' ? ' e liberado para os alunos' : ''}.` };
}

export async function alternarSimulado(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('simulados').update({ liberado: f.get('liberar') === 'sim' }).eq('id', txt(f, 'id'));
  revalidatePath('/professor/simulados');
}

// ---------- Produtos e turmas ----------
export async function salvarProduto(_: Resultado, f: FormData): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('produtos')
    .update({
      venda_aberta: f.get('venda_aberta') === 'on',
      venda_fecha_em: ouNulo(txt(f, 'venda_fecha_em')),
      checkout_url: ouNulo(txt(f, 'checkout_url')),
      kiwify_product_id: ouNulo(txt(f, 'kiwify_product_id')),
      acesso_ate: ouNulo(txt(f, 'acesso_ate')),
      ...(f.get('tipo') ? { tipo: txt(f, 'tipo') === 'banco' ? 'banco' : 'curso' } : {}),
    })
    .eq('id', txt(f, 'id'));
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/turmas');
  revalidatePath('/');
  return { ok: 'Produto salvo.' };
}

export async function criarTurma(_: Resultado, f: FormData): Promise<Resultado> {
  const nome = txt(f, 'nome');
  const inicio = txt(f, 'inicio');
  if (!nome) return { erro: 'Dê um nome para a turma, como "Turma de abril".' };
  if (!inicio) return { erro: 'Informe a data de início.' };
  const supabase = await createClient();
  const { error } = await supabase.from('turmas').insert({ produto_id: txt(f, 'produto_id'), nome, inicio });
  if (error) return { erro: 'Não foi possível criar: ' + error.message };
  revalidatePath('/professor/turmas');
  return { ok: `${nome} criada.` };
}

// ---------- Alunos ----------
export async function liberarAcesso(_: Resultado, f: FormData): Promise<Resultado> {
  const email = txt(f, 'email');
  if (!email.includes('@')) return { erro: 'Informe o e-mail da conta do aluno.' };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('professor_liberar_acesso', {
    p_email: email,
    p_produto: txt(f, 'produto_id'),
    p_turma: ouNulo(txt(f, 'turma_id')),
  });
  if (error) return { erro: error.message };
  revalidatePath('/professor/alunos');
  return { ok: String(data) };
}

// ---------- Plantão de dúvidas ----------
export async function responderDuvida(_: Resultado, f: FormData): Promise<Resultado> {
  const texto = txt(f, 'texto');
  if (texto.length < 2) return { erro: 'Escreva a resposta.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('responder_duvida', { p_duvida: txt(f, 'duvida_id'), p_texto: texto });
  if (error) return { erro: error.message };
  revalidatePath('/professor', 'layout');
  return { ok: 'Resposta enviada. O aluno vê o aviso no painel dele.' };
}

export async function encerrarDuvida(_: Resultado, f: FormData): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('encerrar_duvida', { p_duvida: txt(f, 'duvida_id') });
  if (error) return { erro: error.message };
  revalidatePath('/professor', 'layout');
  return { ok: 'Marcada como sanada.' };
}

// ---------- Classificação das questões de um simulado ----------
const lista = (f: FormData, k: string) => {
  try {
    const v = JSON.parse(String(f.get(k) ?? '[]'));
    return Array.isArray(v) ? v.map((x) => String(x ?? '').trim()) : [];
  } catch {
    return [];
  }
};

export async function salvarClassificacao(_: Resultado, f: FormData): Promise<Resultado> {
  const id = txt(f, 'simulado_id');
  const n = parseInt(txt(f, 'n'), 10);
  const habilidades = lista(f, 'habilidades').map((h) => h.toUpperCase());
  const assuntos = lista(f, 'assuntos').map((a) => a.slice(0, 80));
  const niveis = lista(f, 'niveis');
  const comentarios = lista(f, 'comentarios').map((c) => c.slice(0, 3000));
  if (!id || !n) return { erro: 'Simulado inválido.' };
  if ([habilidades, assuntos, niveis, comentarios].some((l) => l.length !== n)) return { erro: 'Recarregue a página e tente de novo.' };
  if (habilidades.some((h) => h && !/^H([1-9]|[12]\d|30)$/.test(h))) return { erro: 'Use habilidades de H1 a H30.' };
  if (niveis.some((x) => !['', 'facil', 'medio', 'dificil'].includes(x))) return { erro: 'Nível inválido.' };

  const supabase = await createClient();
  const { error } = await supabase.from('gabaritos').update({ habilidades, assuntos, niveis, comentarios }).eq('simulado_id', id);
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor', 'layout');
  return { ok: 'Classificação salva.' };
}

// ---------- Banco de questões ----------
const CODIGO = /^[A-Z0-9-]{3,40}$/;
const maiusculo = (v: string) => v.toUpperCase().replace(/\s+/g, '-');

export async function salvarQuestao(_: Resultado, f: FormData): Promise<Resultado> {
  const id = txt(f, 'id');
  const origem = txt(f, 'origem') === 'autoral' ? 'autoral' : 'prova';
  const tipo = txt(f, 'tipo') === 'certo_errado' ? 'certo_errado' : 'multipla';
  const ano = parseInt(txt(f, 'ano'), 10) || null;
  const numero = parseInt(txt(f, 'numero_prova'), 10) || null;
  const enunciado = txt(f, 'enunciado');
  const resposta = txt(f, 'resposta').toUpperCase();
  const disciplina = txt(f, 'disciplina');
  const assunto = txt(f, 'assunto');
  const imagem = txt(f, 'formato') === 'imagem';
  const alts = tipo === 'multipla' ? ['a', 'b', 'c', 'd', 'e'].map((l) => txt(f, `alt_${l}`)) : ['', '', '', '', ''];
  const prova = maiusculo(txt(f, 'prova'));
  const escolaridade = txt(f, 'escolaridade');

  if (!disciplina) return { erro: 'Informe a disciplina.' };
  if (!enunciado && !imagem) return { erro: tipo === 'certo_errado' ? 'Escreva o item a julgar.' : 'Escreva o enunciado.' };
  if (tipo === 'certo_errado' && !/^[CE]$/.test(resposta)) return { erro: 'Marque o gabarito: Certo ou Errado.' };
  if (tipo === 'multipla') {
    if (!/^[A-E]$/.test(resposta)) return { erro: 'Escolha a alternativa certa.' };
    if (!imagem && alts.slice(0, 4).some((a) => !a)) return { erro: 'Preencha as alternativas de A a D (a E pode ficar vazia).' };
    if (!imagem && !alts['ABCDE'.indexOf(resposta)]) return { erro: `A alternativa ${resposta} está vazia.` };
  }
  if (origem === 'prova' && (!ano || !txt(f, 'banca') || !txt(f, 'orgao'))) return { erro: 'Questão de prova precisa de banca, órgão e ano.' };
  if (prova && !CODIGO.test(prova)) return { erro: 'O código da prova usa letras, números e hífen, como AOCP-PMPE-2024-SD.' };

  let codigo = maiusculo(txt(f, 'codigo'));
  if (!codigo) codigo = prova && numero ? `${prova}-${numero}` : `${origem === 'autoral' ? 'AUT' : 'Q'}-${Date.now().toString().slice(-7)}`;
  if (!CODIGO.test(codigo)) return { erro: 'Use um código com letras, números e hífen, como AOCP-PMPE-2024-SD-15.' };

  const supabase = await createClient();
  // disciplina e assunto novos entram no catálogo
  await supabase.from('disciplinas').upsert({ nome: disciplina }, { onConflict: 'nome', ignoreDuplicates: true });
  if (assunto) await supabase.from('assuntos').upsert({ disciplina, nome: assunto }, { onConflict: 'disciplina,nome', ignoreDuplicates: true });

  let textoBaseId: string | null = null;
  const tb = maiusculo(txt(f, 'texto_base'));
  if (tb) {
    const { data: t } = await supabase.from('textos_base').select('id').eq('codigo', tb).maybeSingle();
    if (!t) return { erro: `Não existe texto-base com o código ${tb}. Ele entra pelo pacote importado.` };
    textoBaseId = (t as { id: string }).id;
  }

  const linha: Record<string, unknown> = {
    codigo, origem, tipo, ano, numero_prova: numero, enunciado, disciplina, assunto: assunto || null, texto_base_id: textoBaseId,
    banca: ouNulo(txt(f, 'banca')), orgao: origem === 'prova' ? ouNulo(txt(f, 'orgao')) : null, cargo: origem === 'prova' ? ouNulo(txt(f, 'cargo')) : null,
    escolaridade: ['fundamental', 'medio', 'superior'].includes(escolaridade) ? escolaridade : null, prova: prova || null,
    alt_a: alts[0], alt_b: alts[1], alt_c: alts[2], alt_d: alts[3], alt_e: alts[4], nivel: ouNulo(txt(f, 'nivel')),
    publicada: f.get('publicada') === 'on', revisada: f.get('revisada') === 'on',
  };
  const novaImagem = txt(f, 'imagem_path');
  if (novaImagem) linha.imagem_path = novaImagem;
  if (f.get('remover_imagem') === 'on') linha.imagem_path = null;

  const { data, error } = id
    ? await supabase.from('questoes').update(linha).eq('id', id).select('id').single()
    : await supabase.from('questoes').insert(linha).select('id').single();
  if (error || !data) {
    if (error?.code === '23505') return { erro: `Já existe uma questão com o código ${codigo}.` };
    return { erro: 'Não foi possível salvar: ' + (error?.message ?? 'erro desconhecido') };
  }
  const { error: eg } = await supabase.from('questoes_gabarito').upsert({
    questao_id: data.id, resposta, comentario: ouNulo(txt(f, 'comentario')), video_url: ouNulo(txt(f, 'video_url')),
  });
  if (eg) return { erro: 'A questão foi salva, mas o gabarito não: ' + eg.message };
  revalidatePath('/professor/banco');
  return { ok: `Questão ${codigo} salva${linha.publicada ? ' e publicada' : ' como rascunho'}.` };
}

export async function alternarQuestao(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('questoes').update({ publicada: f.get('publicar') === 'sim' }).eq('id', txt(f, 'id'));
  revalidatePath('/professor/banco');
}

// ---------- Materiais por habilidade (aulas das habilidades e listas) ----------
export async function salvarMaterial(_: Resultado, f: FormData): Promise<Resultado> {
  const habilidade = txt(f, 'habilidade').toUpperCase();
  const tipo = txt(f, 'tipo');
  const titulo = txt(f, 'titulo');
  if (!/^H([1-9]|[12]\d|30)$/.test(habilidade)) return { erro: 'Habilidade inválida.' };
  if (tipo !== 'aula' && tipo !== 'lista') return { erro: 'Escolha se é aula ou lista.' };
  if (!titulo) return { erro: 'Dê um título.' };
  const video = ouNulo(txt(f, 'video_url'));
  const pdf = ouNulo(txt(f, 'pdf_path'));
  if (!video && !pdf) return { erro: tipo === 'aula' ? 'Informe o vídeo ou envie o PDF.' : 'Envie o PDF da lista.' };

  const supabase = await createClient();
  const { error } = await supabase.from('materiais_habilidade').insert({
    habilidade, tipo, titulo, video_url: video, pdf_path: pdf, gabarito_pdf_path: ouNulo(txt(f, 'gabarito_pdf_path')),
    ordem: parseInt(txt(f, 'ordem'), 10) || 0, publicada: f.get('publicada') === 'on',
  });
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/habilidades', 'layout');
  return { ok: `${tipo === 'aula' ? 'Aula' : 'Lista'} adicionada à ${habilidade}.` };
}

export async function alternarMaterial(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('materiais_habilidade').update({ publicada: f.get('publicar') === 'sim' }).eq('id', txt(f, 'id'));
  revalidatePath('/professor/habilidades', 'layout');
}

export async function excluirMaterial(f: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from('materiais_habilidade').delete().eq('id', txt(f, 'id'));
  revalidatePath('/professor/habilidades', 'layout');
}

// Publica ou oculta todas as questões de uma prova (pelo código da prova; AUTORAIS e SEM-PROVA agrupam o resto)
function daProva<T extends { eq: Function; is: Function }>(q: T, prova: string): T {
  if (prova === 'AUTORAIS') return q.is('prova', null).eq('origem', 'autoral');
  if (prova === 'SEM-PROVA') return q.is('prova', null).eq('origem', 'prova');
  return q.eq('prova', prova);
}

export async function publicarProva(f: FormData): Promise<void> {
  const supabase = await createClient();
  await daProva(supabase.from('questoes').update({ publicada: f.get('publicar') === 'sim' }), txt(f, 'prova'));
  revalidatePath('/professor/banco');
}

// Publica ou oculta várias provas de uma vez (caixas marcadas na lista de provas)
export async function publicarProvas(f: FormData): Promise<void> {
  const provas = f.getAll('provas').map(String).filter(Boolean);
  if (!provas.length) return;
  const publicada = f.get('acao') === 'publicar';
  const supabase = await createClient();
  const comuns = provas.filter((p) => p !== 'AUTORAIS' && p !== 'SEM-PROVA');
  for (let i = 0; i < comuns.length; i += 100) {
    await supabase.from('questoes').update({ publicada }).in('prova', comuns.slice(i, i + 100));
  }
  for (const p of provas.filter((x) => x === 'AUTORAIS' || x === 'SEM-PROVA')) {
    await daProva(supabase.from('questoes').update({ publicada }), p);
  }
  revalidatePath('/professor/banco');
}

// Exclui uma questão (e o recorte dela)
export async function excluirQuestao(f: FormData): Promise<void> {
  const supabase = await createClient();
  const id = txt(f, 'id');
  const { data } = await supabase.from('questoes').select('imagem_path, figuras').eq('id', id).maybeSingle();
  await supabase.from('questoes').delete().eq('id', id);
  const arquivos = [data?.imagem_path, ...((data?.figuras as string[] | null) ?? [])].filter((x): x is string => !!x);
  if (arquivos.length) await supabase.storage.from('materiais').remove(arquivos);
  revalidatePath('/professor/banco');
  redirect('/professor/banco');
}

// Exclui todas as questões de uma prova (ex.: o pacote de teste)
export async function excluirProva(f: FormData): Promise<void> {
  if (f.get('confirmo') !== 'on') return;
  const supabase = await createClient();
  const prova = txt(f, 'prova');
  const { data } = await daProva(supabase.from('questoes').select('imagem_path, figuras'), prova);
  await daProva(supabase.from('questoes').delete(), prova);
  const arquivos = ((data ?? []) as { imagem_path: string | null; figuras: string[] | null }[])
    .flatMap((q) => [q.imagem_path, ...(q.figuras ?? [])]).filter((x): x is string => !!x);
  for (let i = 0; i < arquivos.length; i += 100) await supabase.storage.from('materiais').remove(arquivos.slice(i, i + 100));
  revalidatePath('/professor/banco');
}

// ---------- Capas dos cartões (módulos e simulados) ----------
export async function definirCapa(alvo: string, id: string, caminho: string | null): Promise<Resultado> {
  if (alvo !== 'modulos' && alvo !== 'simulados') return { erro: 'Destino inválido.' };
  if (caminho !== null && !caminho.startsWith('capas/')) return { erro: 'Caminho de capa inválido.' };
  const supabase = await createClient();
  const { error } = await supabase.from(alvo).update({ capa_path: caminho }).eq('id', id);
  if (error) {
    if (/capa_path/.test(error.message)) return { erro: 'Falta rodar a migração 0008_capas.sql no Supabase.' };
    return { erro: 'Não foi possível salvar a capa: ' + error.message };
  }
  revalidatePath('/professor/aulas');
  revalidatePath('/professor/simulados');
  revalidatePath('/aluno', 'layout');
  return { ok: caminho ? 'Capa trocada.' : 'Voltou para a capa automática.' };
}

// ---------- Limites do plano grátis do banco de questões ----------
export async function salvarLimitesBanco(_: Resultado, f: FormData): Promise<Resultado> {
  const porDia = parseInt(txt(f, 'por_dia'), 10);
  const listaMax = parseInt(txt(f, 'lista_max'), 10);
  if (!(porDia >= 0 && porDia <= 200)) return { erro: 'Questões por dia: de 0 a 200.' };
  if (!(listaMax >= 5 && listaMax <= 45)) return { erro: 'Tamanho da lista: de 5 a 45.' };
  const supabase = await createClient();
  const { error } = await supabase.from('configuracoes').upsert([
    { chave: 'banco_gratis_por_dia', valor: porDia, atualizado_em: new Date().toISOString() },
    { chave: 'banco_gratis_lista_max', valor: listaMax, atualizado_em: new Date().toISOString() },
  ]);
  if (error) return { erro: /configuracoes/.test(error.message) ? 'Falta rodar a atualização 0011 do banco no Supabase.' : 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/turmas');
  revalidatePath('/aluno', 'layout');
  return { ok: 'Limites do plano grátis salvos.' };
}

// ---------- Editais ----------
// disciplinas em linhas: "Língua Portuguesa; 10; Bloco I" (questões e bloco opcionais; peso opcional no 4º campo)
function lerDisciplinas(texto: string) {
  return texto.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
    const [disciplina, questoes, bloco, peso] = l.split(/[;|\t]/).map((x) => x.trim());
    return { disciplina: disciplina.slice(0, 80), questoes: Math.min(200, Math.max(0, parseInt(questoes, 10) || 0)), bloco: bloco || null,
      peso: Math.max(0.1, parseFloat((peso || '1').replace(',', '.')) || 1), ordem: i + 1 };
  }).filter((d) => d.disciplina.length >= 2);
}

const fracao = (v: string) => { const n = parseFloat(v.replace(',', '.').replace('%', '')); return Number.isFinite(n) && n > 0 ? (n > 1 ? n / 100 : n) : null; };

export async function salvarEdital(_: Resultado, f: FormData): Promise<Resultado> {
  const id = txt(f, 'id');
  const nome = txt(f, 'nome');
  const orgao = txt(f, 'orgao');
  const cargo = txt(f, 'cargo');
  if (!nome || !orgao || !cargo) return { erro: 'Preencha nome, órgão e cargo.' };
  const slug = (txt(f, 'slug') || nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const discs = lerDisciplinas(txt(f, 'disciplinas'));
  if (!discs.length) return { erro: 'Informe pelo menos uma disciplina (uma por linha).' };
  if (new Set(discs.map((d) => d.disciplina)).size !== discs.length) return { erro: 'Há disciplina repetida na lista.' };
  const duracao = parseInt(txt(f, 'duracao_min'), 10);
  const linha = {
    slug, nome, orgao, cargo, banca: ouNulo(txt(f, 'banca')),
    esfera: ['municipal', 'estadual', 'federal'].includes(txt(f, 'esfera')) ? txt(f, 'esfera') : 'estadual',
    escolaridade: ['fundamental', 'medio', 'superior'].includes(txt(f, 'escolaridade')) ? txt(f, 'escolaridade') : null,
    situacao: ['previsto', 'aberto', 'encerrado'].includes(txt(f, 'situacao')) ? txt(f, 'situacao') : 'previsto',
    data_prova: /^\d{4}-\d{2}-\d{2}$/.test(txt(f, 'data_prova')) ? txt(f, 'data_prova') : null,
    tipo_prova: txt(f, 'tipo_prova') === 'certo_errado' ? 'certo_errado' : 'multipla',
    n_alternativas: txt(f, 'n_alternativas') === '4' ? 4 : 5,
    corte_bloco: fracao(txt(f, 'corte_bloco')), corte_total: fracao(txt(f, 'corte_total')), sem_zerar: f.get('sem_zerar') === 'on',
    duracao_min: duracao >= 10 && duracao <= 600 ? duracao : null,
    observacoes: ouNulo(txt(f, 'observacoes')), publicado: f.get('publicado') === 'on',
  };
  const supabase = await createClient();
  await supabase.from('disciplinas').upsert(discs.map((d) => ({ nome: d.disciplina })), { onConflict: 'nome', ignoreDuplicates: true });
  const { data, error } = id
    ? await supabase.from('editais').update(linha).eq('id', id).select('id').single()
    : await supabase.from('editais').insert(linha).select('id').single();
  if (error || !data) return { erro: error?.code === '23505' ? 'Já existe um edital com esse nome curto (slug).' : 'Não foi possível salvar: ' + (error?.message ?? '') };
  const editalId = (data as { id: string }).id;
  // troca a lista de disciplinas pela nova
  await supabase.from('edital_disciplinas').delete().eq('edital_id', editalId).not('disciplina', 'in', `(${discs.map((d) => `"${d.disciplina.replace(/"/g, '')}"`).join(',')})`);
  const { error: ed } = await supabase.from('edital_disciplinas').upsert(discs.map((d) => ({ edital_id: editalId, ...d })), { onConflict: 'edital_id,disciplina' });
  if (ed) return { erro: 'O edital foi salvo, mas as disciplinas não: ' + ed.message };
  revalidatePath('/professor/editais');
  revalidatePath('/');
  return { ok: `Edital salvo${linha.publicado ? ' e publicado' : ' como rascunho'}: ${discs.length} disciplinas, ${discs.reduce((t, d) => t + d.questoes, 0)} questões.` };
}

// ---------- Notícias da vitrine ----------
export async function salvarNoticia(_: Resultado, f: FormData): Promise<Resultado> {
  const id = txt(f, 'id');
  const titulo = txt(f, 'titulo');
  if (titulo.length < 3) return { erro: 'Escreva o título da notícia.' };
  if (titulo.length > 120) return { erro: 'O título pode ter até 120 caracteres.' };
  const link = txt(f, 'link');
  if (link && !/^(https:\/\/|\/)/.test(link)) return { erro: 'O link precisa começar com https:// (ou / para uma página do site).' };
  const linha: Record<string, unknown> = {
    titulo, rotulo: ouNulo(txt(f, 'rotulo').slice(0, 30)), resumo: ouNulo(txt(f, 'resumo').slice(0, 280)),
    link: link || null, botao: ouNulo(txt(f, 'botao').slice(0, 30)),
    ordem: parseInt(txt(f, 'ordem'), 10) || 0, publicada: f.get('publicada') === 'on',
  };
  const imagem = txt(f, 'imagem_path');
  if (imagem) linha.imagem_path = imagem;
  if (f.get('remover_imagem') === 'on') linha.imagem_path = null;
  const supabase = await createClient();
  const { error } = id ? await supabase.from('noticias').update(linha).eq('id', id) : await supabase.from('noticias').insert(linha);
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/professor/noticias');
  revalidatePath('/');
  return { ok: linha.publicada ? 'Notícia salva e publicada na vitrine.' : 'Notícia salva como rascunho.' };
}

export async function excluirNoticia(f: FormData): Promise<void> {
  const supabase = await createClient();
  const id = txt(f, 'id');
  const { data } = await supabase.from('noticias').select('imagem_path').eq('id', id).maybeSingle();
  await supabase.from('noticias').delete().eq('id', id);
  if (data?.imagem_path) await supabase.storage.from('vitrine').remove([data.imagem_path as string]);
  revalidatePath('/professor/noticias');
  revalidatePath('/');
  redirect('/professor/noticias');
}

// ---------- Produtos da loja (cursos em PDF, Reta Final, simulados, mentoria, banco completo) ----------
export async function salvarProdutoLoja(_: Resultado, f: FormData): Promise<Resultado> {
  const id = txt(f, 'id');
  const nome = txt(f, 'nome');
  if (nome.length < 3) return { erro: 'Dê um nome ao produto.' };
  const tipo = ['curso', 'banco', 'mentoria', 'simulados'].includes(txt(f, 'tipo')) ? txt(f, 'tipo') : 'curso';
  const checkout = txt(f, 'checkout_url');
  if (checkout && !/^https:\/\//.test(checkout)) return { erro: 'O link de compra precisa começar com https://' };
  const edital = txt(f, 'edital_id');
  const slug = (txt(f, 'slug') || nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const linha = {
    nome, slug, tipo, descricao: ouNulo(txt(f, 'descricao').slice(0, 600)), preco: ouNulo(txt(f, 'preco').slice(0, 60)),
    beneficios: txt(f, 'beneficios').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 10),
    edital_id: /^[0-9a-f-]{36}$/i.test(edital) ? edital : null, destaque: f.get('destaque') === 'on', selo: ouNulo(txt(f, 'selo').slice(0, 30)),
    ordem: parseInt(txt(f, 'ordem'), 10) || 0, checkout_url: checkout || null, kiwify_product_id: ouNulo(txt(f, 'kiwify_product_id')),
    venda_aberta: f.get('venda_aberta') === 'on', acesso_ate: ouNulo(txt(f, 'acesso_ate')),
  };
  const supabase = await createClient();
  const r = id ? await supabase.from('produtos').update(linha).eq('id', id) : await supabase.from('produtos').insert(linha);
  if (r.error) return { erro: r.error.code === '23505' ? 'Já existe um produto com esse nome curto ou esse ID da Kiwify.' : 'Não foi possível salvar: ' + r.error.message };
  // curso de um edital libera esse edital
  if (tipo === 'curso' && linha.edital_id) {
    const { data: p } = await supabase.from('produtos').select('id').eq('slug', slug).maybeSingle();
    if (p) await supabase.from('produto_editais').upsert({ produto_id: (p as { id: string }).id, edital_id: linha.edital_id }, { onConflict: 'produto_id,edital_id', ignoreDuplicates: true });
  }
  revalidatePath('/professor/produtos');
  revalidatePath('/');
  revalidatePath('/aluno', 'layout');
  return { ok: linha.venda_aberta ? 'Produto salvo e à venda.' : 'Produto salvo (vendas fechadas).' };
}
