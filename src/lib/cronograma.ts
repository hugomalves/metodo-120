import type { SupabaseClient } from '@supabase/supabase-js';
import { todasAsLinhas } from '@/lib/paginar';

// ---------- Datas (sempre no fuso de Brasília, como 'AAAA-MM-DD') ----------
export function hojeBr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}
const meioDia = (d: string) => new Date(d + 'T12:00:00Z');
export function somarDias(d: string, n: number): string {
  const x = meioDia(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}
export const diaDaSemana = (d: string) => meioDia(d).getUTCDay(); // 0 = domingo
export const diasEntre = (a: string, b: string) => Math.round((meioDia(b).getTime() - meioDia(a).getTime()) / 86400000);
export function inicioDaSemana(d: string): string {
  const w = diaDaSemana(d);
  return somarDias(d, w === 0 ? -6 : 1 - w); // semana de segunda a domingo
}
export const dataCurta = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
export const dataLonga = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
export const valido = (d: unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(meioDia(d).getTime());

// próximo dia permitido (a partir do próprio dia), para revisões e programação
export function proximoPermitido(d: string, dias: number[]): string {
  if (!dias.length) return d;
  let x = d;
  for (let i = 0; i < 7 && !dias.includes(diaDaSemana(x)); i++) x = somarDias(x, 1);
  return x;
}

// ---------- Estrutura do edital: disciplinas → assuntos (árvore) → conteúdos ----------
export type Conteudo = {
  disciplina: string;
  chave: string;            // id do assunto, ou 'geral' quando a disciplina não tem assuntos
  assunto_id: string | null;
  nome: string;             // nome do assunto (já com a numeração, se o professor não numerou)
  nomeCurto: string;        // nome original, para o filtro de questões
  nivel: number;            // 0 = tópico principal
  folha: boolean;           // só as folhas entram no cronograma e têm teoria/revisões
  folhasAbaixo: string[];   // chaves das folhas abaixo deste tópico (para "0/2")
};
export type DisciplinaEdital = { nome: string; questoes: number; bloco: string | null; linhas: Conteudo[]; folhas: Conteudo[] };

type AssuntoLinha = { id: string; disciplina: string; nome: string; pai_id: string | null; ordem: number };

export async function estruturaEdital(supabase: SupabaseClient, editalId: string): Promise<DisciplinaEdital[]> {
  const { data: eds } = await supabase.from('edital_disciplinas').select('disciplina, questoes, bloco, ordem').eq('edital_id', editalId).order('ordem');
  const discs = ((eds ?? []) as { disciplina: string; questoes: number; bloco: string | null; ordem: number }[]);
  if (!discs.length) return [];
  const assuntos = await todasAsLinhas<AssuntoLinha>((de, ate) => supabase.from('assuntos').select('id, disciplina, nome, pai_id, ordem')
    .in('disciplina', discs.map((d) => d.disciplina)).order('disciplina').order('ordem').order('nome').order('id').range(de, ate));

  return discs.map((d) => {
    const daqui = assuntos.filter((a) => a.disciplina === d.disciplina);
    const ids = new Set(daqui.map((a) => a.id));
    const filhos = new Map<string, AssuntoLinha[]>();
    const raizes: AssuntoLinha[] = [];
    for (const a of daqui) {
      if (a.pai_id && ids.has(a.pai_id)) filhos.set(a.pai_id, [...(filhos.get(a.pai_id) ?? []), a]);
      else raizes.push(a);
    }
    const linhas: Conteudo[] = [];
    const visitar = (lista: AssuntoLinha[], prefixo: string, nivel: number, vistos: Set<string>): string[] => {
      const folhasAqui: string[] = [];
      lista.forEach((a, i) => {
        if (vistos.has(a.id)) return; // proteção contra ciclos na árvore
        vistos.add(a.id);
        const num = prefixo ? `${prefixo}.${i + 1}` : `${i + 1}`;
        const numerado = /^\d/.test(a.nome.trim());
        const linha: Conteudo = {
          disciplina: d.disciplina, chave: a.id, assunto_id: a.id, nome: numerado ? a.nome : `${num}. ${a.nome}`, nomeCurto: a.nome,
          nivel, folha: true, folhasAbaixo: [],
        };
        linhas.push(linha);
        const sub = filhos.get(a.id) ?? [];
        if (sub.length) {
          linha.folha = false;
          linha.folhasAbaixo = visitar(sub, num, nivel + 1, vistos);
          folhasAqui.push(...linha.folhasAbaixo);
        } else {
          linha.folhasAbaixo = [a.id];
          folhasAqui.push(a.id);
        }
      });
      return folhasAqui;
    };
    visitar(raizes, '', 0, new Set());
    if (!linhas.length) {
      linhas.push({ disciplina: d.disciplina, chave: 'geral', assunto_id: null, nome: d.disciplina, nomeCurto: '', nivel: 0, folha: true, folhasAbaixo: ['geral'] });
    }
    return { nome: d.disciplina, questoes: d.questoes, bloco: d.bloco, linhas, folhas: linhas.filter((l) => l.folha) };
  });
}

export const chaveDe = (disciplina: string, chave: string) => `${disciplina}::${chave}`;

// ---------- Ciclo: intercala as disciplinas, dando mais vez às que têm mais questões na prova ----------
export function ordenarCiclo(discs: { nome: string; questoes: number; pendentes: Conteudo[] }[]): Conteudo[] {
  const filas = discs.filter((d) => d.pendentes.length).map((d) => ({ peso: Math.max(d.questoes, 1), atual: 0, fila: [...d.pendentes] }));
  const total = () => filas.reduce((s, f) => s + (f.fila.length ? f.peso : 0), 0);
  const saida: Conteudo[] = [];
  while (filas.some((f) => f.fila.length)) {
    const soma = total();
    let melhor = null as (typeof filas)[number] | null;
    for (const f of filas) {
      if (!f.fila.length) continue;
      f.atual += f.peso;
      if (!melhor || f.atual > melhor.atual) melhor = f;
    }
    if (!melhor) break;
    melhor.atual -= soma;
    saida.push(melhor.fila.shift()!);
  }
  return saida;
}

// distribui os conteúdos pelos dias permitidos, N blocos por dia
export function distribuir(conteudos: Conteudo[], inicio: string, blocosPorDia: number, diasSemana: number[]) {
  const dias = diasSemana.length ? diasSemana : [0, 1, 2, 3, 4, 5, 6];
  const itens: { disciplina: string; chave: string; assunto_id: string | null; dia: string; ordem: number }[] = [];
  let dia = proximoPermitido(inicio, dias);
  let noDia = 0;
  conteudos.forEach((c, i) => {
    if (noDia >= blocosPorDia) {
      dia = proximoPermitido(somarDias(dia, 1), dias);
      noDia = 0;
    }
    itens.push({ disciplina: c.disciplina, chave: c.chave, assunto_id: c.assunto_id, dia, ordem: i });
    noDia++;
  });
  return itens;
}

// ---------- Dados do aluno ----------
export type Config = { edital_id: string; inicio: string; blocos_por_dia: number; dias_semana: number[]; intervalos: number[] };
export type Item = { disciplina: string; chave: string; assunto_id: string | null; dia: string; ordem: number };
export type Progresso = { disciplina: string; chave: string; teoria: boolean; revisoes: boolean[] };
export type Revisao = { id: number; edital_id: string | null; disciplina: string; chave: string | null; assunto_nome: string | null; numero: number | null; dia: string; feita_em: string | null };
export type Estudo = { id: number; edital_id: string | null; disciplina: string; chave: string | null; assunto_nome: string | null; dia: string; minutos: number; tipo: string; observacoes: string | null };

export const TIPOS_ESTUDO: Record<string, string> = { misto: 'Misto', teoria: 'Teoria', questoes: 'Questões', revisao: 'Revisão', leitura: 'Leitura de lei' };
export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const INTERVALOS_PADRAO = [1, 7, 14, 30, 90, 120];

export function minutosTexto(m: number): string {
  if (m <= 0) return '0min';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h${r ? ` ${String(r).padStart(2, '0')}min` : ''}` : `${r}min`;
}
