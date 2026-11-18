'use client';

import { ESCOLARIDADES, NIVEIS, ORIGENS, TIPOS } from '@/lib/assuntos';
import { bancasPorQuantidade, CHAVES_VISIVEIS, juntar, lista, MULTI, opcoesDe, ROTULOS, type Chave, type EditalFiltro, type Grupo, type ValoresFiltro } from '@/lib/filtros';
import s from '../aluno.module.css';

const ROTULO_VALOR: Partial<Record<Chave, Record<string, string>>> = { t: TIPOS, esc: ESCOLARIDADES, n: NIVEIS, or: ORIGENS };
const QUALQUER: Partial<Record<Chave, string>> = { e: 'Todos os editais', d: 'Todas', a: 'Todos', b: 'Todas', t: 'Todos', o: 'Todos', c: 'Todos', y: 'Todos', esc: 'Todas', n: 'Todas', or: 'Todas' };
const ORDEM_FIXA: Partial<Record<Chave, string[]>> = { t: Object.keys(TIPOS), esc: Object.keys(ESCOLARIDADES), n: Object.keys(NIVEIS), or: Object.keys(ORIGENS) };

export const rotuloDoValor = (k: Chave, v: string, editais: EditalFiltro[]) =>
  k === 'e' ? editais.find((e) => e.id === v)?.nome ?? 'Edital' : ROTULO_VALOR[k]?.[v] ?? v;

// Os campos de filtro do banco. O edital escolhe uma opção; banca, ano, disciplina, assunto, tipo e dificuldade aceitam
// várias ao mesmo tempo (caixinhas). Cada lista mostra só o que existe com os outros filtros e quantas questões tem.
// Nada é aplicado enquanto o aluno não clicar no botão do formulário.
export function CamposFiltro({ grupos, editais, mapa, f, muda, novas = false, prefixo, nomes = true }: {
  grupos: Grupo[]; editais: EditalFiltro[]; mapa: Map<string, Set<string>>; f: ValoresFiltro;
  muda: (k: Chave, v: string) => void; novas?: boolean; prefixo: string; nomes?: boolean;
}) {
  const ordemBancas = bancasPorQuantidade(grupos);

  const campo = (k: Chave) => {
    const conta = opcoesDe(k, grupos, f, mapa, novas);
    const marcados = lista(f[k]);
    let chaves: string[];
    if (k === 'e') chaves = editais.map((e) => e.id).filter((id) => conta.has(id));
    else if (k === 'b') chaves = ordemBancas.filter((b) => conta.has(b) || marcados.includes(b));
    else if (ORDEM_FIXA[k]) chaves = ORDEM_FIXA[k]!.filter((v) => conta.has(v));
    else if (k === 'y') chaves = Array.from(conta.keys()).sort((a, b) => b.localeCompare(a));
    else chaves = Array.from(conta.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    marcados.forEach((m) => { if (!chaves.includes(m)) chaves.unshift(m); });
    // filtro com uma opção só (ou nenhuma) não ajuda: fica escondido, a menos que esteja em uso (banca sempre aparece)
    if (chaves.length <= 1 && !marcados.length && k !== 'd' && k !== 'e' && k !== 'b') return null;
    if (k === 'e' && !editais.length) return null;
    if (k === 'a' && !marcados.length && !lista(f.d).length && chaves.length > 40) return null;   // assunto só depois da disciplina, quando são muitos
    const id = `${prefixo}${k}`;

    if (!MULTI.includes(k)) {
      return (
        <div className="campo" key={k}>
          <label htmlFor={id}>{ROTULOS[k]}</label>
          <select id={id} name={nomes ? k : undefined} value={f[k]} onChange={(e) => muda(k, e.target.value)}>
            <option value="">{QUALQUER[k] ?? 'Todos'}</option>
            {chaves.map((v) => <option key={v} value={v}>{rotuloDoValor(k, v, editais)} ({conta.get(v) ?? 0})</option>)}
          </select>
        </div>
      );
    }
    const resumo = marcados.length === 0 ? QUALQUER[k] ?? 'Todos' : marcados.length === 1 ? rotuloDoValor(k, marcados[0], editais) : `${marcados.length} escolhidos`;
    const alterna = (v: string) => muda(k, juntar(marcados.includes(v) ? marcados.filter((x) => x !== v) : [...marcados, v]));
    return (
      <div className="campo" key={k}>
        <span id={`${id}-r`} className={s.multiRotulo}>{ROTULOS[k]}</span>
        <details className={s.multi}>
          <summary aria-labelledby={`${id}-r`}><span>{resumo}</span></summary>
          <div className={s.multiLista} role="group" aria-labelledby={`${id}-r`}>
            {chaves.map((v) => (
              <label key={v} className={s.multiOpcao}>
                <input type="checkbox" checked={marcados.includes(v)} onChange={() => alterna(v)} />
                <span>{rotuloDoValor(k, v, editais)}</span><em>{conta.get(v) ?? 0}</em>
              </label>
            ))}
            {marcados.length > 0 && <button type="button" className={s.multiLimpar} onClick={() => muda(k, '')}>Limpar {ROTULOS[k].toLowerCase()}</button>}
          </div>
        </details>
        {nomes && <input type="hidden" name={k} value={f[k]} />}
      </div>
    );
  };

  return <>{CHAVES_VISIVEIS.map(campo)}</>;
}

// Filtros escolhidos até agora, em etiquetas que dá para tirar com o ×
export function EtiquetasFiltro({ f, muda, editais }: { f: ValoresFiltro; muda: (k: Chave, v: string) => void; editais: EditalFiltro[] }) {
  const itens: { k: Chave; v: string }[] = [];
  CHAVES_VISIVEIS.forEach((k) => (MULTI.includes(k) ? lista(f[k]) : f[k] ? [f[k]] : []).forEach((v) => itens.push({ k, v })));
  if (!itens.length) return <span className={s.etiquetasVazio}>Nenhum filtro escolhido: todas as questões.</span>;
  return (
    <div className={s.etiquetas} aria-label="Filtros escolhidos">
      {itens.map(({ k, v }) => (
        <span key={k + v} className={s.etiqueta}>
          <small>{ROTULOS[k]}</small> {rotuloDoValor(k, v, editais)}
          <button type="button" aria-label={`Tirar ${rotuloDoValor(k, v, editais)}`}
            onClick={() => muda(k, MULTI.includes(k) ? juntar(lista(f[k]).filter((x) => x !== v)) : '')}>×</button>
        </span>
      ))}
    </div>
  );
}
