// Filtros do banco de questões (usados no navegador: banco, montar lista)
// Cada "grupo" é uma combinação de características com quantas questões publicadas existem nela.

export type Grupo = {
  banca: string | null; orgao: string | null; cargo: string | null; ano: number | null; escolaridade: string | null;
  disciplina: string | null; assunto: string | null; tipo: string | null; nivel: string | null; origem: string | null;
  feita: boolean; n: number;
};
export type EditalFiltro = { id: string; nome: string; disciplinas: string[] };

// e = edital · d = disciplina · a = assunto · b = banca · t = tipo · o = órgão · c = cargo · y = ano
// esc = escolaridade · n = dificuldade · or = origem
export type Chave = 'e' | 'd' | 'a' | 'b' | 't' | 'o' | 'c' | 'y' | 'esc' | 'n' | 'or';
export const CHAVES: Chave[] = ['e', 'd', 'a', 'b', 't', 'o', 'c', 'y', 'esc', 'n', 'or'];
// filtros que aparecem na tela (órgão, cargo, escolaridade e origem continuam existindo no banco, só não poluem a tela)
export const CHAVES_VISIVEIS: Chave[] = ['e', 'd', 'a', 'b', 'y', 't', 'n'];
export type ValoresFiltro = Record<Chave, string>;
export const VAZIO: ValoresFiltro = { e: '', d: '', a: '', b: '', t: '', o: '', c: '', y: '', esc: '', n: '', or: '' };

export function valor(g: Grupo, k: Chave): string {
  switch (k) {
    case 'd': return g.disciplina ?? '';
    case 'a': return g.assunto ?? '';
    case 'b': return g.banca ?? '';
    case 't': return g.tipo ?? '';
    case 'o': return g.orgao ?? '';
    case 'c': return g.cargo ?? '';
    case 'y': return g.ano == null ? '' : String(g.ano);
    case 'esc': return g.escolaridade ?? '';
    case 'n': return g.nivel ?? '';
    case 'or': return g.origem ?? '';
    default: return '';
  }
}

// a questão passa no filtro? (no edital: a disciplina precisa estar no edital)
export function passa(g: Grupo, k: Chave, v: string, editais: Map<string, Set<string>>): boolean {
  if (!v) return true;
  if (k === 'e') return editais.get(v)?.has(g.disciplina ?? '') ?? false;
  return valor(g, k) === v;
}

export function mapaEditais(editais: EditalFiltro[]) {
  return new Map(editais.map((e) => [e.id, new Set(e.disciplinas)]));
}

// quantas questões passam em todos os filtros (menos o ignorado)
export function contar(grupos: Grupo[], f: ValoresFiltro, editais: Map<string, Set<string>>, opcoes: { novas?: boolean; ignorar?: Chave } = {}) {
  let n = 0;
  for (const g of grupos) {
    if (opcoes.novas && g.feita) continue;
    if (CHAVES.some((k) => k !== opcoes.ignorar && !passa(g, k, f[k], editais))) continue;
    n += g.n;
  }
  return n;
}

// opções de um filtro, cada uma com a contagem considerando os outros filtros já escolhidos
export function opcoesDe(k: Chave, grupos: Grupo[], f: ValoresFiltro, editais: Map<string, Set<string>>, novas = false): Map<string, number> {
  const conta = new Map<string, number>();
  for (const g of grupos) {
    if (novas && g.feita) continue;
    if (CHAVES.some((c) => c !== k && !passa(g, c, f[c], editais))) continue;
    if (k === 'e') {
      editais.forEach((discs, id) => { if (discs.has(g.disciplina ?? '')) conta.set(id, (conta.get(id) ?? 0) + g.n); });
      continue;
    }
    const v = valor(g, k);
    if (v) conta.set(v, (conta.get(v) ?? 0) + g.n);
  }
  return conta;
}

// trocar um filtro limpa os que dependem dele
export function mudar(f: ValoresFiltro, k: Chave, v: string, editais: Map<string, Set<string>>): ValoresFiltro {
  const novo = { ...f, [k]: v };
  if (k === 'd') novo.a = '';
  if (k === 'e' && v && novo.d && !editais.get(v)?.has(novo.d)) { novo.d = ''; novo.a = ''; }
  return novo;
}

export const ROTULOS: Record<Chave, string> = {
  e: 'Edital', d: 'Disciplina', a: 'Assunto', b: 'Banca', t: 'Tipo de questão', o: 'Órgão', c: 'Cargo', y: 'Ano',
  esc: 'Escolaridade', n: 'Dificuldade', or: 'Origem',
};
