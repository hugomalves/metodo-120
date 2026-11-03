'use client';

import { useMemo, useState } from 'react';
import { Formulario } from '@/components/Formulario';
import { contar, mapaEditais, mudar, VAZIO, type EditalFiltro, type Grupo, type ValoresFiltro } from '@/lib/filtros';
import { CamposFiltro } from '../CamposFiltro';
import { criarLista } from '../../actions';
import s from '../../aluno.module.css';

export type { Grupo };

export function MontarLista({ grupos, editais, inicial, maxQtd = 60 }: {
  grupos: Grupo[]; editais: EditalFiltro[]; inicial: Partial<ValoresFiltro>; maxQtd?: number;
}) {
  const mapa = useMemo(() => mapaEditais(editais), [editais]);
  const [f, setF] = useState<ValoresFiltro>({ ...VAZIO, ...Object.fromEntries(Object.entries(inicial).filter(([, v]) => v)) });
  const [novas, setNovas] = useState(false);
  const opcoesQtd = [5, 10, 15, 20, 30, 40, 60].filter((n) => n <= maxQtd);
  const [qtd, setQtd] = useState(Math.min(10, maxQtd));

  const total = useMemo(() => grupos.reduce((t, g) => t + g.n, 0), [grupos]);
  const filtradas = contar(grupos, f, mapa, { novas });
  const nuncaFeitas = contar(grupos, f, mapa, { novas: true });
  const ativos = Object.values(f).filter(Boolean).length + (novas ? 1 : 0);
  const vaiTer = Math.min(qtd, filtradas);
  const pct = total ? Math.max(filtradas ? 2 : 0, Math.round((100 * filtradas) / total)) : 0;

  return (
    <Formulario acao={criarLista} botao={filtradas ? `Montar a lista com ${vaiTer} ${vaiTer === 1 ? 'questão' : 'questões'}` : 'Montar a lista'}
      classeBotao="btn btn-ciano" pendenteTexto="Montando…">
      <div className="ml-contador" role="status" aria-live="polite">
        <div className="ml-numeros">
          <b className="display">{filtradas}</b>
          <span>{ativos ? <>questões com {ativos === 1 ? 'esse filtro' : 'esses filtros'}<br />de {total} no banco</> : <>questões no banco</>}</span>
        </div>
        <span className="ml-barra"><span style={{ width: `${pct}%` }} /></span>
        <span className="ml-nota">
          {filtradas === 0
            ? 'Nenhuma questão com esses filtros. Tire algum filtro para continuar.'
            : filtradas < qtd
              ? `Só há ${filtradas} ${filtradas === 1 ? 'questão' : 'questões'} com esses filtros: a lista terá ${filtradas}.`
              : `Sua lista terá ${qtd} questões, sorteadas entre essas ${filtradas}. ${novas ? '' : `${nuncaFeitas} você ainda não fez, e elas vêm primeiro.`}`}
        </span>
      </div>

      <div className={s.filtrosAluno}>
        <CamposFiltro grupos={grupos} editais={editais} mapa={mapa} f={f} novas={novas} muda={(k, v) => setF((x) => mudar(x, k, v, mapa))} prefixo="ml" />
        <div className="campo">
          <label htmlFor="mlq">Quantidade</label>
          <select id="mlq" name="qtd" value={qtd} onChange={(e) => setQtd(parseInt(e.target.value, 10))}>
            {opcoesQtd.map((n) => <option key={n} value={n}>{n} questões</option>)}
          </select>
        </div>
      </div>
      {maxQtd < 60 && (
        <span className="suave" style={{ fontSize: 13.5 }}>No plano grátis, as listas têm até {maxQtd} questões. <a href="/aluno/planos">Listas maiores no banco completo</a>.</span>
      )}
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
        <input type="checkbox" name="novas" checked={novas} onChange={(e) => setNovas(e.target.checked)}
          style={{ width: 22, height: 22, accentColor: 'var(--ciano)' }} />
        Só questões que eu nunca fiz ({nuncaFeitas})
      </label>
    </Formulario>
  );
}
