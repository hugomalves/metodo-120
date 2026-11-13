'use client';

import { ESCOLARIDADES, NIVEIS, ORIGENS, TIPOS } from '@/lib/assuntos';
import { CHAVES_VISIVEIS, opcoesDe, ROTULOS, type Chave, type EditalFiltro, type Grupo, type ValoresFiltro } from '@/lib/filtros';

const ROTULO_VALOR: Partial<Record<Chave, Record<string, string>>> = { t: TIPOS, esc: ESCOLARIDADES, n: NIVEIS, or: ORIGENS };
const QUALQUER: Partial<Record<Chave, string>> = { e: 'Todos os editais', d: 'Todas', a: 'Todos', b: 'Todas', t: 'Todos', o: 'Todos', c: 'Todos', y: 'Todos', esc: 'Todas', n: 'Todas', or: 'Todas' };
const ORDEM_FIXA: Partial<Record<Chave, string[]>> = { t: Object.keys(TIPOS), esc: Object.keys(ESCOLARIDADES), n: Object.keys(NIVEIS), or: Object.keys(ORIGENS) };

// Os campos de filtro do banco. Cada lista mostra só as opções que existem com os outros filtros escolhidos,
// com a quantidade de questões entre parênteses.
export function CamposFiltro({ grupos, editais, mapa, f, muda, novas = false, prefixo, nomes = true }: {
  grupos: Grupo[]; editais: EditalFiltro[]; mapa: Map<string, Set<string>>; f: ValoresFiltro;
  muda: (k: Chave, v: string) => void; novas?: boolean; prefixo: string; nomes?: boolean;
}) {
  const nomeEdital = new Map(editais.map((e) => [e.id, e.nome]));

  const campo = (k: Chave) => {
    const conta = opcoesDe(k, grupos, f, mapa, novas);
    let chaves: string[];
    if (k === 'e') chaves = editais.map((e) => e.id).filter((id) => conta.has(id));
    else if (ORDEM_FIXA[k]) chaves = ORDEM_FIXA[k]!.filter((v) => conta.has(v));
    else if (k === 'y') chaves = Array.from(conta.keys()).sort((a, b) => b.localeCompare(a));
    else chaves = Array.from(conta.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (f[k] && !chaves.includes(f[k])) chaves = [f[k], ...chaves];
    // filtro com uma opção só (ou nenhuma) não ajuda: fica escondido, a menos que esteja em uso
    if (chaves.length <= 1 && !f[k] && k !== 'd' && k !== 'e') return null;
    if (k === 'e' && !editais.length) return null;
    if (k === 'a' && !f.d && chaves.length > 40) return null;   // assunto só depois da disciplina, quando são muitos
    const rotulo = (v: string) => (k === 'e' ? nomeEdital.get(v) ?? 'Edital' : ROTULO_VALOR[k]?.[v] ?? v);
    const id = `${prefixo}${k}`;
    return (
      <div className="campo" key={k}>
        <label htmlFor={id}>{ROTULOS[k]}</label>
        <select id={id} name={nomes ? k : undefined} value={f[k]} onChange={(e) => muda(k, e.target.value)}>
          <option value="">{QUALQUER[k] ?? 'Todos'}</option>
          {chaves.map((v) => <option key={v} value={v}>{rotulo(v)} ({conta.get(v) ?? 0})</option>)}
        </select>
      </div>
    );
  };

  return <>{CHAVES_VISIVEIS.map(campo)}</>;
}
