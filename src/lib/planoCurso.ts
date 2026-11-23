import { diaDaSemana, somarDias } from '@/lib/cronograma';

// Plano da Reta Final: distribui os itens do curso (blocos de 15 min, revisões, propostas, simulados, minissimulados)
// pelos dias de estudo do aluno. O que já foi feito fica no dia em que foi feito; o resto é distribuído de hoje em
// diante, na ordem do curso. Se o aluno atrasa ou adianta, o plano se refaz sozinho.
export const CURSO = 'reta-final-pmpe';
export const DATA_PROVA = '2027-02-21';

export type ItemPlano = {
  codigo: string; seq: number; tipo: 'aula' | 'revisao' | 'proposta' | 'simulado' | 'mini';
  sigla: string; disciplina: string; titulo: string; subtitulo: string | null; minutos: number;
  pdf: string | null; caderno: string | null; aula: string | null; ciclo: number | null; extra: { aulas?: string[] };
};
export type ConfigPlano = { inicio: string; minutos_dia: number; dias_semana: number[] };
export type DiaPlano = { dia: string; itens: (ItemPlano & { feito: boolean })[]; minutos: number };

const DIA_INTEIRO = new Set(['simulado', 'mini']);

export function montarPlano(itens: ItemPlano[], feitos: Map<string, string>, cfg: ConfigPlano, hoje: string) {
  const dias = new Map<string, DiaPlano>();
  const pegar = (d: string) => { let x = dias.get(d); if (!x) { x = { dia: d, itens: [], minutos: 0 }; dias.set(d, x); } return x; };

  // o que já foi feito, no dia em que foi feito
  for (const it of itens) {
    const d = feitos.get(it.codigo);
    if (d) { const x = pegar(d); x.itens.push({ ...it, feito: true }); x.minutos += it.minutos; }
  }

  const permitidos = cfg.dias_semana.length ? cfg.dias_semana : [0, 1, 2, 3, 4, 5, 6];
  const proximo = (d: string) => { let x = d; for (let i = 0; i < 8 && !permitidos.includes(diaDaSemana(x)); i++) x = somarDias(x, 1); return x; };
  let dia = proximo(cfg.inicio > hoje ? cfg.inicio : hoje);
  let usado = dias.get(dia)?.minutos ?? 0;
  let fechado = !!dias.get(dia)?.itens.some((i) => DIA_INTEIRO.has(i.tipo));
  const avancar = () => { dia = proximo(somarDias(dia, 1)); usado = dias.get(dia)?.minutos ?? 0; fechado = false; };

  for (const it of itens) {
    if (feitos.has(it.codigo)) continue;
    const inteiro = DIA_INTEIRO.has(it.tipo);
    if (fechado || (inteiro && usado > 0) || (!inteiro && usado > 0 && usado + it.minutos > cfg.minutos_dia)) avancar();
    const x = pegar(dia);
    x.itens.push({ ...it, feito: false });
    x.minutos += it.minutos;
    usado += it.minutos;
    if (inteiro) fechado = true;
  }

  const lista = Array.from(dias.values()).sort((a, b) => a.dia.localeCompare(b.dia));
  lista.forEach((d) => d.itens.sort((a, b) => Number(b.feito) - Number(a.feito) || a.seq - b.seq));
  const total = itens.reduce((t, i) => t + i.minutos, 0);
  const feito = itens.reduce((t, i) => t + (feitos.has(i.codigo) ? i.minutos : 0), 0);
  const pendentes = lista.filter((d) => d.itens.some((i) => !i.feito));
  return { dias: lista, total, feito, fim: pendentes.length ? pendentes[pendentes.length - 1].dia : null };
}

// fim previsto para outro tempo por dia (para comparar no ajuste)
export function fimCom(itens: ItemPlano[], feitos: Map<string, string>, cfg: ConfigPlano, hoje: string, minutos: number) {
  return montarPlano(itens, feitos, { ...cfg, minutos_dia: minutos }, hoje).fim;
}

export const OPCOES_TEMPO = [120, 150, 180, 210, 240, 300, 360];
export const rotuloTempo = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
