// O Supabase entrega no máximo 1000 linhas por chamada, mesmo quando o código pede mais (por isso, passando de 1000 questões
// no banco, as últimas "sumiam" das listas e dos filtros). Esta função busca página por página até acabar.
export async function todasAsLinhas<T>(
  buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null }>,
  tamanho = 1000,
  maximo = 100000,
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; de < maximo; de += tamanho) {
    const { data } = await buscar(de, de + tamanho - 1);
    const linhas = data ?? [];
    todas.push(...linhas);
    if (linhas.length < tamanho) break;
  }
  return todas;
}
