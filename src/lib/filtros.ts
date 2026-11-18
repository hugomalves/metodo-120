// Filtros do banco de questões (usados no navegador: banco, montar lista)
// Cada "grupo" é uma combinação de características com quantas questões publicadas existem nela.

export type Grupo = {
  banca: string | null; orgao: string | null; cargo: string | null; ano: number | null; escolaridade: string | null;
  disciplina: string | null; assunto: string | null; tipo: string | null; nivel: string | null; origem: string | null;
  feita: boolean; n: number;
};
export type EditalFiltro = { id: string; nome: string; disciplinas: string[]; banca?: string | null };

// Alguns filtros aceitam vários valores ao mesmo tempo (separados por |): banca, ano, disciplina, assunto, tipo e dificuldade
export const SEP = '|';
export const MULTI: Chave[] = ['b', 'y', 'd', 'a', 't', 'n'];
export const lista = (v: string): string[] => (v ? v.split(SEP).filter(Boolean) : []);
export const juntar = (vs: string[]) => vs.join(SEP);
export const legivel = (v: string) => lista(v).join(', ');

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
  return lista(v).includes(valor(g, k));
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

const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// a banca do edital (ex.: "Instituto AOCP") entre as bancas que existem no banco (ex.: "AOCP")
export function bancaDoEdital(edital: EditalFiltro | undefined, grupos: Grupo[]): string {
  if (!edital?.banca) return '';
  const alvo = norm(edital.banca);
  const existentes = Array.from(new Set(grupos.map((g) => g.banca).filter((b): b is string => !!b)));
  const achada = existentes.find((b) => norm(b) === alvo) ?? existentes.find((b) => alvo.includes(norm(b)) || norm(b).includes(alvo));
  return achada ?? '';
}

// bancas em ordem: as que têm mais questões no banco primeiro
export function bancasPorQuantidade(grupos: Grupo[]): string[] {
  const conta = new Map<string, number>();
  grupos.forEach((g) => { if (g.banca) conta.set(g.banca, (conta.get(g.banca) ?? 0) + g.n); });
  return Array.from(conta.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).map(([b]) => b);
}

// Trocar um filtro limpa os que dependem dele. Escolher um edital já escolhe a banca dele;
// depois o aluno pode trocar a banca à vontade, sem que o edital a desfaça.
export function mudar(f: ValoresFiltro, k: Chave, v: string, editais: Map<string, Set<string>>, ctx?: { editais: EditalFiltro[]; grupos: Grupo[] }): ValoresFiltro {
  const novo = { ...f, [k]: v };
  if (k === 'd') novo.a = '';
  if (k === 'e' && v) {
    const discs = editais.get(v);
    const mantidas = lista(novo.d).filter((d) => discs?.has(d));
    if (mantidas.length !== lista(novo.d).length) { novo.d = juntar(mantidas); novo.a = ''; }
    if (ctx) { const b = bancaDoEdital(ctx.editais.find((e) => e.id === v), ctx.grupos); if (b) novo.b = b; }
  }
  return novo;
}

export const ROTULOS: Record<Chave, string> = {
  e: 'Edital', d: 'Disciplina', a: 'Assunto', b: 'Banca', t: 'Tipo de questão', o: 'Órgão', c: 'Cargo', y: 'Ano',
  esc: 'Escolaridade', n: 'Dificuldade', or: 'Origem',
};
