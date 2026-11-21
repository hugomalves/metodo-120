// Árvore "Matéria e assunto" do filtro: disciplina → assuntos → subassuntos (tabela `assuntos`, com pai_id).
// A escolha do aluno vira uma lista de marcas (tokens) guardada no filtro "m":
//   "Disciplina"            → todo o conteúdo da disciplina
//   "Disciplina>Assunto"    → aquele assunto e tudo que está dentro dele
export type LinhaAssunto = { id: string; disciplina: string; nome: string; pai_id: string | null; ordem: number };
export type No = { id: string; nome: string; filhos: No[]; sintetico?: boolean };

export const SEP_M = '|';
export const marca = (disciplina: string, assunto?: string) => (assunto ? `${disciplina}>${assunto}` : disciplina);
export const marcas = (m: string | undefined): string[] => (m ? m.split(SEP_M).filter(Boolean) : []);

// monta a árvore de uma disciplina; assuntos usados nas questões mas que não estão no catálogo entram como folhas soltas
export function arvoreDaDisciplina(linhas: LinhaAssunto[], disciplina: string, usados: Iterable<string>): No[] {
  const dela = linhas.filter((l) => l.disciplina === disciplina);
  const porId = new Map<string, No>(dela.map((l) => [l.id, { id: l.id, nome: l.nome, filhos: [] }]));
  const raiz: No[] = [];
  const ordenar = [...dela].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
  for (const l of ordenar) {
    const no = porId.get(l.id)!;
    const pai = l.pai_id ? porId.get(l.pai_id) : undefined;
    (pai ?? { filhos: raiz }).filhos.push(no);
  }
  const conhecidos = new Set(dela.map((l) => l.nome));
  Array.from(new Set(usados)).filter((n) => n && !conhecidos.has(n)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .forEach((n) => raiz.push({ id: `s:${disciplina}:${n}`, nome: n, filhos: [], sintetico: true }));
  return raiz;
}

export function nomesDoNo(no: No): string[] {
  return [no.nome, ...no.filhos.flatMap(nomesDoNo)];
}

export type Selecao = { vazia: boolean; disciplinas: Set<string>; assuntos: Map<string, Set<string>> };

// transforma as marcas em "o que vale": disciplinas inteiras e conjuntos de assuntos (com os de dentro)
export function selecaoDe(tokens: string[], linhas: LinhaAssunto[], usadosPorDisciplina?: Map<string, string[]>): Selecao {
  const disciplinas = new Set<string>();
  const assuntos = new Map<string, Set<string>>();
  for (const t of tokens) {
    const i = t.indexOf('>');
    if (i < 0) { disciplinas.add(t); continue; }
    const d = t.slice(0, i), nome = t.slice(i + 1);
    const arv = arvoreDaDisciplina(linhas, d, usadosPorDisciplina?.get(d) ?? []);
    const achar = (nos: No[]): No | undefined => { for (const n of nos) { if (n.nome === nome) return n; const x = achar(n.filhos); if (x) return x; } };
    const no = achar(arv);
    const set = assuntos.get(d) ?? new Set<string>();
    (no ? nomesDoNo(no) : [nome]).forEach((x) => set.add(x));
    assuntos.set(d, set);
  }
  return { vazia: tokens.length === 0, disciplinas, assuntos };
}

export function passaM(sel: Selecao, disciplina: string | null, assunto: string | null): boolean {
  if (sel.vazia) return true;
  const d = disciplina ?? '';
  if (sel.disciplinas.has(d)) return true;
  return !!assunto && !!sel.assuntos.get(d)?.has(assunto);
}
