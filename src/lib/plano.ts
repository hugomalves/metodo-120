// Plano de estudo do Método 120: cerca de 2 horas por dia, montado a partir do edital.
// • Segunda a sábado: uma disciplina principal (teoria + questões) e uma secundária (questões),
//   em rodízio proporcional ao número de questões de cada disciplina na prova; no fim, revisão dos erros.
// • Domingo: dia de simulado (minissimulado; nas 3 últimas semanas, simulado completo).
// O rodízio depende só da data: quem estuda hoje vê o mesmo plano ao voltar mais tarde.
import { diaDaSemana, somarDias } from '@/lib/datas';

export type DisciplinaEdital = { disciplina: string; questoes: number; bloco: string | null; ordem: number };
export type TipoMeta = 'teoria' | 'questoes' | 'revisao' | 'simulado';
export type MetaPlano = { id: string; tipo: TipoMeta; titulo: string; disciplina: string | null; minutos: number; alvo: number };
export type PlanoDia = { dia: string; fase: 'base' | 'reta' | 'prova'; diasProva: number | null; domingo: boolean; metas: MetaPlano[]; principal: string | null; secundaria: string | null };

const EPOCA = '2026-01-05';   // uma segunda-feira: dia zero do rodízio

function diasEntre(a: string, b: string) {
  return Math.round((new Date(b + 'T12:00:00Z').getTime() - new Date(a + 'T12:00:00Z').getTime()) / 86400000);
}

// sequência proporcional ao peso (round-robin ponderado suave): 10 questões aparecem o dobro de 5
export function sequenciaRodizio(discs: DisciplinaEdital[]): string[] {
  const lista = discs.filter((d) => d.questoes > 0).sort((a, b) => a.ordem - b.ordem || a.disciplina.localeCompare(b.disciplina));
  const total = lista.reduce((t, d) => t + d.questoes, 0);
  if (!total) return [];
  const atual = new Map(lista.map((d) => [d.disciplina, 0]));
  const seq: string[] = [];
  for (let i = 0; i < total; i++) {
    let melhor = lista[0];
    for (const d of lista) {
      atual.set(d.disciplina, atual.get(d.disciplina)! + d.questoes);
      if (atual.get(d.disciplina)! > atual.get(melhor.disciplina)!) melhor = d;
    }
    atual.set(melhor.disciplina, atual.get(melhor.disciplina)! - total);
    seq.push(melhor.disciplina);
  }
  return seq;
}

export function planoDoDia(discs: DisciplinaEdital[], dataProva: string | null, dia: string): PlanoDia {
  const diasProva = dataProva ? diasEntre(dia, dataProva) : null;
  const fase: PlanoDia['fase'] = diasProva !== null && diasProva <= 0 ? 'prova' : diasProva !== null && diasProva <= 21 ? 'reta' : 'base';
  const domingo = diaDaSemana(dia) === 6;
  const base = { dia, fase, diasProva, domingo };
  if (fase === 'prova') return { ...base, metas: [], principal: null, secundaria: null };

  if (domingo) {
    const completo = fase === 'reta';
    return {
      ...base, principal: null, secundaria: null,
      metas: [
        { id: 'simulado', tipo: 'simulado', titulo: completo ? 'Simulado completo no formato da prova' : 'Minissimulado da semana', disciplina: null, minutos: completo ? 180 : 75, alvo: 1 },
        { id: 'revisao', tipo: 'revisao', titulo: 'Refazer as questões que você errou', disciplina: null, minutos: 30, alvo: 10 },
      ],
    };
  }

  const seq = sequenciaRodizio(discs);
  if (!seq.length) return { ...base, metas: [], principal: null, secundaria: null };
  // dias de estudo (sem os domingos) desde a época: cada dia avança uma posição no rodízio;
  // a secundária vem de meia volta adiante, para os pares variarem e todas serem principais
  const n = diasEntre(EPOCA, dia);
  const util = Math.floor(n / 7) * 6 + Math.min(diaDaSemana(dia), 6);
  const i = ((util % seq.length) + seq.length) % seq.length;
  const principal = seq[i];
  const salto = Math.max(1, Math.floor(new Set(seq).size / 2));
  let secundaria = seq[(i + salto) % seq.length];
  for (let k = salto + 1; secundaria === principal && k < salto + seq.length; k++) secundaria = seq[(i + k) % seq.length];
  const reta = fase === 'reta';

  const metas: MetaPlano[] = [
    { id: 'teoria', tipo: 'teoria', titulo: reta ? `Revisão rápida de ${principal}` : `Teoria de ${principal}`, disciplina: principal, minutos: reta ? 20 : 40, alvo: 1 },
    { id: 'q1', tipo: 'questoes', titulo: `Questões de ${principal}`, disciplina: principal, minutos: reta ? 50 : 40, alvo: reta ? 20 : 15 },
  ];
  if (secundaria !== principal) metas.push({ id: 'q2', tipo: 'questoes', titulo: `Questões de ${secundaria}`, disciplina: secundaria, minutos: reta ? 30 : 20, alvo: reta ? 12 : 8 });
  metas.push({ id: 'revisao', tipo: 'revisao', titulo: 'Refazer as questões que você errou', disciplina: null, minutos: 20, alvo: 8 });
  return { ...base, metas, principal, secundaria: secundaria !== principal ? secundaria : null };
}

// as disciplinas principais dos próximos dias (para o aluno ver a semana)
export function proximosDias(discs: DisciplinaEdital[], dataProva: string | null, dia: string, n = 7) {
  return Array.from({ length: n }, (_, k) => {
    const d = somarDias(dia, k);
    const p = planoDoDia(discs, dataProva, d);
    return { dia: d, domingo: p.domingo, principal: p.principal, secundaria: p.secundaria, fase: p.fase };
  });
}
