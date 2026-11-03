export type QuestaoCritica = {
  simulado_id: string; codigo: string; questao: number; habilidade: string | null; assunto: string | null; nivel: string | null;
  pct_erro: number; respostas: number; mais_marcada: string | null; certa: string;
};

export type GrupoCritico = { chave: string; assunto: string | null; habilidade: string | null; questoes: QuestaoCritica[]; media: number };

// Agrupa as questões com mais erros por assunto e habilidade ("Proporcionalidade · H16 · questões 3, 7, 12")
export function agrupar(questoes: QuestaoCritica[]): GrupoCritico[] {
  const mapa = new Map<string, GrupoCritico>();
  for (const q of questoes) {
    const chave = `${q.assunto ?? ''}|${q.habilidade ?? ''}`;
    const g = mapa.get(chave) ?? { chave, assunto: q.assunto, habilidade: q.habilidade, questoes: [], media: 0 };
    g.questoes.push(q);
    mapa.set(chave, g);
  }
  const grupos = Array.from(mapa.values());
  grupos.forEach((g) => { g.media = Math.round(g.questoes.reduce((t, q) => t + Number(q.pct_erro), 0) / g.questoes.length); });
  return grupos.sort((a, b) => b.questoes.length - a.questoes.length || b.media - a.media);
}
