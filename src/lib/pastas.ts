// Pastas dos cadernos (uma pasta pode ter pastas dentro)
export type Pasta = { id: string; nome: string; pai_id: string | null };
export type PastaNivel = Pasta & { nivel: number };

// lista em ordem de árvore (pasta, depois o que tem dentro), com o nível de cada uma
export function pastasEmOrdem(pastas: Pasta[]): PastaNivel[] {
  const filhos = new Map<string | null, Pasta[]>();
  pastas.forEach((p) => filhos.set(p.pai_id, [...(filhos.get(p.pai_id) ?? []), p]));
  const ids = new Set(pastas.map((p) => p.id));
  const out: PastaNivel[] = [];
  const andar = (pai: string | null, nivel: number) => {
    (filhos.get(pai) ?? []).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach((p) => {
      out.push({ ...p, nivel });
      if (nivel < 8) andar(p.id, nivel + 1);
    });
  };
  andar(null, 0);
  pastas.filter((p) => p.pai_id && !ids.has(p.pai_id) && !out.some((o) => o.id === p.id)).forEach((p) => out.push({ ...p, nivel: 0 }));
  return out;
}

// caminho da raiz até a pasta (para o "Meus cadernos › Direito › Constitucional")
export function caminhoDaPasta(pastas: Pasta[], id: string | null): Pasta[] {
  const por = new Map(pastas.map((p) => [p.id, p]));
  const out: Pasta[] = [];
  let atual = id ? por.get(id) : undefined;
  while (atual && out.length < 10) { out.unshift(atual); atual = atual.pai_id ? por.get(atual.pai_id) : undefined; }
  return out;
}

export const recuo = (nivel: number) => `${'   '.repeat(nivel)}${nivel ? '↳ ' : ''}`;
